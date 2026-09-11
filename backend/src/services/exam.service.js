const examRepository = require("../repositories/exam.repository");
const streakService = require("./streak.service");
const { ExamReviewItem, ExamResultDetail } = require("../models/exam.model");
const { ErrorCode } = require("../common/error-code");
const AppException = require("../exceptions/app.exception");

const NETWORK_BUFFER_SECONDS = 15; // Khoảng đệm bù độ trễ mạng khi nộp bài

class ExamService {
  async getExamsByTopic(topicId) {
    return examRepository.findByTopic(topicId);
  }

  async getHistory(userId) {
    return examRepository.findHistoryByUser(userId);
  }

  async startExam(userId, examId) {
    const exam = await examRepository.findById(examId);
    if (!exam) {
      throw new AppException(ErrorCode.EXAM_NOT_FOUND);
    }

    const session = await examRepository.createSession(userId, examId);
    const questions = await examRepository.findQuestionsSafe(examId);

    return {
      session_id: session.id,
      started_at: session.started_at,
      duration: exam.duration,
      questions: questions.map((q) => q.toJSON()),
    };
  }

  /**
   * @param answers [{ question_id, selected_option }]
   */
  async submitExam(userId, examId, sessionId, answers, timezoneOffsetMinutes) {
    const exam = await examRepository.findById(examId);
    if (!exam) {
      throw new AppException(ErrorCode.EXAM_NOT_FOUND);
    }

    const session = await examRepository.findSessionById(sessionId, userId);
    if (!session || session.exam_id !== Number(examId)) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy phiên làm bài hợp lệ");
    }
    if (session.status === "SUBMITTED") {
      throw new AppException(ErrorCode.INVALID_DATA, "Bài thi này đã được nộp trước đó");
    }

    // ANTI-CHEAT: tính time_spent dựa trên started_at LƯU Ở SERVER, không tin thời gian client gửi lên
    const now = new Date();
    const startedAt = new Date(session.started_at);
    const timeSpentSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

    const maxAllowedSeconds = exam.duration * 60 + NETWORK_BUFFER_SECONDS;
    if (timeSpentSeconds > maxAllowedSeconds) {
      throw new AppException(
        ErrorCode.EXAM_EXPIRED,
        `Thời gian làm bài đã vượt quá giới hạn cho phép (${exam.duration} phút).`,
      );
    }

    const questionsWithAnswer = await examRepository.findQuestionsWithAnswer(examId);
    const answerMap = new Map(answers.map((a) => [Number(a.question_id), a.selected_option]));

    let correctCount = 0;
    const review = questionsWithAnswer.map((q) => {
      const selected = answerMap.get(q.id) || null;
      const item = new ExamReviewItem({
        question_id: q.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        selected_option: selected,
      });
      if (item.is_correct) correctCount++;
      return item;
    });

    const totalQuestions = questionsWithAnswer.length;
    const score = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 10).toFixed(2)) : 0;

    const client = await examRepository.getClient();
    try {
      await client.query("BEGIN");

      await examRepository.markSessionSubmitted(sessionId, client);
      await examRepository.insertAnswers(sessionId, answers, client);
      await examRepository.insertResult(
        { userId, examId, sessionId, score, timeSpent: timeSpentSeconds },
        client,
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    // Ghi nhận streak SAU KHI commit thành công, không để lỗi streak làm hỏng kết quả bài thi
    if (Number.isInteger(timezoneOffsetMinutes)) {
      try {
        await streakService.recordActivity(userId, timezoneOffsetMinutes);
      } catch (err) {
        console.error("Lỗi ghi nhận streak sau khi nộp bài thi:", err);
      }
    }

    return new ExamResultDetail({
      score,
      correct_count: correctCount,
      total_questions: totalQuestions,
      time_spent: timeSpentSeconds,
      review,
    });
  }
}

module.exports = new ExamService();