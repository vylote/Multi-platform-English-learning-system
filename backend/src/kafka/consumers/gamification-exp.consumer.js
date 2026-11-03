const kafka = require("../client");
const topics = require("../topics");
const redisClient = require("../../config/redis");

const consumer = kafka.consumer({
  groupId: "gamification-exp-group",
  allowAutoTopicCreation: true,
});

/**
 * Tính toán số điểm kinh nghiệm (EXP) dựa trên loại hoạt động và kết quả
 */
function calculateExpGained(activityType, score = 0) {
  switch (activityType) {
    case "LESSON_COMPLETED": {
      const baseExp = 50;
      const bonusExp = score >= 80 ? 20 : 0;
      return baseExp + bonusExp;
    }
    case "EXAM_SUBMITTED": {
      // Điểm thi thang 10 -> mỗi điểm tương ứng 10 EXP, tối thiểu 20 EXP
      return Math.max(20, Math.round(Number(score) * 10));
    }
    case "FLASHCARD_REVIEWED": {
      return 15;
    }
    default:
      return 25;
  }
}

async function startGamificationExpConsumer() {
  await consumer.connect();
  console.log("[Kafka Consumer] Đã kết nối Consumer Group: 'gamification-exp-group'");

  await consumer.subscribe({
    topic: topics.LEARNING_ACTIVITY_COMPLETED,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const rawValue = message.value.toString();
      try {
        const payload = JSON.parse(rawValue);
        const { userId, activityType, score = 0 } = payload;

        console.log(
          `\n[Kafka Consumer: Gamification] Nhận sự kiện từ Topic: ${topic} | Partition: ${partition} | Offset: ${message.offset}`
        );

        const expGained = calculateExpGained(activityType, score);

        // 1. Tăng điểm EXP tích lũy cá nhân trong Redis
        const userExpKey = `user:exp:${userId}`;
        const newTotalExp = await redisClient.incrBy(userExpKey, expGained);

        // 2. Cập nhật Bảng xếp hạng tuần (Redis Sorted Set)
        const leaderboardKey = "leaderboard:weekly";
        await redisClient.zIncrBy(leaderboardKey, expGained, String(userId));

        // 3. Tính level người học (100 EXP / Level)
        const level = Math.floor(newTotalExp / 100) + 1;

        console.log(
          `[Kafka Consumer: Gamification Xong] User ID: ${userId} được cộng +${expGained} EXP | Tổng EXP: ${newTotalExp} (Cấp độ: ${level}) | Đã đồng bộ Bảng xếp hạng tuần`
        );
      } catch (err) {
        console.error(
          "[Kafka Consumer: Gamification Error] Lỗi khi xử lý tích lũy EXP:",
          err.message
        );
      }
    },
  });
}

module.exports = {
  startGamificationExpConsumer,
};

