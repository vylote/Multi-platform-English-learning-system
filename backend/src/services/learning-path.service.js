const topicRepository = require("../repositories/topic.repository");
const userRepository = require("../repositories/user.repository");
const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");
const { DIFFICULTY_ORDER } = require("../utils/tier-classifier");

const VOCAB_WEIGHT = 0.5;
const EXAM_WEIGHT = 0.25;
const LESSON_WEIGHT = 0.25;
const UNLOCK_THRESHOLD = 60;

class LearningPathService {
  calculateMastery({
    totalWords,
    masteredWords,
    bestExamScore,
    bestLessonScore,
  }) {
    const vocabPercent =
      totalWords > 0 ? (masteredWords / totalWords) * 100 : 0;
    const examPercent = bestExamScore !== null ? (bestExamScore / 10) * 100 : 0;
    const lessonPercent = bestLessonScore !== null ? bestLessonScore : 0; // đã là % sẵn (0-100)
    return Math.round(
      vocabPercent * VOCAB_WEIGHT +
        examPercent * EXAM_WEIGHT +
        lessonPercent * LESSON_WEIGHT,
    );
  }

  async getLearningPath(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppException(ErrorCode.USER_NOT_EXISTED);

    const tier = user.tier;

    const rawProgress = await topicRepository.getProgressForUser(userId);
    const maxAllowedIndex = tier === null ? 0 : DIFFICULTY_ORDER.indexOf(tier);
    const relevantTopics = rawProgress.filter(
      (t) => DIFFICULTY_ORDER.indexOf(t.difficulty) <= maxAllowedIndex,
    );

    const priorityTopicIds = await topicRepository.findPriorityTopicIdsByGoal(
      user.learning_purpose,
    );

    const sorted = [...relevantTopics].sort((a, b) => {
      const tierDiff =
        DIFFICULTY_ORDER.indexOf(a.difficulty) -
        DIFFICULTY_ORDER.indexOf(b.difficulty);
      if (tierDiff !== 0) return tierDiff;
      const aPriority = priorityTopicIds.includes(a.id) ? 0 : 1;
      const bPriority = priorityTopicIds.includes(b.id) ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.orderIndex - b.orderIndex;
    });

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

    return { tier, needsPlacement: tier === null, path };
  }
}

module.exports = new LearningPathService();
