const kafka = require("../client");
const { LEARNING_ACTIVITY_COMPLETED } = require("../topics");
const wordQuestionRepository = require("../../repositories/word-question.repository");
const wordRepository = require("../../repositories/word.repository");

function cleanMeaning(rawMeaning) {
  if (!rawMeaning) return "";
  let cleaned = rawMeaning.split(/[;\n]/)[0].trim();
  cleaned = cleaned.replace(/^\([^)]+\)\s*/, "").trim();
  if (cleaned.length > 75) {
    cleaned = cleaned.substring(0, 75).trim() + "...";
  }
  return cleaned;
}

async function callAiForWords(words) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || words.length === 0) return [];

  const prompt = `You are an expert Cambridge English exam creator.
Generate exactly ${words.length} multiple-choice English questions to test these ${words.length} vocabulary words:
${words.map((w, i) => `${i + 1}. "${w.word}" (Meaning: ${w.meaning_vi})`).join("\n")}

STRICT REQUIREMENTS:
1. Generate exactly 1 question for each word, in the exact same order.
2. Style: Contextual sentence with fill-in-the-blank (Cloze) where the target word fits in the blank "______", OR natural definition question.
3. 100% IN ENGLISH: Question and all options A, B, C, D must be 100% in natural English.
4. Exactly one correct option. The other 3 options must be plausible English words.
5. Return ONLY a valid JSON object matching:
{
  "questions": [
    {
      "word": "...",
      "question_text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_option": "A"
    }
  ]
}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.6,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Groq status ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content);

  if (!parsed || !Array.isArray(parsed.questions)) {
    throw new Error("Invalid AI questions structure");
  }

  return words.map((targetWord, idx) => {
    const aiQ = parsed.questions[idx] || parsed.questions[0];
    return {
      wordId: targetWord.id,
      questionText: aiQ.question_text || `Which English word means: "${cleanMeaning(targetWord.meaning_vi)}"?`,
      optionA: aiQ.option_a,
      optionB: aiQ.option_b,
      optionC: aiQ.option_c,
      optionD: aiQ.option_d,
      correctOption: ["A", "B", "C", "D"].includes(aiQ.correct_option) ? aiQ.correct_option : "A",
    };
  });
}

const consumer = kafka.consumer({
  groupId: "lesson-ai-pregen-group",
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

async function runLessonAiPregenConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: LEARNING_ACTIVITY_COMPLETED,
    fromBeginning: false,
  });

  console.log(
    `[Kafka Consumer] lesson-ai-pregen-group da san sang lang nghe topic: ${LEARNING_ACTIVITY_COMPLETED}`
  );

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        if (payload.activityType !== "LESSON_COMPLETED") return;

        const currentTopicId = Number(payload.referenceId);
        const nextTopicId = currentTopicId + 1;
        if (nextTopicId > 36) return;

        // Tìm các từ của chủ đề tiếp theo chưa có câu hỏi AI (chuẩn bị 10 câu cho bài học tiếp theo)
        const missingWords = await wordQuestionRepository.findWordsWithoutQuestions(nextTopicId, 10);
        if (!missingWords || missingWords.length === 0) {
          console.log(`[Kafka AI Pregen] Chu de ${nextTopicId} da co du cau hoi AI.`);
          return;
        }

        console.log(`[Kafka AI Pregen] Phat hien ${missingWords.length} tu cua chu de ${nextTopicId} chua co cau hoi. Dang goi AI sinh ngam...`);
        const generated = await callAiForWords(missingWords);
        if (generated.length > 0) {
          await wordQuestionRepository.saveBatch(generated);
          console.log(`[Kafka AI Pregen] Da sinh ngam thanh cong ${generated.length} cau hoi AI cho chu de tiep theo ${nextTopicId}!`);
        }
      } catch (err) {
        console.warn("[Kafka AI Pregen Warning]", err.message);
      }
    },
  });
}

module.exports = { runLessonAiPregenConsumer };

