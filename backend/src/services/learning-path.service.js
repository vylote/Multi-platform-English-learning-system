const topicRepository = require("../repositories/topic.repository");
const examRepository = require("../repositories/exam.repository");
const userRepository = require("../repositories/user.repository");
const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");

const VOCAB_WEIGHT = 0.7;
const EXAM_WEIGHT = 0.3;
const UNLOCK_THRESHOLD = 60;

const DIFFICULTY_ORDER = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

class LearningPathService {
  calculateMastery({ totalWords, masteredWords, bestExamScore }) {
    const vocabPercent =
      totalWords > 0 ? (masteredWords / totalWords) * 100 : 0;
    const examPercent = bestExamScore !== null ? (bestExamScore / 10) * 100 : 0;
    return Math.round(vocabPercent * VOCAB_WEIGHT + examPercent * EXAM_WEIGHT);
  }

  // Chưa làm placement -> null (coi như chưa xếp hạng, chỉ mở BEGINNER)
  classifyTier(placementScore) {
    if (placementScore === null) return null;
    if (placementScore < 5) return "BEGINNER";
    if (placementScore < 8) return "INTERMEDIATE";
    return "ADVANCED";
  }

  async getMyPlacementTier(userId) {
    const bestScore = await examRepository.findBestScoreByType(
      userId,
      "PLACEMENT",
    );
    return this.classifyTier(bestScore);
  }

  async getLearningPath(userId) {
    const tier = await this.getMyPlacementTier(userId);
    const user = await userRepository.findById(userId);
    if (!user) throw new AppException(ErrorCode.USER_NOT_EXISTED);
    const rawProgress = await topicRepository.getProgressForUser(userId);

    // Chưa làm placement -> chỉ hiện topic BEGINNER, các topic khác ẩn kèm lời nhắc làm bài kiểm tra đầu vào
    const maxAllowedIndex = tier === null ? 0 : DIFFICULTY_ORDER.indexOf(tier);

    const relevantTopics = rawProgress.filter(
      (t) => DIFFICULTY_ORDER.indexOf(t.difficulty) <= maxAllowedIndex,
    );

    const priorityTopicIds = await topicRepository.findPriorityTopicIdsByGoal(
      user.learning_goal,
    );

    const sorted = [...relevantTopics].sort((a, b) => {
      const tierDiff =
        DIFFICULTY_ORDER.indexOf(a.difficulty) -
        DIFFICULTY_ORDER.indexOf(b.difficulty);
      if (tierDiff !== 0) return tierDiff;
      const aPriority = priorityTopicIds.includes(a.id) ? 0 : 1; // so khớp bằng id, không còn title
      const bPriority = priorityTopicIds.includes(b.id) ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.orderIndex - b.orderIndex;
    });

    // Dùng `sorted` thay vì `relevantTopics` để thứ tự ưu tiên theo goal thực sự có tác dụng
    const topicsWithMastery = sorted.map((topic) => ({
      ...topic,
      masteryPercent: this.calculateMastery(topic),
    }));

    const path = topicsWithMastery.map((topic, index) => {
      const prevTopic = topicsWithMastery[index - 1];
      const isUnlocked =
        index === 0 ||
        (prevTopic && prevTopic.masteryPercent >= UNLOCK_THRESHOLD);
      return {
        ...topic,
        isUnlocked,
        isCurrent: isUnlocked && topic.masteryPercent < 100,
      };
    });

    return {
      tier,
      needsPlacement: tier === null,
      path,
    };
  }
}

module.exports = new LearningPathService();
