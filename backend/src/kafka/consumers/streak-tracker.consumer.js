const kafka = require("../client");
const topics = require("../topics");
const streakService = require("../../services/streak.service");
const redisClient = require("../../config/redis");

const consumer = kafka.consumer({
  groupId: "streak-tracker-group",
  allowAutoTopicCreation: true,
});

async function startStreakTrackerConsumer() {
  await consumer.connect();
  console.log("[Kafka Consumer] Đã kết nối Consumer Group: 'streak-tracker-group'");

  await consumer.subscribe({
    topic: topics.LEARNING_ACTIVITY_COMPLETED,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const rawValue = message.value.toString();
      try {
        const payload = JSON.parse(rawValue);
        const { userId, timezoneOffsetMinutes = 0, activityType } = payload;

        console.log(
          `\n[Kafka Consumer: Streak] Nhận sự kiện từ Topic: ${topic} | Partition: ${partition} | Offset: ${message.offset}`
        );
        console.log(`   - Học viên ID: ${userId} | Hoạt động: ${activityType}`);

        // Ghi nhận hoạt động vào bảng streak_logs và tính toán trạng thái
        const streakStatus = await streakService.recordActivity(
          userId,
          timezoneOffsetMinutes
        );

        // Lưu trạng thái Streak mới nhất vào Redis Cache (TTL 24 giờ)
        const cacheKey = `streak:cache:${userId}`;
        await redisClient.set(cacheKey, JSON.stringify(streakStatus), {
          EX: 24 * 3600,
        });

        console.log(
          `[Kafka Consumer: Streak Xong] User ID: ${userId} đạt chuỗi: ${streakStatus.currentStreak} ngày liên tiếp (Đã cache vào Redis '${cacheKey}')`
        );
      } catch (err) {
        console.error(
          "[Kafka Consumer: Streak Error] Lỗi khi xử lý tính chuỗi Streak:",
          err.message
        );
      }
    },
  });
}

module.exports = {
  startStreakTrackerConsumer,
};

