const kafka = require("../client");
const topics = require("../topics");
const redisClient = require("../../config/redis");

const consumer = kafka.consumer({
  groupId: "vocab-analytics-group",
  allowAutoTopicCreation: true,
});

async function startVocabAnalyticsConsumer() {
  await consumer.connect();
  console.log("[Kafka Consumer] Đã kết nối Consumer Group: 'vocab-analytics-group'");

  await consumer.subscribe({
    topic: topics.VOCAB_EVENTS,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const rawValue = message.value.toString();
      try {
        const payload = JSON.parse(rawValue);
        const { userId, wordId, word = "", eventType } = payload;

        if (!wordId) return;

        console.log(
          `\n[Kafka Consumer: Analytics] Nhận sự kiện từ Topic: ${topic} | Partition: ${partition} | Offset: ${message.offset}`
        );

        // 1. Tăng tần suất từ sai trong danh sách cá nhân (Redis Sorted Set)
        const userWeakKey = `analytics:weak_words:user:${userId}`;
        const userFailCount = await redisClient.zIncrBy(
          userWeakKey,
          1,
          String(wordId)
        );

        // 2. Tăng tần suất từ sai trên toàn hệ thống (Global Weak Words)
        const globalWeakKey = "analytics:weak_words:global";
        const globalFailCount = await redisClient.zIncrBy(
          globalWeakKey,
          1,
          String(wordId)
        );

        // 3. Cache nhanh thông tin từ nếu có gửi kèm
        if (word) {
          await redisClient.hSet(`word:meta:${wordId}`, {
            id: String(wordId),
            word: String(word),
          });
        }

        console.log(
          `[Kafka Consumer: Analytics Xong] Từ '${word || wordId}' | Loại lỗi: ${eventType} | Lần sai cá nhân: ${userFailCount} | Toàn hệ thống: ${globalFailCount}`
        );
      } catch (err) {
        console.error(
          "[Kafka Consumer: Analytics Error] Lỗi khi xử lý thống kê từ vựng:",
          err.message
        );
      }
    },
  });
}

module.exports = {
  startVocabAnalyticsConsumer,
};

