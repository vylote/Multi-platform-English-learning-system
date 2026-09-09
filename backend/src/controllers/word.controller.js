const wordService = require("../services/word.service");
const ApiResponse = require("../common/api-response");
const { ErrorCode } = require("../common/error-code");

class WordController {
  
  async searchWords(req, res, next) {
    try {
      const { source, results } = await wordService.searchWords(req.query.q);

      const messageBySource = {
        local: "Tìm kiếm thành công (Dữ liệu nội bộ)",
        external: "Tìm kiếm thành công (Từ điển Online)",
      };

      return res.status(ErrorCode.SUCCESS.statusCode).json(
        ApiResponse.builder()
          .code(ErrorCode.SUCCESS.code)
          .message(messageBySource[source])
          .result(results)
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WordController();