const topicRepository = require("../repositories/topic.repository");
const userRepository = require("../repositories/user.repository");
const systemSettingService = require("./system-setting.service");
const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");
const { DIFFICULTY_ORDER } = require("../utils/tier-classifier");

const DEFAULT_VOCAB_WEIGHT = 0.3;
const DEFAULT_EXAM_WEIGHT = 0.45;
const DEFAULT_LESSON_WEIGHT = 0.25;
const DEFAULT_UNLOCK_THRESHOLD = 60;

class LearningPathService {
  calculateMastery(
    { totalWords, masteredWords, bestExamScore, bestLessonScore },
    weights = {},
  ) {
    const vocabWeight = weights.vocabWeight ?? DEFAULT_VOCAB_WEIGHT;
    const examWeight = weights.examWeight ?? DEFAULT_EXAM_WEIGHT;
    const lessonWeight = weights.lessonWeight ?? DEFAULT_LESSON_WEIGHT;

    const lessonPercent = bestLessonScore !== null ? bestLessonScore : 0;
    const examPercent = bestExamScore !== null ? (bestExamScore / 10) * 100 : 0;
    const vocabPercent =
      totalWords > 0 ? (masteredWords / totalWords) * 100 : 0;

    // Tiến độ phản ánh đầy đủ cả bài học tương tác, bài thi và thẻ từ vựng theo trọng số cấu hình
    const rawMastery =
      lessonPercent * lessonWeight +
      examPercent * examWeight +
      vocabPercent * vocabWeight;

    // Làm tròn tối đa 2 chữ số thập phân (ví dụ: 50.3, 56.75)
    return Math.min(
      100,
      Math.round((rawMastery + Number.EPSILON) * 100) / 100,
    );
  }

  async getLearningPath(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppException(ErrorCode.USER_NOT_EXISTED);

    const isAdmin = user.role === "ADMIN";
    const tier = user.tier || (isAdmin ? "ADVANCED" : null);

    const rawProgress = await topicRepository.getProgressForUser(userId);
    const maxAllowedIndex = isAdmin
      ? DIFFICULTY_ORDER.length - 1
      : tier === null
        ? 0
        : DIFFICULTY_ORDER.indexOf(tier);
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

    const [
      vocabWeight,
      examWeight,
      lessonWeight,
      unlockThreshold,
    ] = await Promise.all([
      systemSettingService.get("learning.vocab_weight", DEFAULT_VOCAB_WEIGHT),
      systemSettingService.get("learning.exam_weight", DEFAULT_EXAM_WEIGHT),
      systemSettingService.get("learning.lesson_weight", DEFAULT_LESSON_WEIGHT),
      systemSettingService.get(
        "learning.unlock_threshold",
        DEFAULT_UNLOCK_THRESHOLD,
      ),
    ]);

    const weights = { vocabWeight, examWeight, lessonWeight };

    const topicsWithMastery = sorted.map((topic) => ({
      ...topic,
      masteryPercent: this.calculateMastery(topic, weights),
    }));

    const path = topicsWithMastery.map((topic, index) => {
      const prevTopic = topicsWithMastery[index - 1];

      // Điều kiện mở khóa theo đúng cấu hình Admin:
      // Chủ đề kế tiếp được mở khóa khi độ thành thạo của chủ đề trước đạt ngưỡng mở khóa do Admin thiết lập
      const isPrevPassed =
        prevTopic && prevTopic.masteryPercent >= unlockThreshold;

      const isUnlocked = isAdmin || index === 0 || Boolean(isPrevPassed);
      return {
        ...topic,
        unlockThreshold,
        isUnlocked,
        isCurrent: isUnlocked && topic.masteryPercent < 100,
      };
    });

    return {
      tier,
      needsPlacement: !isAdmin && tier === null,
      unlockThreshold,
      path,
    };
  }
}

module.exports = new LearningPathService();
