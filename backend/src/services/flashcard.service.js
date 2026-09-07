const flashcardRepository = require("../repositories/flashcard.repository");
const wordService = require("./word.service");
const { ErrorCode } = require("../common/error-code");
const AppException = require("../exceptions/app.exception");

class FlashcardService {
  async addFlashcard(userId, payload) {
    const { word_id, word, pronunciation, part_of_speech, definition, example_sentence, topic_id } = payload;

    if (!topic_id) {
      throw new AppException(ErrorCode.INVALID_DATA, "Yêu cầu cung cấp topic_id để phân loại thẻ ghi nhớ");
    }

    const client = await flashcardRepository.getClient();
    try {
      await client.query("BEGIN");

      let targetWordId = word_id;

      if (!targetWordId && word) {
        targetWordId = await wordService.upsertWord(
          { word, pronunciation, part_of_speech, definition, example_sentence },
          client,
        );
      }

      if (!targetWordId) {
        await client.query("ROLLBACK");
        throw new AppException(
          ErrorCode.INVALID_DATA,
          "Yêu cầu cung cấp id từ vựng hoặc thông tin chi tiết từ vựng để lưu trữ",
        );
      }

      const flashcard = await flashcardRepository.insert({ userId, wordId: targetWordId, topicId: topic_id }, client);

      if (!flashcard) {
        await client.query("ROLLBACK");
        throw new AppException(ErrorCode.RESOURCE_EXISTED, "Từ vựng này đã tồn tại trong danh sách Flashcards của bạn");
      }

      await client.query("COMMIT");
      return flashcard;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {
        /* transaction có thể đã rollback trước đó */
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async getFlashcardsByUser(userId) {
    return flashcardRepository.findByUser(userId);
  }
}

module.exports = new FlashcardService();