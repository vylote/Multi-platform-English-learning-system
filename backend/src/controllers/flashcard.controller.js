const streakService = require("../services/streak.service");
const flashcardService = require("../services/flashcard.service");
const ApiResponse = require("../common/api-response");
const { ErrorCode } = require("../common/error-code");

class FlashcardController {
  async getMyFlashcards(req, res, next) {
    try {
      const userId = req.user.id;
      const flashcards = await flashcardService.getFlashcardsByUser(userId);
      return res.status(ErrorCode.SUCCESS.statusCode).json(
        ApiResponse.builder()
          .code(ErrorCode.SUCCESS.code)
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
      return res.status(ErrorCode.SUCCESS.statusCode).json(
        ApiResponse.builder()
          .code(ErrorCode.SUCCESS.code)
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
      const { status, timezone_offset } = req.body;

      const flashcard = await flashcardService.updateStatus(userId, id, status);

      let streakData = null;

      if (timezone_offset !== undefined && timezone_offset !== null) {
        const isCompleted = await flashcardService.checkDailyCompletion(
          userId,
          Number(timezone_offset),
        );

        if (isCompleted) {
          streakData = await streakService.recordActivity(
            userId,
            Number(timezone_offset),
          );
        }
      }

      return res.status(ErrorCode.SUCCESS.statusCode).json(
        ApiResponse.builder()
          .code(ErrorCode.SUCCESS.code)
          .message("Cập nhật tiến độ ôn tập thành công")
          .result({
            flashcard: flashcard.toJSON(),
            streak: streakData ? streakData.toJSON() : null,
          })
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
        .status(ErrorCode.SUCCESS.statusCode)
        .json(
          ApiResponse.builder()
            .code(ErrorCode.SUCCESS.code)
            .message("Xóa thẻ ghi nhớ thành công")
            .build(),
        );
    } catch (error) {
      next(error);
    }
  }

  async getPracticeSet(req, res, next) {
    try {
      const userId = req.user.id;
      const { topicId } = req.params;

      const items = await flashcardService.getPracticeSet(userId, topicId);
      return res.status(ErrorCode.SUCCESS.statusCode).json(
        ApiResponse.builder()
          .code(ErrorCode.SUCCESS.code)
          .message("Lấy bộ từ luyện tập thành công")
          .result(items.map((f) => f.toJSON()))
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FlashcardController();
