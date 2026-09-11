const examService = require("../services/exam.service");
const ApiResponse = require("../common/api-response");
const { ErrorCode } = require("../common/error-code");
const AppException = require("../exceptions/app.exception");

class ExamController {
  // GET /api/v1/exams?topic_id=X
  async getExams(req, res, next) {
    try {
      const { topic_id } = req.query;
      if (!topic_id) {
        throw new AppException(
          ErrorCode.INVALID_DATA,
          "Yêu cầu cung cấp topic_id",
        );
      }
      const exams = await examService.getExamsByTopic(topic_id);
      return res.status(ErrorCode.SUCCESS.statusCode).json(
        ApiResponse.builder()
          .code(ErrorCode.SUCCESS.code)
          .message("Lấy danh sách đề thi thành công")
          .result(exams.map((e) => e.toJSON()))
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/exams/history
  async getHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const history = await examService.getHistory(userId);
      return res
        .status(ErrorCode.SUCCESS.statusCode)
        .json(
          ApiResponse.builder()
            .code(ErrorCode.SUCCESS.code)
            .message("Lấy lịch sử làm bài thành công")
            .result(history)
            .build(),
        );
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/exams/:id/start
  async start(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const data = await examService.startExam(userId, id);
      return res
        .status(201)
        .json(
          ApiResponse.builder()
            .code(ErrorCode.SUCCESS.code)
            .message("Bắt đầu bài thi thành công")
            .result(data)
            .build(),
        );
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/exams/:id/submit
  async submit(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { session_id, answers, timezone_offset } = req.body || {};

      if (!session_id || !Array.isArray(answers)) {
        throw new AppException(
          ErrorCode.INVALID_DATA,
          "Yêu cầu cung cấp session_id và danh sách answers",
        );
      }

      const timezoneOffsetMinutes = Number.isInteger(timezone_offset)
        ? timezone_offset
        : parseInt(timezone_offset, 10);

      const result = await examService.submitExam(
        userId,
        id,
        session_id,
        answers,
        timezoneOffsetMinutes,
      );
      return res
        .status(ErrorCode.SUCCESS.statusCode)
        .json(
          ApiResponse.builder()
            .code(ErrorCode.SUCCESS.code)
            .message("Nộp bài thi thành công")
            .result(result.toJSON())
            .build(),
        );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExamController();
