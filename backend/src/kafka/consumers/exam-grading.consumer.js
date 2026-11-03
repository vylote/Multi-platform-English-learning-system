const kafka = require("../client");
const topics = require("../topics");
const redisClient = require("../../config/redis");
const OpenAI = require("openai");

const consumer = kafka.consumer({
  groupId: "exam-ai-evaluation-group",
  allowAutoTopicCreation: true,
});

/**
 * Gọi AI (Groq/LLM) để phân tích lỗi sai và đưa ra lời khuyên cá nhân hóa
 */
async function generateAiFeedback(payload) {
  const { score, totalQuestions, correctCount, wrongQuestions } = payload;

  if (!wrongQuestions || wrongQuestions.length === 0) {
    return {
      status: "PERFECT",
      summary: "Xuất sắc! Bạn đã trả lời đúng toàn bộ câu hỏi trong bài thi này.",
      recommendations: [
        "Bạn đã nắm vững toàn bộ kiến thức của chủ đề này.",
        "Hãy tiếp tục duy trì phong độ và thử thách với các chủ đề có độ khó cao hơn!",
      ],
      detailedAnalysis: [],
    };
  }

  // Nếu có cấu hình GROQ_API_KEY -> gọi Groq LLM
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      });

      const prompt = `Bạn là một trợ lý giáo viên tiếng Anh thông minh. 
Học viên vừa hoàn thành bài thi với kết quả: ${correctCount}/${totalQuestions} câu đúng (${score}/10 điểm).
Dưới đây là danh sách các câu làm sai của học viên:
${JSON.stringify(wrongQuestions, null, 2)}

Hãy phân tích ngắn gọn, súc tích (bằng tiếng Việt):
1. Tóm tắt điểm yếu chính (từ vựng hay ngữ pháp nào học viên hay nhầm lẫn).
2. Lời khuyên khắc phục thiết thực.
3. Giải thích ngắn gọn cho tối đa 3 câu sai tiêu biểu nhất.

Trả về định dạng JSON thuần túy theo mẫu sau:
{
  "summary": "chuỗi nhận xét tổng quan",
  "recommendations": ["lời khuyên 1", "lời khuyên 2"],
  "commonMistakes": "phân tích các bẫy ngữ pháp/từ vựng học viên mắc phải"
}`;

      const completion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Chỉ trả về JSON hợp lệ, không giải thích gì thêm." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = completion.choices[0]?.message?.content;
      const parsed = JSON.parse(content);
      return {
        status: "ANALYZED",
        provider: "Groq AI",
        ...parsed,
      };
    } catch (aiErr) {
      console.warn("[Kafka Consumer AI Warning] Lỗi gọi Groq API, chuyển sang chế độ phân tích Offline:", aiErr.message);
    }
  }

  // Chế độ Offline Fallback (không cần API Key)
  return {
    status: "ANALYZED",
    provider: "Offline Rule Engine",
    summary: `Bạn hoàn thành bài thi với ${correctCount}/${totalQuestions} câu đúng (${score} điểm). Cần chú ý củng cố lại các câu trả lời chưa chính xác.`,
    recommendations: [
      `Ôn lại ${wrongQuestions.length} câu hỏi bạn đã chọn sai bằng cách tra cứu từ điển và học qua Flashcards.`,
      "Luyện tập phát âm và áp dụng từ vựng vào ngữ cảnh câu hoàn chỉnh để ghi nhớ sâu hơn.",
    ],
    commonMistakes: `Học viên nhầm lẫn ở ${wrongQuestions.length} câu hỏi trắc nghiệm ngữ cảnh.`,
  };
}

async function startExamGradingConsumer() {
  await consumer.connect();
  console.log("[Kafka Consumer] Đã kết nối Consumer Group:'exam-ai-evaluation-group'");

  await consumer.subscribe({
    topic: topics.EXAM_SUBMITTED,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const rawValue = message.value.toString();
      try {
        const payload = JSON.parse(rawValue);
        console.log(
          `\n[Kafka Consumer Nhận Việc] Topic: ${topic} | Partition: ${partition} | Offset: ${message.offset}`
        );
        console.log(`   - Học viên ID: ${payload.userId}`);
        console.log(`   - Phiên làm bài ID: ${payload.sessionId}`);
        console.log(`   - Điểm số: ${payload.score}/10 (Số câu sai: ${payload.wrongQuestions?.length || 0})`);
        console.log("   Đang chạy phân tích AI & tạo lộ trình sửa sai ngầm...");

        // 1. Phân tích kết quả bài thi qua AI
        const feedback = await generateAiFeedback(payload);

        // 2. Lưu kết quả AI Feedback vào Redis (Cache 7 ngày)
        const cacheKey = `exam:ai_feedback:${payload.sessionId}`;
        await redisClient.set(cacheKey, JSON.stringify(feedback), {
          EX: 7 * 24 * 3600, // 7 days TTL
        });

        console.log(`[Kafka Consumer Xong Việc] Đã lưu AI Feedback vào Redis:'${cacheKey}'`);
      } catch (err) {
        console.error("[Kafka Consumer Error] Xử lý message thất bại:", err.message);
      }
    },
  });
}

module.exports = {
  startExamGradingConsumer,
};

