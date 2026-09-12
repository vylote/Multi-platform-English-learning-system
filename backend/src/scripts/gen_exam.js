/**
 * Script sinh câu hỏi trắc nghiệm tiếng Anh bằng Groq API (free) và đẩy vào DB.
 *
 * Chuẩn bị:
 *   1. Lấy API key free tại https://console.groq.com/keys
 *   2. export GROQ_API_KEY=xxxxx   (hoặc để trong .env rồi require('dotenv').config())
 *   3. Chỉnh 2 đường dẫn require() bên dưới cho khớp cấu trúc project của bạn.
 *
 * Cách dùng:
 *   node scripts/gen_exam.js
 *   node scripts/gen_exam.js --topics=1-36 --count=10 --duration=15
 *   node scripts/gen_exam.js --topics=5 --force
 *
 * Options:
 *   --topics   "1-36" (khoảng) hoặc "1,3,7" (danh sách). Mặc định: 1-36
 *   --count    số câu hỏi/đề. Mặc định: 10
 *   --duration thời gian làm bài (phút). Mặc định: 15
 *   --force    tạo thêm đề mới dù topic đã có đề rồi (mặc định sẽ bỏ qua topic đã có đề)
 */

require("dotenv").config();
const db = require("../config/db");
const topicRepository = require("../repositories/topic.repository");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b"; // llama-3.3-70b-versatile đã chuyển Enterprise-only, không dùng được ở free tier nữa

// Tự nhận diện provider theo tiền tố key để tránh nhầm Groq (gsk_...) với xAI/Grok (xai-...)
const isXai = GROQ_API_KEY && GROQ_API_KEY.startsWith("xai-");
const GROQ_URL = isXai
  ? "https://api.x.ai/v1/chat/completions"
  : "https://api.groq.com/openai/v1/chat/completions";
const ACTIVE_MODEL = isXai ? process.env.GROQ_MODEL || "grok-4-fast" : GROQ_MODEL;

if (isXai) {
  console.log("⚠️  Phát hiện key xAI (xai-...) — script sẽ gọi api.x.ai thay vì api.groq.com.");
}

if (!GROQ_API_KEY) {
  console.error(
    "❌ Thiếu GROQ_API_KEY. Lấy free tại https://console.groq.com/keys rồi thêm vào .env"
  );
  process.exit(1);
}

// DEBUG: xác nhận key có nạp đúng không (xóa dòng này sau khi hết lỗi 401)
console.log("DEBUG key:", GROQ_API_KEY.slice(0, 8) + "..." + GROQ_API_KEY.slice(-4));

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

  let topicIds;
  if (args.topics && args.topics !== true) {
    if (args.topics.includes("-")) {
      const [from, to] = args.topics.split("-").map(Number);
      topicIds = Array.from({ length: to - from + 1 }, (_, i) => from + i);
    } else {
      topicIds = args.topics.split(",").map(Number);
    }
  } else {
    topicIds = Array.from({ length: 36 }, (_, i) => i + 1); // mặc định 1-36
  }

  return {
    topicIds,
    count: Number(args.count) || 10,
    duration: Number(args.duration) || 15,
    force: !!args.force,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildPrompt(topic, count) {
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
    {
      "question_text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_option": "A"
    }
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
  const { rows } = await db.query("SELECT id FROM exams WHERE topic_id = $1 LIMIT 1", [topicId]);
  return rows[0] || null;
}

// Tạo exam + insert toàn bộ câu hỏi trong 1 transaction (giống pattern seed script)
// -> nếu 1 câu lỗi, ROLLBACK toàn bộ, không để lại exam mồ côi hoặc câu hỏi thiếu.
async function saveExamWithQuestions(topic, duration, questions) {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const examRes = await client.query(
      `INSERT INTO exams (topic_id, title, duration) VALUES ($1, $2, $3) RETURNING id`,
      [topic.id, `Đề thi: ${topic.title}`, duration]
    );
    const examId = examRes.rows[0].id;

    for (const q of questions) {
      await client.query(
        `INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [examId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option]
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
// Main
// ---------------------------------------------------------------------------
async function main() {
  const { topicIds, count, duration, force } = parseArgs();
  console.log(`Sinh câu hỏi cho ${topicIds.length} chủ đề, mỗi đề ${count} câu (model: ${ACTIVE_MODEL})...\n`);

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
      const prompt = buildPrompt(topic, count);
      const parsed = await callGroq(prompt);
      const questions = validateQuestions(parsed);

      const examId = await saveExamWithQuestions(topic, duration, questions);

      console.log(`   ✅ Tạo đề id=${examId} với ${questions.length} câu hỏi.`);
      okCount++;
    } catch (err) {
      console.error(`   ❌ Lỗi: ${err.message}`);
      failCount++;
    }

    // Free tier Groq có giới hạn request/phút -> nghỉ giữa các lần gọi để tránh 429
    await sleep(2500);
  }

  console.log(`\nHoàn tất. Thành công: ${okCount}, thất bại: ${failCount}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Lỗi không xử lý được:", err);
  process.exit(1);
});