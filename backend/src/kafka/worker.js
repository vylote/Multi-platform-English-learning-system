require("dotenv").config();
const { ensureTopicsExist } = require("./topics");
const { startExamGradingConsumer } = require("./consumers/exam-grading.consumer");
const { startStreakTrackerConsumer } = require("./consumers/streak-tracker.consumer");
const { startGamificationExpConsumer } = require("./consumers/gamification-exp.consumer");
const { startSmartFlashcardConsumer } = require("./consumers/smart-flashcard.consumer");
const { startVocabAnalyticsConsumer } = require("./consumers/vocab-analytics.consumer");

console.log("=======================================================");
console.log("KHỞI ĐỘNG KAFKA BACKGROUND WORKER (ANHLINGO EVENT RUNNER)");
console.log("=======================================================\n");

async function runWorker() {
  try {
    // 1. Đảm bảo các topic đã tồn tại trên cụm Kafka và đã bầu Leader
    await ensureTopicsExist();

    // 2. Khởi động tất cả Consumers lắng nghe các nhóm nghiệp vụ độc lập
    console.log("Connecting consumers to Kafka brokers...");
    await Promise.all([
      startExamGradingConsumer(),
      startStreakTrackerConsumer(),
      startGamificationExpConsumer(),
      startSmartFlashcardConsumer(),
      startVocabAnalyticsConsumer(),
    ]);
    console.log("\n Tất cả Kafka Consumers đã sẵn sàng tiếp nhận sự kiện!\n");
  } catch (err) {
    console.error("Không thể khởi động Kafka Worker:", err.message);
    process.exit(1);
  }
}

runWorker();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n Đang dừng Kafka Worker an toàn...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n Đang dừng Kafka Worker an toàn...");
  process.exit(0);
});
