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
    const anyTopicExists = await topicRepository.existsAny();
    if (!anyTopicExists) {
      throw new AppException(
        ErrorCode.SYSTEM_ERROR,
        "Hệ thống chưa có chủ đề học tập nào được cấu hình. Vui lòng liên hệ quản trị viên.",
      );
    }

    const topicInProgress =
      await topicRepository.findRandomTopicInProgress(userId);

    if (topicInProgress) {
      return this._buildDailySetForTopic(userId, topicInProgress);
    }

    const freshTopic =
      await topicRepository.findRandomTopicWithUnownedWords(userId);
    if (!freshTopic) {
      return []; //TODO: user học hết từ của toàn bộ hệ thống
    }

    const newWords = await wordRepository.findRandomByTopicExcludingOwned(
      freshTopic.id,
      userId,
      DAILY_TARGET,
    );
    if (newWords.length > 0) {
      await flashcardRepository.bulkInsertNew(userId, freshTopic.id, newWords);
    }

    return flashcardRepository.findAllByUserAndTopic(userId, freshTopic.id);
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

  async getPracticeSet(userId, topicId) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) {
      throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Không tìm thấy chủ đề này",
      );
    }

    return this._buildDailySetForTopic(userId, topic);
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

  async checkDailyCompletion(userId, timezoneOffsetMinutes) {
    const masteredCount = await flashcardRepository.countTodayMastered(
      userId,
      timezoneOffsetMinutes,
    );
    return masteredCount >= DAILY_TARGET;
  }
}

module.exports = new FlashcardService();
