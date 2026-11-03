const gamificationService = require("../services/gamification.service");
const ApiResponse = require("../common/api-response");
const { ErrorCode } = require("../common/error-code");

class GamificationController {
  async getLeaderboard(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const leaderboard = await gamificationService.getWeeklyLeaderboard(limit);

      return res
        .status(ErrorCode.SUCCESS.statusCode)
        .json(
          ApiResponse.builder()
            .code(ErrorCode.SUCCESS.code)
            .message("Lấy bảng xếp hạng tuần thành công")
            .result(leaderboard)
            .build()
        );
    } catch (error) {
      next(error);
    }
  }

  async getMyStats(req, res, next) {
    try {
      const userId = req.user.id;
      const stats = await gamificationService.getUserStats(userId);

      return res
        .status(ErrorCode.SUCCESS.statusCode)
        .json(
          ApiResponse.builder()
            .code(ErrorCode.SUCCESS.code)
            .message("Lấy thông tin cấp độ & EXP thành công")
            .result(stats)
            .build()
        );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GamificationController();

