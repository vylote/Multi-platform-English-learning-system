const wordRepository = require("../repositories/word.repository");
const examRepository = require("../repositories/exam.repository");
const lessonRepository = require("../repositories/lesson.repository");
const streakService = require("./streak.service");
const systemSettingService = require("./system-setting.service");
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

    return {
      quizScore,
      pronunciationScore,
      combinedScore: (quizScore + pronunciationScore) / 2,
      completedAt: attempt.completed_at,
    };
  }
}

module.exports = new TopicLessonService();