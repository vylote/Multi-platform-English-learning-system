const flashcardRepository = require("../repositories/flashcard.repository");
const wordRepository = require("../repositories/word.repository");
const topicRepository = require("../repositories/topic.repository");
const { ErrorCode } = require("../common/error-code");
const AppException = require("../exceptions/app.exception");

const DAILY_TARGET = 10;
const VALID_STATUSES = ["NEW", "LEARNING", "MASTERED"];

class FlashcardService {
  async getFlashcardsByUser(userId) {
    return flashcardRepository.findByUser(userId);
  }

  async getDailySet(userId) {
    const topicInProgress =
      await topicRepository.findRandomTopicInProgress(userId);

    if (topicInProgress) {
      return this._buildDailySetForTopic(userId, topicInProgress);
    }

    const randomTopic = await topicRepository.findRandomTopic();
    if (!randomTopic) {
      throw new AppException(
        ErrorCode.TOPIC_NOT_FOUND
      );
    }

    const newWords = await wordRepository.findRandomByTopicExcludingOwned(
      randomTopic.id,
      userId,
      DAILY_TARGET,
    );
    if (newWords.length > 0) {
      await flashcardRepository.bulkInsertNew(userId, randomTopic.id, newWords);
    }

    return flashcardRepository.findByUserAndTopic(userId, randomTopic.id);
  }

  async _buildDailySetForTopic(userId, topic) {
    const current = await flashcardRepository.findByUserAndTopic(
      userId,
      topic.id,
    );

    if (current.length >= DAILY_TARGET) {
      return current.slice(0, DAILY_TARGET);
    }

    const needed = DAILY_TARGET - current.length;
    const candidateWords = await wordRepository.findRandomByTopicExcludingOwned(
      topic.id,
      userId,
      needed,
    );
    if (candidateWords.length > 0) {
      await flashcardRepository.bulkInsertNew(userId, topic.id, candidateWords);
    }

    return flashcardRepository.findByUserAndTopic(userId, topic.id);
  }

  async updateStatus(userId, flashcardId, newStatus) {
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new AppException(
        ErrorCode.INVALID_DATA,
        `Trạng thái không hợp lệ: ${newStatus}`,
      );
    }

    const updated = await flashcardRepository.updateStatus(
      flashcardId,
      userId,
      newStatus,
    );
    if (!updated) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Không tìm thấy thẻ ghi nhớ hoặc bạn không có quyền chỉnh sửa",
      );
    }
    return updated;
  }

  async deleteFlashcard(userId, flashcardId) {
    const deleted = await flashcardRepository.deleteById(flashcardId, userId);
    if (!deleted) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Không tìm thấy thẻ ghi nhớ hoặc bạn không có quyền xóa",
      );
    }
  }
}

module.exports = new FlashcardService();
