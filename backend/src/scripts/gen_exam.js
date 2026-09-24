/**
 * Script sinh câu hỏi trắc nghiệm tiếng Anh bằng Groq API (free) và đẩy vào DB.
 *
 * Cách dùng:
 *   node scripts/gen_exam.js --topics=1-36 --count=10 --duration=15
 *   node scripts/gen_exam.js --topics=5 --force
 *   node scripts/gen_exam.js --placement --count=30 --duration=25
 *   node scripts/gen_exam.js --placement --force
 *
 * Options:
 *   --topics    "1-36" (khoảng) hoặc "1,3,7" (danh sách). Bỏ qua nếu dùng --placement
 *   --placement Sinh 1 bài kiểm tra đầu vào (exam_type='PLACEMENT'), trộn độ khó từ topics.difficulty
 *   --count     số câu hỏi/đề. Mặc định: 10 (topic) / 30 (placement)
 *   --duration  thời gian làm bài (phút). Mặc định: 15
 *   --force     tạo thêm đề mới dù đã có (mặc định bỏ qua nếu đã tồn tại)
 */

require("dotenv").config();
const db = require("../config/db");
const topicRepository = require("../repositories/topic.repository");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const isXai = GROQ_API_KEY && GROQ_API_KEY.startsWith("xai-");
const GROQ_URL = isXai
  ? "https://api.x.ai/v1/chat/completions"
  : "https://api.groq.com/openai/v1/chat/completions";
const ACTIVE_MODEL = isXai ? process.env.GROQ_MODEL || "grok-4-fast" : GROQ_MODEL;

if (isXai) {
  console.log("⚠️  Phát hiện key xAI (xai-...) — script sẽ gọi api.x.ai thay vì api.groq.com.");
}

if (!GROQ_API_KEY) {
  console.error("❌ Thiếu GROQ_API_KEY. Lấy free tại https://console.groq.com/keys rồi thêm vào .env");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? true];
    })
  );

  const isPlacement = !!args.placement;

  let topicIds = [];
  if (!isPlacement) {
    if (args.topics && args.topics !== true) {
      if (args.topics.includes("-")) {
        const [from, to] = args.topics.split("-").map(Number);
        topicIds = Array.from({ length: to - from + 1 }, (_, i) => from + i);
      } else {
        topicIds = args.topics.split(",").map(Number);
      }
    } else {
      topicIds = Array.from({ length: 36 }, (_, i) => i + 1);
    }
  }

  return {
    isPlacement,
    topicIds,
    count: Number(args.count) || (isPlacement ? 30 : 10),
    duration: Number(args.duration) || 15,
    force: !!args.force,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildTopicPrompt(topic, count) {
  return `Bạn là chuyên gia ra đề thi tiếng Anh. Hãy sinh đúng ${count} câu hỏi trắc nghiệm tiếng Anh (4 đáp án A/B/C/D, chỉ 1 đáp án đúng) cho chủ đề: "${topic.title}"${
    topic.description ? ` (mô tả: ${topic.description})` : ""
  }.

Yêu cầu:
- Trình độ: trung cấp (intermediate), phù hợp người Việt học tiếng Anh.
- Có thể hỏi về từ vựng, ngữ pháp, hoặc cách dùng liên quan chủ đề trên.
- Không trùng lặp câu hỏi, không trùng lặp đáp án trong cùng một câu.
- Chỉ trả về JSON hợp lệ, không kèm giải thích, không markdown code block.

Định dạng JSON bắt buộc:
{
  "questions": [
    { "question_text": "...", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...", "correct_option": "A" }
  ]
}`;
}

function buildPlacementPrompt(topicsByTier, count) {
  const perTier = Math.floor(count / 3);
  const lastTierCount = count - perTier * 2; // dồn phần dư vào tier khó nhất

  const listTitles = (tier) =>
    (topicsByTier[tier] || []).map((t) => t.title).join(", ") || "(chủ đề tổng quát)";

  return `Bạn là chuyên gia ra đề kiểm tra đầu vào (placement test) tiếng Anh, dùng để phân loại trình độ người học thành BEGINNER / INTERMEDIATE / ADVANCED.

Hãy sinh đúng ${count} câu hỏi trắc nghiệm (4 đáp án A/B/C/D, chỉ 1 đáp án đúng), chia theo độ khó TĂNG DẦN, mỗi câu liên quan tới từ vựng/ngữ pháp phù hợp chủ đề gợi ý:

- ${perTier} câu MỨC DỄ (beginner) - chủ đề gợi ý: ${listTitles("BEGINNER")}
- ${perTier} câu MỨC TRUNG BÌNH (intermediate) - chủ đề gợi ý: ${listTitles("INTERMEDIATE")}
- ${lastTierCount} câu MỨC KHÓ (advanced) - chủ đề gợi ý: ${listTitles("ADVANCED")}

Yêu cầu:
- Sắp xếp câu hỏi trong JSON theo đúng thứ tự TỪ DỄ ĐẾN KHÓ (câu 1 dễ nhất, câu cuối khó nhất).
- Không trùng lặp câu hỏi, không trùng lặp đáp án trong cùng một câu.
- Chỉ trả về JSON hợp lệ, không kèm giải thích, không markdown code block.

Định dạng JSON bắt buộc:
{
  "questions": [
    { "question_text": "...", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...", "correct_option": "A" }
  ]
}`;
}

async function callGroq(prompt, { retries = 3 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: ACTIVE_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) {
      const wait = 3000 * attempt;
      console.warn(`   ⏳ Bị rate limit, chờ ${wait}ms rồi thử lại (${attempt}/${retries})...`);
      await sleep(wait);
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Groq API lỗi ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq trả về nội dung rỗng");

    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error(`Không parse được JSON từ Groq: ${content.slice(0, 300)}`);
    }
  }
  throw new Error("Hết số lần thử do bị rate limit liên tục");
}

function validateQuestions(parsed) {
  if (!parsed || !Array.isArray(parsed.questions)) {
    throw new Error("JSON trả về không có mảng 'questions'");
  }
  const valid = [];
  for (const q of parsed.questions) {
    const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
    const ok =
      typeof q.question_text === "string" &&
      q.question_text.trim().length > 0 &&
      opts.every((o) => typeof o === "string" && o.trim().length > 0) &&
      ["A", "B", "C", "D"].includes(q.correct_option) &&
      new Set(opts.map((o) => o.trim().toLowerCase())).size === 4;
    if (ok) valid.push(q);
  }
  if (valid.length === 0) throw new Error("Không có câu hỏi hợp lệ nào trong JSON trả về");
  return valid;
}

// ---------------------------------------------------------------------------
// DB
// ---------------------------------------------------------------------------
async function examExistsForTopic(topicId) {
  const { rows } = await db.query(
    "SELECT id FROM exams WHERE topic_id = $1 AND exam_type = 'TOPIC' LIMIT 1",
    [topicId],
  );
  return rows[0] || null;
}

async function placementExamExists() {
  const { rows } = await db.query("SELECT id FROM exams WHERE exam_type = 'PLACEMENT' LIMIT 1");
  return rows[0] || null;
}

// Tạo exam + insert toàn bộ câu hỏi trong 1 transaction - dùng chung cho cả TOPIC lẫn PLACEMENT
async function saveExam({ topicId, title, duration, examType, questions }) {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const examRes = await client.query(
      `INSERT INTO exams (topic_id, title, duration, exam_type) VALUES ($1, $2, $3, $4) RETURNING id`,
      [topicId, title, duration, examType],
    );
    const examId = examRes.rows[0].id;

    for (const q of questions) {
      await client.query(
        `INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [examId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option],
      );
    }

    await client.query("COMMIT");
    return examId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// Placement flow
// ---------------------------------------------------------------------------
async function runPlacementGeneration({ count, duration, force }) {
  if (!force) {
    const existing = await placementExamExists();
    if (existing) {
      console.log(`Bài Placement đã tồn tại (id=${existing.id}), bỏ qua. Dùng --force để tạo lại.`);
      return;
    }
  }

  console.log("Đang lấy mẫu chủ đề theo từng mức độ khó...");
  const [beginnerTopics, intermediateTopics, advancedTopics] = await Promise.all([
    topicRepository.findSampleByDifficulty("BEGINNER", 5),
    topicRepository.findSampleByDifficulty("INTERMEDIATE", 5),
    topicRepository.findSampleByDifficulty("ADVANCED", 5),
  ]);

  const topicsByTier = { BEGINNER: beginnerTopics, INTERMEDIATE: intermediateTopics, ADVANCED: advancedTopics };

  if (beginnerTopics.length === 0 && intermediateTopics.length === 0 && advancedTopics.length === 0) {
    console.error("Không tìm thấy topic nào có difficulty được gán. Chạy migration + UPDATE topics.difficulty trước.");
    return;
  }

  console.log(`Đang sinh ${count} câu hỏi Placement qua Groq (${ACTIVE_MODEL})...`);
  try {
    const prompt = buildPlacementPrompt(topicsByTier, count);
    const parsed = await callGroq(prompt);
    const questions = validateQuestions(parsed);

    const examId = await saveExam({
      topicId: null,
      title: "Bài kiểm tra đầu vào (Placement Test)",
      duration,
      examType: "PLACEMENT",
      questions,
    });

    console.log(`✅ Tạo bài Placement id=${examId} với ${questions.length} câu hỏi.`);
  } catch (err) {
    console.error(`❌ Lỗi sinh bài Placement: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Topic flow
// ---------------------------------------------------------------------------
async function runTopicGeneration({ topicIds, count, duration, force }) {
  let okCount = 0;
  let failCount = 0;

  for (const topicId of topicIds) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) {
      console.warn(`[Topic ${topicId}] Không tồn tại, bỏ qua.`);
      continue;
    }

    if (!force) {
      const existing = await examExistsForTopic(topicId);
      if (existing) {
        console.log(`[Topic ${topicId}] "${topic.title}" đã có đề (id=${existing.id}), bỏ qua. Dùng --force để tạo thêm.`);
        continue;
      }
    }

    console.log(`[Topic ${topicId}] "${topic.title}": đang gọi Groq...`);
    try {
      const prompt = buildTopicPrompt(topic, count);
      const parsed = await callGroq(prompt);
      const questions = validateQuestions(parsed);

      const examId = await saveExam({
        topicId: topic.id,
        title: `Đề thi: ${topic.title}`,
        duration,
        examType: "TOPIC",
        questions,
      });

      console.log(`   ✅ Tạo đề id=${examId} với ${questions.length} câu hỏi.`);
      okCount++;
    } catch (err) {
      console.error(`   ❌ Lỗi: ${err.message}`);
      failCount++;
    }

    await sleep(2500);
  }

  console.log(`\nHoàn tất. Thành công: ${okCount}, thất bại: ${failCount}.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const { isPlacement, topicIds, count, duration, force } = parseArgs();

  if (isPlacement) {
    await runPlacementGeneration({ count, duration, force });
  } else {
    console.log(`Sinh câu hỏi cho ${topicIds.length} chủ đề, mỗi đề ${count} câu (model: ${ACTIVE_MODEL})...\n`);
    await runTopicGeneration({ topicIds, count, duration, force });
  }

  await db.pool.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Lỗi không xử lý được:", err);
  try {
    await db.pool.end();
  } catch (_) {
    // Bỏ qua nếu pool đã đóng hoặc lỗi khi đóng - ưu tiên thoát process, không để treo
  }
  process.exit(1);
});