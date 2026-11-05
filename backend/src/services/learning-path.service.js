const topicRepository = require("../repositories/topic.repository");
const userRepository = require("../repositories/user.repository");
const systemSettingService = require("./system-setting.service");
const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");
const { DIFFICULTY_ORDER } = require("../utils/tier-classifier");

const DEFAULT_VOCAB_WEIGHT = 0.10;
const DEFAULT_EXAM_WEIGHT = 0.45;
const DEFAULT_LESSON_WEIGHT = 0.45;
const DEFAULT_UNLOCK_THRESHOLD = 70;
const DEFAULT_LESSON_PASS_THRESHOLD = 80;
const DEFAULT_EXAM_PASS_THRESHOLD = 8.0;

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

    // Tiến độ phản ánh đầy đủ cả bài học tương tác, bài thi và thẻ từ vựng:
    // Lesson (45%) + Exam (45%) + Vocab SRS (10%)
    return Math.min(
      100,
      Math.round(
        lessonPercent * lessonWeight +
        examPercent * examWeight +
        vocabPercent * vocabWeight
      )
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
      lessonPassThreshold,
      examPassThreshold,
    ] = await Promise.all([
      systemSettingService.get("learning.vocab_weight", DEFAULT_VOCAB_WEIGHT),
      systemSettingService.get("learning.exam_weight", DEFAULT_EXAM_WEIGHT),
      systemSettingService.get("learning.lesson_weight", DEFAULT_LESSON_WEIGHT),
      systemSettingService.get(
        "learning.unlock_threshold",
        DEFAULT_UNLOCK_THRESHOLD,
      ),
      systemSettingService.get(
        "learning.lesson_pass_threshold",
        DEFAULT_LESSON_PASS_THRESHOLD,
      ),
      systemSettingService.get(
        "learning.exam_pass_threshold",
        DEFAULT_EXAM_PASS_THRESHOLD,
      ),
    ]);

    const weights = { vocabWeight, examWeight, lessonWeight };

    const topicsWithMastery = sorted.map((topic) => ({
      ...topic,
      masteryPercent: this.calculateMastery(topic, weights),
    }));

    const path = topicsWithMastery.map((topic, index) => {
      const prevTopic = topicsWithMastery[index - 1];

      // ĐIỀU KIỆN QUA MÀN NGHIÊM TÚC: BẮT BUỘC ĐÁP ỨNG TẤT CẢ (AND), KHÔNG CHO PHÉP NỚI LỎNG:
      // 1. Phải hoàn thành Bài học tương tác đạt điểm giỏi (>= 80%)
      // 2. Phải hoàn thành Bài thi trắc nghiệm chủ đề đạt điểm giỏi (>= 8.0/10)
      // 3. Độ thành thạo tổng hợp của chủ đề đạt chuẩn (>= 70%)
      const hasPassedLesson =
        prevTopic &&
        prevTopic.bestLessonScore !== null &&
        prevTopic.bestLessonScore >= lessonPassThreshold;

      const hasPassedExam =
        prevTopic &&
        prevTopic.bestExamScore !== null &&
        prevTopic.bestExamScore >= examPassThreshold;

      const hasPassedMastery =
        prevTopic && prevTopic.masteryPercent >= unlockThreshold;

      const isPrevPassed =
        prevTopic && hasPassedLesson && hasPassedExam && hasPassedMastery;

      const isUnlocked = isAdmin || index === 0 || Boolean(isPrevPassed);
      return {
        ...topic,
        isUnlocked,
        isCurrent: isUnlocked && topic.masteryPercent < 100,
        requirements: {
          hasPassedLesson:
            topic.bestLessonScore !== null &&
            topic.bestLessonScore >= lessonPassThreshold,
          hasPassedExam:
            topic.bestExamScore !== null &&
            topic.bestExamScore >= examPassThreshold,
          hasPassedMastery: topic.masteryPercent >= unlockThreshold,
          lessonPassThreshold,
          examPassThreshold,
          unlockThreshold,
        },
      };
    });

    return { tier, needsPlacement: !isAdmin && tier === null, path };
  }
}

module.exports = new LearningPathService();
