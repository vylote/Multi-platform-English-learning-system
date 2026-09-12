const examService = require("../services/exam.service");
const ApiResponse = require("../common/api-response");
const { ErrorCode } = require("../common/error-code");
const AppException = require("../exceptions/app.exception");

class ExamController {
  async getExams(req, res, next) {
    try {
      const { topic_id, duration, page, pageSize } = req.query;

      const parsedPage = parseInt(page, 10) || 1;
      const parsedPageSize = parseInt(pageSize, 10) || 10;

      if (parsedPage < 1) {
        throw new AppException(ErrorCode.INVALID_DATA, "page phải >= 1");
      }
      if (parsedPageSize < 1 || parsedPageSize > 100) {
        throw new AppException(
          ErrorCode.INVALID_DATA,
          "pageSize phải trong khoảng 1-100",
        );
      }

      const result = await examService.searchExams({
        topicId: topic_id ? parseInt(topic_id, 10) : null,
        duration: duration ? parseInt(duration, 10) : null,
        page: parsedPage,
        pageSize: parsedPageSize,
      });

      return res
        .status(ErrorCode.SUCCESS.statusCode)
        .json(
          ApiResponse.builder()
            .code(ErrorCode.SUCCESS.code)
            .message("Lấy danh sách đề thi thành công")
            .result(result.toJSON())
            .build(),
        );
    } catch (error) {
      next(error);
    }
  }

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

  async start(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const data = await examService.startExam(userId, id);
      return res
        .status(ErrorCode.CREATED.statusCode)
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

      const result = await examService.submitExam({
        userId,
        examId: id,
        sessionId: session_id,
        answers,
        timezoneOffsetMinutes,
      });

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

  async cancel(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { session_id } = req.body || {};

      if (!session_id) {
        throw new AppException(
          ErrorCode.INVALID_DATA,
          "Yêu cầu cung cấp session_id",
        );
      }

      const result = await examService.cancelExam(userId, id, session_id);
      return res.status(ErrorCode.SUCCESS.statusCode).json(
        ApiResponse.builder()
          .code(ErrorCode.SUCCESS.code)
          .message(
            result.cancelled
              ? "Đã hủy phiên làm bài"
              : "Phiên làm bài không ở trạng thái đang làm dở",
          )
          .result(result)
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExamController();
