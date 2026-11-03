const kafka = require("../client");
const topics = require("../topics");
const flashcardRepository = require("../../repositories/flashcard.repository");

const consumer = kafka.consumer({
  groupId: "smart-flashcard-enqueue-group",
  allowAutoTopicCreation: true,
});

async function startSmartFlashcardConsumer() {
  await consumer.connect();
  console.log("[Kafka Consumer] Đã kết nối Consumer Group: 'smart-flashcard-enqueue-group'");

  await consumer.subscribe({
    topic: topics.VOCAB_EVENTS,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const rawValue = message.value.toString();
      try {
        const payload = JSON.parse(rawValue);
        const { userId, wordId, topicId, word = "" } = payload;

        if (!userId || !wordId || !topicId) {
          console.warn("[Kafka Consumer: Smart Flashcard] Bỏ qua message thiếu trường bắt buộc:", payload);
          return;
        }

        console.log(
          `\n[Kafka Consumer: Smart Flashcard] Nhận sự kiện từ Topic: ${topic} | Partition: ${partition} | Offset: ${message.offset}`
        );
        console.log(`   - Học viên ID: ${userId} | Từ vựng yếu: '${word}' (Word ID: ${wordId}, Topic: ${topicId})`);

        // Tự động thêm hoặc chuyển trạng thái flashcard sang LEARNING (ưu tiên ôn tập ngắt quãng)
        const flashcard = await flashcardRepository.upsertFailedWordFlashcard(
          userId,
          wordId,
          topicId
        );

        console.log(
          `[Kafka Consumer: Smart Flashcard Xong] Đã tự động đưa từ '${word}' (Flashcard ID: ${flashcard?.id || 'N/A'}) vào bộ ôn tập (Status: LEARNING) cho User ID: ${userId}`
        );
      } catch (err) {
        console.error(
          "[Kafka Consumer: Smart Flashcard Error] Lỗi khi đưa từ vào bộ Flashcard:",
          err.message
        );
      }
    },
  });
}

module.exports = {
  startSmartFlashcardConsumer,
};

