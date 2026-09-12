const examRepository = require("../repositories/exam.repository");
const streakService = require("./streak.service");
const { ExamReviewItem, ExamResultDetail } = require("../models/exam.model");
const { ErrorCode } = require("../common/error-code");
const AppException = require("../exceptions/app.exception");
const PageResponse = require("../models/page-response.model");

//TODO: Khoảng đệm bù độ trễ mạng khi nộp bài
const NETWORK_BUFFER_SECONDS = 15;
const DEFAULT_PAGE_SIZE = 10;

class ExamService {
  async getDetailExam(id) {
    const exam = await examRepository.findById(id);

    if (!exam) {
      throw new AppException(ErrorCode.EXAM_NOT_FOUND);
    }

    return exam;
  }

  async searchExams({
    topicId,
    title,
    duration,
    page,
    pageSize = DEFAULT_PAGE_SIZE,
  }) {
    const { exams, totalElements } = await examRepository.search({
      topicId,
      title,
      duration,
      page,
      pageSize,
    });

    return PageResponse.of({
      currentPage: page,
      pageSize,
      totalElements,
      data: exams.map((e) => e.toJSON()),
    });
  }

  async getHistory(userId) {
    return examRepository.findHistoryByUser(userId);
  }

  /**
   * @param {{ userId, examId, page, pageSize }} params
   */
  async startExam(params) {
    const { userId, examId, page, pageSize = DEFAULT_PAGE_SIZE } = params;

    const exam = await examRepository.findById(examId);
    if (!exam) {
      throw new AppException(ErrorCode.EXAM_NOT_FOUND);
    }

    const activeSession = await examRepository.findActiveSession(
      userId,
      examId,
    );
    const session =
      activeSession || (await examRepository.createSession(userId, examId));

    const [questions, totalElements] = await Promise.all([
      examRepository.findQuestionsSafePage(examId, page, pageSize),
      examRepository.countQuestions(examId),
    ]);

    return {
      session_id: session.id,
      started_at: session.started_at,
      duration: exam.duration,
      questions: PageResponse.of({
        currentPage: page,
        pageSize,
        totalElements,
        data: questions.map((q) => q.toJSON()),
      }).toJSON(),
    };
  }

  //TODO: lấy trang câu tiếp theo trong 1 session
  async getQuestionsPage({
    userId,
    examId,
    sessionId,
    page,
    pageSize = DEFAULT_PAGE_SIZE,
  }) {
    const session = await examRepository.findSessionById(sessionId, userId);
    if (!session || session.exam_id !== Number(examId)) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Không tìm thấy phiên làm bài hợp lệ",
      );
    }
    if (session.status !== "IN_PROGRESS") {
      throw new AppException(
        ErrorCode.EXAM_SESSION_INVALID,
        "Phiên làm bài này không còn hoạt động",
      );
    }

    const [questions, totalElements] = await Promise.all([
      examRepository.findQuestionsSafePage(examId, page, pageSize),
      examRepository.countQuestions(examId),
    ]);

    return PageResponse.of({
      currentPage: page,
      pageSize,
      totalElements,
      data: questions.map((q) => q.toJSON()),
    });
  }

  async cancelExam(userId, examId, sessionId) {
    const session = await examRepository.findSessionById(sessionId, userId);
    if (!session || session.exam_id !== Number(examId)) {
      throw new AppException(ErrorCode.EXAM_SESSION_INVALID);
    }
    if (session.status !== "IN_PROGRESS") {
      // Đã SUBMITTED hoặc đã CANCELLED trước đó -> coi như thao tác thừa, không cần lỗi gắt
      return { cancelled: false, status: session.status };
    }

    const cancelled = await examRepository.cancelSession(sessionId, userId);
    return { cancelled, status: "CANCELLED" };
  }

  async _validateAntiCheat(session, exam, examId) {
    if (!session || session.exam_id !== Number(examId)) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Không tìm thấy phiên làm bài hợp lệ",
      );
    }
    if (session.status === "SUBMITTED") {
      throw new AppException(
        ErrorCode.INVALID_DATA,
        "Bài thi này đã được nộp trước đó",
      );
    }
    if (session.status === "CANCELLED") {
      throw new AppException(
        ErrorCode.EXAM_SESSION_INVALID,
        "Phiên làm bài này đã bị hủy",
      );
    }

    const now = new Date();
    const startedAt = new Date(session.started_at);
    const timeSpentSeconds = Math.floor(
      (now.getTime() - startedAt.getTime()) / 1000,
    );

    const maxAllowedSeconds = exam.duration * 60 + NETWORK_BUFFER_SECONDS;
    if (timeSpentSeconds > maxAllowedSeconds) {
      throw new AppException(
        ErrorCode.EXAM_EXPIRED,
        `Thời gian làm bài đã vượt quá giới hạn cho phép (${exam.duration} phút).`,
      );
    }

    return timeSpentSeconds;
  }

  _gradeExam(questionsWithAnswer, answers) {
    const answerMap = new Map(
      answers.map((a) => [Number(a.question_id), a.selected_option]),
    );

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
    const score =
      totalQuestions > 0
        ? Number(((correctCount / totalQuestions) * 10).toFixed(2))
        : 0;

    return { correctCount, totalQuestions, score, review };
  }

  async _recordStreakSafely(userId, timezoneOffsetMinutes) {
    if (!Number.isInteger(timezoneOffsetMinutes)) return;
    try {
      await streakService.recordActivity(userId, timezoneOffsetMinutes);
    } catch (err) {
      console.error("Lỗi ghi nhận streak sau khi nộp bài thi:", err);
    }
  }

  /**
   * @param {{ userId, examId, sessionId, answers, timezoneOffsetMinutes }} params
   */
  async submitExam(params) {
    const { userId, examId, sessionId, answers, timezoneOffsetMinutes } =
      params;

    const exam = await examRepository.findById(examId);
    if (!exam) {
      throw new AppException(ErrorCode.EXAM_NOT_FOUND);
    }

    const session = await examRepository.findSessionById(sessionId, userId);
    const timeSpentSeconds = await this._validateAntiCheat(
      session,
      exam,
      examId,
    );

    const questionsWithAnswer =
      await examRepository.findQuestionsWithAnswer(examId);
    const { correctCount, totalQuestions, score, review } = this._gradeExam(
      questionsWithAnswer,
      answers,
    );

    const client = await examRepository.getClient();
    try {
      await client.query("BEGIN");

      await examRepository.markSessionSubmitted(sessionId, client);
      await examRepository.insertAnswers({ sessionId, answers }, client);
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

    await this._recordStreakSafely(userId, timezoneOffsetMinutes);

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
