require("dotenv").config();
const { ensureTopicsExist } = require("./topics");
const { publishVocabEvent } = require("./producers/vocab.producer");

async function testProduceVocab() {
  await ensureTopicsExist();
  console.log("Đang gửi sự kiện từ vựng yếu mẫu vào Kafka Cluster...");

  const mockVocabEvent = {
    userId: 2,
    wordId: 1, // Từ đầu tiên trong database
    word: "abandon",
    topicId: 1,
    eventType: "VOCAB_FAILED",
    mistakeDetail: "Học viên chọn sai nghĩa trong bài kiểm tra trắc nghiệm",
    timestamp: Date.now(),
  };

  const ok = await publishVocabEvent(mockVocabEvent);
  if (ok) {
    console.log(
      "Test Producer thành công! Message đã được đẩy lên Kafka Topic: vocab.learning.events"
    );
    console.log(
      "Kiểm tra Terminal chạy Worker: cả 2 Consumer Groups (smart-flashcard-enqueue-group và vocab-analytics-group) sẽ cùng xử lý:"
    );
    console.log("   1. Group 'smart-flashcard-enqueue-group': Tự động đưa từ vào Flashcard ôn tập (Status: LEARNING)");
    console.log("   2. Group 'vocab-analytics-group': Tăng tần suất từ yếu cá nhân & toàn hệ thống trên Redis Sorted Set");
    console.log("Mở http://localhost:8085 (Kafka UI) để xem 2 Consumer Groups tiêu thụ cùng lúc.");
  } else {
    console.error("Gửi message thất bại.");
  }

  process.exit(ok ? 0 : 1);
}

testProduceVocab();

