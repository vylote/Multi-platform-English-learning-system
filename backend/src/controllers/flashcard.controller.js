const flashcardService = require("../services/flashcard.service");
const ApiResponse = require("../common/api-response");

class FlashcardController {
  /**
   * Thêm một từ vựng mới vào Flashcards (Hỗ trợ tự động lưu từ ngoài vào DB)
   * POST /api/v1/flashcards
   */
  async addFlashcard(req, res, next) {
    try {
      const userId = req.user.id;
      const flashcard = await flashcardService.addFlashcard(userId, req.body);

      return res.status(201).json(
        ApiResponse.builder()
          .code("1000")
          .message("Thêm thẻ ghi nhớ thành công")
          .result(flashcard.toJSON())
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách Flashcards của người dùng hiện tại
   * GET /api/v1/flashcards
   */
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
}

module.exports = new FlashcardController();