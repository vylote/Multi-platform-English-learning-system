const wordRepository = require("../repositories/word.repository");
const examRepository = require("../repositories/exam.repository");
const lessonRepository = require("../repositories/lesson.repository");
const streakService = require("./streak.service");
const systemSettingService = require("./system-setting.service");
const activityProducer = require("../kafka/producers/activity.producer");
const vocabProducer = require("../kafka/producers/vocab.producer");
const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");

class TopicLessonService {
  async getLesson(topicId) {
    const [wordsPerLesson, questionsPerLesson] = await Promise.all([
      systemSettingService.get("learning.words_per_lesson", 5),
      systemSettingService.get("learning.questions_per_lesson", 5),
    ]);

    const [words, questions] = await Promise.all([
      wordRepository.findRandomByTopic(topicId, wordsPerLesson),
      examRepository.findQuestionsForTopicLesson(topicId, questionsPerLesson),
    ]);

    if (words.length === 0) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Chủ đề này chưa có từ vựng.",
      );
    }
    if (questions.length === 0) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Chủ đề này chưa có câu hỏi luyện tập. Cần sinh đề bằng gen_exam.js trước.",
      );
    }

    return {
      vocabulary: words.map((w) => ({
        wordId: w.id,
        word: w.word,
        pronunciation: w.pronunciation,
        meaningVi: w.meaning_vi,
      })),
      // Ẩn correct_option khi trả ra client - chỉ dùng để chấm điểm ở completeLesson()
      questions: questions.map((q) => ({
        id: q.id,
        questionText: q.question_text,
        optionA: q.option_a,
        optionB: q.option_b,
        optionC: q.option_c,
        optionD: q.option_d,
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
      if (answerMap.get(q.id) === q.correct_option) correctCount++;
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
    // Note 2: Xác thực câu hỏi trắc nghiệm phải thuộc đúng chủ đề bài học
    const questionsWithAnswer =
      await examRepository.findQuestionsByIdsAndTopic(questionIds, topicId);

    if (
      !questionsWithAnswer ||
      questionsWithAnswer.length === 0 ||
      questionsWithAnswer.length !== questionIds.length
    ) {
      throw new AppException(
        ErrorCode.INVALID_DATA,
        "Danh sách câu hỏi không hợp lệ hoặc không thuộc chủ đề bài học này.",
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
        score: Math.round(combinedScore),
        timezoneOffsetMinutes: Number.isInteger(timezoneOffsetMinutes)
          ? timezoneOffsetMinutes
          : 0,
      })
      .catch((err) => {
        console.warn("[Kafka Activity Publish Error]", err.message);
      });

    // Bắn event từ vựng phát âm yếu vào Kafka Topic: vocab.learning.events (chạy nền, không block)
    const weakPronunciations = pronunciationResults.filter((r) => !r.isCorrect);
    if (weakPronunciations.length > 0) {
      (async () => {
        try {
          const events = [];
          for (const item of weakPronunciations) {
            const wordObj = await wordRepository.findByExactWord(item.word);
            if (wordObj) {
              events.push({
                userId,
                wordId: wordObj.id,
                word: wordObj.word,
                topicId: Number(topicId),
                eventType: "PRONUNCIATION_WEAK",
                mistakeDetail: "Phát âm chưa chuẩn trong bài học chủ đề",
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
      quizScore,
      pronunciationScore,
      combinedScore,
      completedAt: attempt.completed_at,
    };
  }
}

module.exports = new TopicLessonService();