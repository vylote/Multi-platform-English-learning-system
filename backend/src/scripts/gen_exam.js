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
 *   --sets      số bộ đề/chủ đề. Mặc định: 1 (ví dụ --sets=3 sẽ tạo 3 đề khác nhau cho mỗi chủ đề)
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

if (GROQ_API_KEY) {
  if (isXai) {
    console.log("⚠️  Phát hiện key xAI (xai-...) — script sẽ gọi api.x.ai thay vì api.groq.com.");
  }
} else {
  console.log("ℹ️  Không phát hiện GROQ_API_KEY. Tự động chuyển sang chế độ sinh đề thi trắc nghiệm từ kho từ vựng chuẩn (8,403 từ) trong Database.");
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
    sets: Math.max(1, Number(args.sets || args["exams-per-topic"]) || 1),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildTopicPrompt(topic, count) {
  return `You are an expert Cambridge/IELTS/TOEIC English test creator.
Generate exactly ${count} multiple-choice English questions (4 options A/B/C/D, strictly 1 correct answer) for the topic: "${topic.title}"${
    topic.description ? ` (${topic.description})` : ""
  }.

STRICT REQUIREMENTS:
1. 100% ENGLISH ONLY: Both the question text and all 4 options (A, B, C, D) MUST BE 100% IN ENGLISH. Absolutely DO NOT include any Vietnamese words, sentences, or translations anywhere.
2. Question Styles (mix of the following):
   - Fill-in-the-blank / Contextual sentence (Cloze): e.g. "The manager asked the team to prepare a preliminary ______ before the meeting."
   - Vocabulary definition & usage: e.g. "Which of the following words describes a person/thing that ...?"
   - Synonyms / Contextual meaning: e.g. "Which word is closest in meaning to '...' in the sentence: '...'?"
3. Options:
   - Each option (A, B, C, D) must be a single English word or short English phrase of the same grammatical category.
   - All 4 options must be distinct, valid, plausible English words.
4. Output format: Return ONLY a valid JSON object without markdown code blocks, without extra comments.

Format:
{
  "questions": [
    { "question_text": "...", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...", "correct_option": "A" }
  ]
}`;
}

function buildPlacementPrompt(topicsByTier, count) {
  const perTier = Math.floor(count / 3);
  const lastTierCount = count - perTier * 2;

  const listTitles = (tier) =>
    (topicsByTier[tier] || []).map((t) => t.title).join(", ") || "(general English)";

  return `You are an expert English language examiner designing a formal Placement Test to accurately assess and classify learners into BEGINNER, INTERMEDIATE, and ADVANCED levels.

Generate exactly ${count} multiple-choice English questions (4 options A/B/C/D, strictly 1 correct answer), arranged from EASIEST to HARDEST:
- ${perTier} BEGINNER questions (A1-A2 level): basic grammar, common everyday vocabulary (topics: ${listTitles("BEGINNER")})
- ${perTier} INTERMEDIATE questions (B1-B2 level): prepositions, phrasal verbs, tenses, collocations (topics: ${listTitles("INTERMEDIATE")})
- ${lastTierCount} ADVANCED questions (C1-C2 level): complex grammar, subtle vocabulary nuances, idioms (topics: ${listTitles("ADVANCED")})

STRICT REQUIREMENTS:
1. 100% ENGLISH ONLY: Both question text and all 4 options (A, B, C, D) MUST BE IN ENGLISH. Never use Vietnamese.
2. Order questions strictly from easiest (question 1) to hardest (question ${count}).
3. All 4 options must be distinct, plausible English words or phrases.
4. Output format: Return ONLY valid JSON, no markdown code blocks.

Format:
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
// Sinh câu hỏi trắc nghiệm từ kho từ vựng DB khi không có Groq API Key
// ---------------------------------------------------------------------------
async function generateQuestionsFromDb(topic, count) {
  const { rows: topicWords } = await db.query(
    "SELECT id, word, pronunciation, part_of_speech, meaning_vi FROM words WHERE topic_id = $1",
    [topic.id]
  );

  if (topicWords.length < 4) {
    throw new Error(`Chủ đề "${topic.title}" không đủ từ vựng để tạo 4 lựa chọn (cần ít nhất 4 từ).`);
  }

  const { rows: otherWords } = await db.query(
    "SELECT id, word, meaning_vi, part_of_speech FROM words WHERE topic_id != $1 AND topic_id IS NOT NULL ORDER BY RANDOM() LIMIT 150",
    [topic.id]
  );

  const cleanMeaning = (str) => {
    if (!str) return "";
    const parts = str.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    return parts.slice(0, 2).join(", ");
  };

  // Diverse templates for questions - ALL IN ENGLISH with English choices:
  const TEMPLATES = [
    (w, t, m) => `Which English word means "${m}" in the topic of "${t}"?`,
    (w, t, m) => `Choose the correct word to complete: "The specialist explained the importance of ______ in our ${t.toLowerCase()} study."`,
    (w, t, m) => `Select the English term that matches the following description: "${m}".`,
    (w, t, m) => `Fill in the blank with the appropriate word: "During our discussion about ${t.toLowerCase()}, they focused on '______'."`,
    (w, t, m) => `Which of the following English words corresponds to "${m}"?`,
    (w, t, m) => `Choose the word that correctly fits the context: "We need to understand the concept of ______ before proceeding with the ${t.toLowerCase()} task."`,
  ];

  const shuffledTopicWords = [...topicWords].sort(() => 0.5 - Math.random());
  const selectedWords = shuffledTopicWords.slice(0, Math.min(count, topicWords.length));
  const rawQuestions = [];

  for (let i = 0; i < selectedWords.length; i++) {
    const target = selectedWords[i];
    const meaning = cleanMeaning(target.meaning_vi);
    const templateFn = TEMPLATES[i % TEMPLATES.length];
    const question_text = templateFn(target.word, topic.title, meaning);
    const correctText = target.word;

    // Distractors must be other ENGLISH words from the same topic or other topics:
    const otherEnglishWords = shuffledTopicWords
      .filter((w) => w.id !== target.id)
      .map((w) => w.word)
      .filter((w) => w.toLowerCase() !== correctText.toLowerCase());

    const fallbackWords = otherWords
      .map((w) => w.word)
      .filter((w) => w.toLowerCase() !== correctText.toLowerCase());

    const distractorPool = [...new Set([...otherEnglishWords, ...fallbackWords])];
    distractorPool.sort(() => 0.5 - Math.random());
    const distractors = distractorPool.slice(0, 3);
    if (distractors.length < 3) continue;

    const allOptions = [correctText, ...distractors].sort(() => 0.5 - Math.random());
    const optLetters = ["A", "B", "C", "D"];
    const correctIndex = allOptions.indexOf(correctText);

    rawQuestions.push({
      question_text,
      option_a: allOptions[0],
      option_b: allOptions[1],
      option_c: allOptions[2],
      option_d: allOptions[3],
      correct_option: optLetters[correctIndex],
    });
  }

  return validateQuestions({ questions: rawQuestions });
}

// ---------------------------------------------------------------------------
// Topic flow
// ---------------------------------------------------------------------------
async function runTopicGeneration({ topicIds, count, duration, force, sets = 1 }) {
  let okCount = 0;
  let failCount = 0;

  for (const topicId of topicIds) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) {
      console.warn(`[Topic ${topicId}] Không tồn tại, bỏ qua.`);
      continue;
    }

    if (!force) {
      const { rows: existingExams } = await db.query(
        "SELECT id FROM exams WHERE topic_id = $1 AND exam_type = 'TOPIC'",
        [topicId]
      );
      if (existingExams.length >= sets) {
        console.log(`[Topic ${topicId}] "${topic.title}" đã có ${existingExams.length} đề thi, bỏ qua. Dùng --force để tạo lại.`);
        continue;
      }
    } else {
      // Khi dùng --force, xóa sạch đề cũ và câu hỏi cũ của topic để thay bằng các bộ câu hỏi mới
      const { rows: existingExams } = await db.query(
        "SELECT id FROM exams WHERE topic_id = $1 AND exam_type = 'TOPIC'",
        [topicId]
      );
      for (const ex of existingExams) {
        await db.query("DELETE FROM questions WHERE exam_id = $1", [ex.id]);
        await db.query("DELETE FROM exam_answers WHERE session_id IN (SELECT id FROM exam_sessions WHERE exam_id = $1)", [ex.id]).catch(() => {});
        await db.query("DELETE FROM exam_results WHERE exam_id = $1", [ex.id]).catch(() => {});
        await db.query("DELETE FROM exam_sessions WHERE exam_id = $1", [ex.id]).catch(() => {});
        await db.query("DELETE FROM exams WHERE id = $1", [ex.id]);
      }
    }

    for (let setIdx = 1; setIdx <= sets; setIdx++) {
      try {
        let questions;
        if (GROQ_API_KEY) {
          console.log(`[Topic ${topicId}] "${topic.title}" (Bộ đề ${setIdx}/${sets}): đang gọi Groq...`);
          const prompt = buildTopicPrompt(topic, count);
          const parsed = await callGroq(prompt);
          questions = validateQuestions(parsed);
        } else {
          console.log(`[Topic ${topicId}] "${topic.title}" (Bộ đề ${setIdx}/${sets}): đang sinh câu hỏi chuẩn tiếng Anh từ kho DB...`);
          questions = await generateQuestionsFromDb(topic, count);
        }

        const title = sets > 1 ? `Đề số ${setIdx}: ${topic.title}` : `Đề thi: ${topic.title}`;

        const examId = await saveExam({
          topicId: topic.id,
          title,
          duration,
          examType: "TOPIC",
          questions,
        });

        console.log(`   ✅ Tạo đề id=${examId} "${title}" với ${questions.length} câu hỏi tiếng Anh chuẩn.`);
        okCount++;
      } catch (err) {
        console.error(`   ❌ Lỗi tạo bộ đề ${setIdx}: ${err.message}`);
        failCount++;
      }

      if (GROQ_API_KEY) {
        await sleep(2500);
      }
    }
  }

  console.log(`\nHoàn tất. Thành công: ${okCount}, thất bại: ${failCount}.`);
}


// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const { isPlacement, topicIds, count, duration, force, sets } = parseArgs();

  if (isPlacement) {
    await runPlacementGeneration({ count, duration, force });
  } else {
    console.log(`Sinh câu hỏi cho ${topicIds.length} chủ đề, mỗi chủ đề ${sets} bộ đề, mỗi đề ${count} câu (model: ${ACTIVE_MODEL})...\n`);
    await runTopicGeneration({ topicIds, count, duration, force, sets });
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