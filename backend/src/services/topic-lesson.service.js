const wordRepository = require("../repositories/word.repository");
const examRepository = require("../repositories/exam.repository");
const lessonRepository = require("../repositories/lesson.repository");
const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");

const WORDS_PER_LESSON = 5;
const QUESTIONS_PER_LESSON = 5;

class TopicLessonService {
  async getLesson(topicId) {
    const [words, questions] = await Promise.all([
      wordRepository.findRandomByTopic(topicId, WORDS_PER_LESSON),
      examRepository.findQuestionsForTopicLesson(topicId, QUESTIONS_PER_LESSON),
    ]);

    if (words.length === 0) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Chủ đề này chưa có từ vựng.");
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
      // Từ dùng để luyện phát âm - lấy đúng những từ vừa học ở giai đoạn 1
      pronunciationWords: words.map((w) => w.word),
    };
  }

  gradeQuiz(questionsWithAnswer, answers) {
    const answerMap = new Map(answers.map((a) => [Number(a.question_id), a.selected_option]));
    let correctCount = 0;
    for (const q of questionsWithAnswer) {
      if (answerMap.get(q.id) === q.correct_option) correctCount++;
    }
    return questionsWithAnswer.length > 0 ? (correctCount / questionsWithAnswer.length) * 100 : 0;
  }

  async completeLesson({ userId, topicId, questionIds, quizAnswers, pronunciationResults }) {
    const questionsWithAnswer = await examRepository.findQuestionsByIds(questionIds);
    const quizScore = this.gradeQuiz(questionsWithAnswer, quizAnswers);

    const totalPronounced = pronunciationResults.length;
    const correctPronounced = pronunciationResults.filter((r) => r.isCorrect).length;
    const pronunciationScore = totalPronounced > 0 ? (correctPronounced / totalPronounced) * 100 : 0;

    const attempt = await lessonRepository.saveAttempt({
      userId,
      topicId,
      quizScore: Math.round(quizScore * 100) / 100,
      pronunciationScore: Math.round(pronunciationScore * 100) / 100,
    });

    return {
      quizScore,
      pronunciationScore,
      combinedScore: (quizScore + pronunciationScore) / 2,
      completedAt: attempt.completed_at,
    };
  }
}

module.exports = new TopicLessonService();