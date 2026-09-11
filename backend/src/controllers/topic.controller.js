const topicService = require("../services/topic.service");
const ApiResponse = require("../common/api-response");
const { ErrorCode } = require("../common/error-code");

class TopicController {
  async getAll(req, res, next) {
    try {
      const topics = await topicService.getAllTopics();
      return res
        .status(ErrorCode.SUCCESS.statusCode)
        .json(
          ApiResponse.builder()
            .code(ErrorCode.SUCCESS.code)
            .message("Lấy danh sách chủ đề thành công")
            .result(topics)
            .build(),
        );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TopicController();
