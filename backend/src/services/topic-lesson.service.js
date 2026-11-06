const wordRepository = require("../repositories/word.repository");
const wordQuestionRepository = require("../repositories/word-question.repository");
const examRepository = require("../repositories/exam.repository");
const lessonRepository = require("../repositories/lesson.repository");
const streakService = require("./streak.service");
const systemSettingService = require("./system-setting.service");
const activityProducer = require("../kafka/producers/activity.producer");
const vocabProducer = require("../kafka/producers/vocab.producer");
const redisClient = require("../config/redis");
const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function cleanMeaning(rawMeaning) {
  if (!rawMeaning) return "";
  let cleaned = rawMeaning.split(/[;\n]/)[0].trim();
  cleaned = cleaned.replace(/^\([^)]+\)\s*/, "").trim();
  if (cleaned.length > 75) {
    cleaned = cleaned.substring(0, 75).trim() + "...";
  }
  return cleaned;
}

class TopicLessonService {
  async _generateAiQuestions(words) {
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
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new Error(`Groq status ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error("Invalid AI questions structure");
    }

    return words.map((targetWord, idx) => {
      const aiQ = parsed.questions[idx] || parsed.questions[0];
      return {
        wordId: targetWord.id,
        word: targetWord.word,
        questionText: aiQ.question_text || `Which English word means: "${cleanMeaning(targetWord.meaning_vi)}"?`,
        optionA: aiQ.option_a,
        optionB: aiQ.option_b,
        optionC: aiQ.option_c,
        optionD: aiQ.option_d,
        correctOption: ["A", "B", "C", "D"].includes(aiQ.correct_option) ? aiQ.correct_option : "A",
      };
    });
  }

  async _generateFallbackQuestions(words) {
    const excludeIds = words.map((w) => w.id);
    const distractorWords = await wordRepository.findDistractorWords(excludeIds, 35);
    const OPTION_LETTERS = ["A", "B", "C", "D"];

    return words.map((targetWord) => {
      const correctWord = targetWord.word.trim();
      const otherLessonWords = words
        .filter((w) => w.id !== targetWord.id)
        .map((w) => w.word.trim());

      const allWrongOptions = Array.from(
        new Set([...otherLessonWords, ...distractorWords]),
      ).filter((w) => w && w.toLowerCase() !== correctWord.toLowerCase());

      const selectedWrong = shuffleArray(allWrongOptions).slice(0, 3);
      const fallbackOptions = ["example", "practice", "lesson"];
      let fbIdx = 0;
      while (selectedWrong.length < 3) {
        selectedWrong.push(fallbackOptions[fbIdx++] || `word_${selectedWrong.length + 1}`);
      }

      const options = shuffleArray([correctWord, ...selectedWrong]);
      const correctIndex = options.indexOf(correctWord);
      const correctOption = OPTION_LETTERS[correctIndex];

      return {
        wordId: targetWord.id,
        word: targetWord.word,
        questionText: `Which English word means: "${cleanMeaning(targetWord.meaning_vi)}"?`,
        optionA: options[0],
        optionB: options[1],
        optionC: options[2],
        optionD: options[3],
        correctOption,
      };
    });
  }

  async getLesson(topicId, userId = null) {
    const wordsPerLesson = await systemSettingService.get("learning.words_per_lesson", 10);
    const words = await wordRepository.findRandomByTopic(topicId, wordsPerLesson);

    if (words.length === 0) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Chủ đề này chưa có từ vựng.",
      );
    }

    // 1. Kiểm tra ngân hàng câu hỏi AI đã lưu trong DB (Tốc độ cực nhanh ~5ms)
    const wordIds = words.map((w) => w.id);
    const existingRows = await wordQuestionRepository.findByWordIds(wordIds);
    const existingMap = new Map(existingRows.map((q) => [q.word_id, q]));

    // Xác định các từ còn thiếu câu hỏi trong DB
    const missingWords = words.filter((w) => !existingMap.has(w.id));

    // 2. Nếu có từ chưa có câu hỏi trong DB -> gọi AI sinh và lưu vào DB
    if (missingWords.length > 0) {
      let newlyGenerated = null;
      try {
        newlyGenerated = await this._generateAiQuestions(missingWords);
      } catch (aiErr) {
        console.warn("[TopicLesson AI Gen Warning - Using fallback]", aiErr.message);
      }

      if (!newlyGenerated || newlyGenerated.length === 0) {
        newlyGenerated = await this._generateFallbackQuestions(missingWords);
      }

      // Lưu các câu hỏi mới vào DB để dùng vĩnh viễn
      try {
        const toSave = newlyGenerated.map((q) => ({
          wordId: q.wordId,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
        }));
        const savedRows = await wordQuestionRepository.saveBatch(toSave);
        savedRows.forEach((r) => {
          existingMap.set(r.wordId, {
            id: r.id,
            word_id: r.wordId,
            question_text: r.questionText,
            option_a: r.optionA,
            option_b: r.optionB,
            option_c: r.optionC,
            option_d: r.optionD,
            correct_option: r.correctOption,
          });
        });
      } catch (saveErr) {
        console.warn("[WordQuestion DB Save Warning]", saveErr.message);
      }
    }

    // 3. Ghép danh sách câu hỏi theo đúng thứ tự 5 từ vựng của bài học
    const finalQuestions = words.map((w) => {
      const q = existingMap.get(w.id);
      return {
        id: q.id,
        word: w.word,
        wordId: w.id,
        questionText: q.question_text,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
        correctOption: q.correct_option,
      };
    });

    // 4. Lưu phiên làm bài trắc nghiệm vào Redis trong 1 giờ để chấm điểm an toàn
    if (userId) {
      const sessionKey = `lesson:quiz:${userId}:${topicId}`;
      await redisClient
        .set(sessionKey, JSON.stringify(finalQuestions), { EX: 3600 })
        .catch((err) => {
          console.warn("[Redis Lesson Session Cache Warning]", err.message);
        });
    }

    return {
      vocabulary: words.map((w) => ({
        wordId: w.id,
        word: w.word,
        pronunciation: w.pronunciation,
        meaningVi: w.meaning_vi,
      })),
      // Ẩn correctOption khi gửi về giao diện người dùng
      questions: finalQuestions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
      })),
      pronunciationWords: words.map((w) => ({
        word: w.word,
        pronunciation: w.pronunciation,
      })),
    };
  }

  gradeQuiz(questionsWithAnswer, answers) {
    const answerMap = new Map(
      answers.map((a) => [Number(a.question_id), a.selected_option]),
    );
    let correctCount = 0;
    for (const q of questionsWithAnswer) {
      const correct = q.correctOption || q.correct_option;
      if (answerMap.get(q.id) === correct) correctCount++;
    }
    return questionsWithAnswer.length > 0
      ? (correctCount / questionsWithAnswer.length) * 100
      : 0;
  }

  async _recordStreakSafely(userId, timezoneOffsetMinutes) {
    if (!Number.isInteger(timezoneOffsetMinutes)) return;
    try {
      await streakService.recordActivity(userId, timezoneOffsetMinutes);
    } catch (err) {
      console.error("Lỗi ghi nhận streak sau khi hoàn thành bài học:", err);
    }
  }

  async completeLesson({
    userId,
    topicId,
    questionIds,
    quizAnswers,
    pronunciationResults,
    timezoneOffsetMinutes,
  }) {
    // 1. Phục hồi danh sách câu hỏi trắc nghiệm đã sinh từ Redis cache
    let questionsWithAnswer = null;
    const sessionKey = `lesson:quiz:${userId}:${topicId}`;
    try {
      const rawSession = await redisClient.get(sessionKey);
      if (rawSession) {
        questionsWithAnswer = JSON.parse(rawSession);
        await redisClient.del(sessionKey);
      }
    } catch (cacheErr) {
      console.warn("[Redis Lesson Cache Read Error]", cacheErr.message);
    }

    // 2. Dự phòng: Nếu Redis hết hạn hoặc dùng đề thi ngân hàng tĩnh cũ
    if (!questionsWithAnswer || questionsWithAnswer.length === 0) {
      questionsWithAnswer =
        await examRepository.findQuestionsByIdsAndTopic(questionIds, topicId);
    }

    if (
      !questionsWithAnswer ||
      questionsWithAnswer.length === 0
    ) {
      throw new AppException(
        ErrorCode.INVALID_DATA,
        "Danh sách câu hỏi không hợp lệ hoặc phiên học đã hết hạn.",
      );
    }

    const quizScore = this.gradeQuiz(questionsWithAnswer, quizAnswers);

    const totalPronounced = pronunciationResults.length;
    const correctPronounced = pronunciationResults.filter(
      (r) => r.isCorrect,
    ).length;
    const pronunciationScore =
      totalPronounced > 0 ? (correctPronounced / totalPronounced) * 100 : 0;

    const attempt = await lessonRepository.saveAttempt({
      userId,
      topicId,
      quizScore: Math.round(quizScore * 100) / 100,
      pronunciationScore: Math.round(pronunciationScore * 100) / 100,
    });

    // Tự động ghi nhận chuỗi ngày học streak khi hoàn thành bài học
    await this._recordStreakSafely(userId, timezoneOffsetMinutes);

    // Bắn event hoạt động học tập hoàn thành vào Kafka Topic (async, non-blocking)
    const combinedScore = (quizScore + pronunciationScore) / 2;
    activityProducer
      .publishActivityCompleted({
        userId,
        activityType: "LESSON_COMPLETED",
        referenceId: Number(topicId),
        score: Math.round((combinedScore + Number.EPSILON) * 100) / 100,
        timezoneOffsetMinutes: Number.isInteger(timezoneOffsetMinutes)
          ? timezoneOffsetMinutes
          : 0,
      })
      .catch((err) => {
        console.warn("[Kafka Activity Publish Error]", err.message);
      });

    // Thu thập các từ học viên làm sai trắc nghiệm hoặc phát âm chưa đạt
    const failedItems = [];

    // Từ làm sai trắc nghiệm
    for (const q of questionsWithAnswer) {
      const selected = quizAnswers.find((a) => Number(a.question_id) === q.id)?.selected_option;
      const correct = q.correctOption || q.correct_option;
      if (selected && selected !== correct && q.word) {
        failedItems.push({
          word: q.word,
          wordId: q.wordId || q.id,
          reason: "Chọn sai từ vựng trong bài trắc nghiệm",
        });
      }
    }

    // Từ phát âm yếu
    for (const item of pronunciationResults.filter((r) => !r.isCorrect)) {
      if (!failedItems.some((f) => f.word.toLowerCase() === item.word.toLowerCase())) {
        failedItems.push({
          word: item.word,
          wordId: null,
          reason: "Phát âm chưa chuẩn trong bài học chủ đề",
        });
      }
    }

    // Bắn event từ vựng yếu vào Kafka Topic vocab.learning.events (chạy nền, không block)
    if (failedItems.length > 0) {
      (async () => {
        try {
          const events = [];
          for (const item of failedItems) {
            let wordObj = await wordRepository.findByExactWord(item.word);
            if (wordObj) {
              events.push({
                userId,
                wordId: wordObj.id,
                word: wordObj.word,
                topicId: Number(topicId),
                eventType: "VOCAB_FAILED",
                mistakeDetail: item.reason,
                timestamp: Date.now(),
              });
            }
          }
          if (events.length > 0) {
            await vocabProducer.publishBatchVocabEvents(events);
          }
        } catch (vocabErr) {
          console.warn("[Kafka Vocab Publish Error]", vocabErr.message);
        }
      })();
    }

    return {
      quizScore: Math.round((quizScore + Number.EPSILON) * 100) / 100,
      pronunciationScore: Math.round((pronunciationScore + Number.EPSILON) * 100) / 100,
      combinedScore: Math.round((combinedScore + Number.EPSILON) * 100) / 100,
      completedAt: attempt.completed_at,
    };
  }
}

module.exports = new TopicLessonService();
