const streakService = require("../services/streak.service");
const ApiResponse = require("../common/api-response");
const { ErrorCode } = require("../common/error-code");
const AppException = require("../exceptions/app.exception");

class StreakController {
  async record(req, res, next) {
    try {
      const userId = req.user.id;
      const timezoneOffset = parseInt(req.body?.timezone_offset, 10);

      if (Number.isNaN(timezoneOffset)) {
        throw new AppException(
          ErrorCode.INVALID_DATA,
          "Thiếu hoặc sai định dạng timezone_offset (đơn vị: phút)",
        );
      }

      const status = await streakService.recordActivity(userId, timezoneOffset);
      return res
        .status(ErrorCode.SUCCESS.statusCode)
        .json(
          ApiResponse.builder()
            .code(ErrorCode.SUCCESS.code)
            .message("Ghi nhận hoạt động thành công")
            .result(status.toJSON())
            .build(),
        );
    } catch (error) {
      next(error);
    }
  }

  async status(req, res, next) {
    try {
      const userId = req.user.id;
      const timezoneOffset = parseInt(req.query?.timezone_offset, 10);

      if (Number.isNaN(timezoneOffset)) {
        throw new AppException(
          ErrorCode.INVALID_DATA,
          "Thiếu hoặc sai định dạng timezone_offset (đơn vị: phút)",
        );
      }

      const status = await streakService.getStatus(userId, timezoneOffset);
      return res
        .status(ErrorCode.SUCCESS.statusCode)
        .json(
          ApiResponse.builder()
            .code(ErrorCode.SUCCESS.code)
            .message("Lấy trạng thái streak thành công")
            .result(status.toJSON())
            .build(),
        );
    } catch (error) {
      next(error);
    }
  }

  async week(req, res, next) {
    try {
      const userId = req.user.id;
      const timezoneOffset = parseInt(req.query?.timezone_offset, 10);

      if (Number.isNaN(timezoneOffset)) {
        throw new AppException(
          ErrorCode.INVALID_DATA,
          "Thiếu hoặc sai định dạng timezone_offset (đơn vị: phút)",
        );
      }

      const week = await streakService.getWeekView(userId, timezoneOffset);
      return res
        .status(ErrorCode.SUCCESS.statusCode)
        .json(
          ApiResponse.builder()
            .code(ErrorCode.SUCCESS.code)
            .message("Lấy lịch sử 7 ngày gần nhất thành công")
            .result(week)
            .build(),
        );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StreakController();
