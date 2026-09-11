require("dotenv").config();
const topicRepository = require("../repositories/topic.repository");
const examRepository = require("../repositories/exam.repository");

const GROQ_API_KEY = (process.env.GROQ_API_KEY || "").trim();
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function parseArgs(argv) {
  const args = { count: 10, duration: 15, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--topic-id") args.topicId = parseInt(argv[++i], 10);
    else if (arg === "--count") args.count = parseInt(argv[++i], 10);
    else if (arg === "--duration") args.duration = parseInt(argv[++i], 10);
    else if (arg === "--title") args.title = argv[++i];
    else if (arg === "--dry-run") args.dryRun = true;
  }
  return args;
}

function buildPrompt(topicTitle, count) {
  return `Bạn là chuyên gia soạn đề thi tiếng Anh cho người Việt học tiếng Anh trình độ trung cấp (intermediate).

Hãy tạo ĐÚNG ${count} câu hỏi trắc nghiệm tiếng Anh (4 lựa chọn A/B/C/D, chỉ 1 đáp án đúng) liên quan tới chủ đề: "${topicTitle}".

Yêu cầu:
- Câu hỏi kiểm tra từ vựng, ngữ pháp, hoặc cách dùng từ đúng ngữ cảnh liên quan chủ đề trên.
- Đáp án nhiễu (distractor) phải hợp lý, không quá dễ loại trừ.
- Không lặp lại cấu trúc câu hỏi giữa các câu.
- Trả lời DUY NHẤT bằng JSON hợp lệ, không thêm giải thích, không markdown, theo đúng cấu trúc sau:

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

async function generateQuestions(topicTitle, count) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: buildPrompt(topicTitle, count) }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API lỗi ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq không trả về nội dung.");

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Không parse được JSON từ Groq: " + content.slice(0, 300));
  }

  const questions = Array.isArray(parsed) ? parsed : parsed.questions;
  if (!Array.isArray(questions)) {
    throw new Error("Định dạng JSON trả về không đúng - thiếu mảng 'questions'.");
  }
  return questions;
}

function validateQuestion(q, index) {
  const requiredFields = ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_option"];
  for (const field of requiredFields) {
    if (!q[field] || typeof q[field] !== "string" || !q[field].trim()) {
      throw new Error(`Câu hỏi #${index + 1} thiếu hoặc sai định dạng field "${field}"`);
    }
  }
  const option = q.correct_option.trim().toUpperCase();
  if (!["A", "B", "C", "D"].includes(option)) {
    throw new Error(`Câu hỏi #${index + 1} có correct_option không hợp lệ: "${q.correct_option}"`);
  }
  return {
    question_text: q.question_text.trim(),
    option_a: q.option_a.trim(),
    option_b: q.option_b.trim(),
    option_c: q.option_c.trim(),
    option_d: q.option_d.trim(),
    correct_option: option,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!GROQ_API_KEY) {
    console.error("Lỗi: thiếu GROQ_API_KEY trong file .env");
    return;
  }
  if (!args.topicId) {
    console.error("Lỗi: cần chỉ định --topic-id <id>");
    return;
  }

  const topic = await topicRepository.findById(args.topicId);
  if (!topic) {
    console.error(`Không tìm thấy topic id = ${args.topicId}`);
    return;
  }

  console.log(`Đang sinh ${args.count} câu hỏi cho chủ đề "${topic.title}" qua Groq (${GROQ_MODEL})...`);
  const rawQuestions = await generateQuestions(topic.title, args.count);

  const validated = rawQuestions.map((q, i) => validateQuestion(q, i));
  console.log(`Đã sinh và kiểm tra hợp lệ ${validated.length} câu hỏi.\n`);
  console.log("Câu hỏi đầu tiên (xem trước):");
  console.log(JSON.stringify(validated[0], null, 2));

  if (args.dryRun) {
    console.log("\n[DRY RUN] Chưa ghi vào DB. Bỏ --dry-run để lưu thật.");
    return;
  }

  const title = args.title || `Kiểm tra: ${topic.title}`;
  const examId = await examRepository.createExam({
    topicId: topic.id,
    title,
    duration: args.duration,
  });
  await examRepository.bulkInsertQuestions(examId, validated);

  console.log(`\nHoàn tất! Đã tạo đề thi #${examId} "${title}" với ${validated.length} câu hỏi.`);
}

main().catch((err) => {
  console.error("Lỗi:", err.message);
  process.exit(1);
});