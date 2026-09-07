const wordService = require("../services/word.service");
const ApiResponse = require("../common/api-response");

class DictionaryController {
  
  async searchWords(req, res, next) {
    try {
      const { source, results } = await wordService.searchWords(req.query.q);

      const messageBySource = {
        local: "Tìm kiếm thành công (Dữ liệu nội bộ)",
        external: "Tìm kiếm thành công (Từ điển Online)",
      };

      return res.status(200).json(
        ApiResponse.builder()
          .code("1000")
          .message(messageBySource[source])
          .result(results.map((w) => w.toJSON()))
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DictionaryController();