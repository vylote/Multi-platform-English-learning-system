const learningPathService = require("../services/learning-path.service");
const ApiResponse = require("../common/api-response");
const { ErrorCode } = require("../common/error-code");

class LearningPathController {
  async getMyLearningPath(req, res, next) {
    try {
      const userId = req.user.id;
      const path = await learningPathService.getLearningPath(userId);

      return res
        .status(ErrorCode.SUCCESS.statusCode)
        .json(
          ApiResponse.builder()
            .code(ErrorCode.SUCCESS.code)
            .message("Lấy lộ trình học thành công")
            .result(path)
            .build(),
        );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LearningPathController();
