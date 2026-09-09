const flashcardService = require("../services/flashcard.service");
const ApiResponse = require("../common/api-response");
const { ErrorCode } = require("../common/error-code");
const AppException = require("../exceptions/app.exception");

class FlashcardController {
  async getMyFlashcards(req, res, next) {
    try {
      const userId = req.user.id;
      const flashcards = await flashcardService.getFlashcardsByUser(userId);
      return res.status(200).json(
        ApiResponse.builder()
          .code("1000")
          .message("Lấy danh sách thẻ ghi nhớ thành công")
          .result(flashcards.map((f) => f.toJSON()))
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }

  async getDaily(req, res, next) {
    try {
      const userId = req.user.id;
      const items = await flashcardService.getDailySet(userId);
      return res.status(200).json(
        ApiResponse.builder()
          .code("1000")
          .message("Lấy bộ từ ôn tập hôm nay thành công")
          .result(items.map((f) => f.toJSON()))
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }

  async updateFlashcard(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { status } = req.body;

      const flashcard = await flashcardService.updateStatus(userId, id, status);
      return res
        .status(200)
        .json(
          ApiResponse.builder()
            .code("1000")
            .message("Cập nhật tiến độ ôn tập thành công")
            .result(flashcard.toJSON())
            .build(),
        );
    } catch (error) {
      next(error);
    }
  }

  async deleteFlashcard(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await flashcardService.deleteFlashcard(userId, id);
      return res
        .status(200)
        .json(
          ApiResponse.builder()
            .code("1000")
            .message("Xóa thẻ ghi nhớ thành công")
            .build(),
        );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FlashcardController();
