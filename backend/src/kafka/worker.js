require("dotenv").config();
const { ensureTopicsExist } = require("./topics");
const { startExamGradingConsumer } = require("./consumers/exam-grading.consumer");
const { startStreakTrackerConsumer } = require("./consumers/streak-tracker.consumer");
const { startGamificationExpConsumer } = require("./consumers/gamification-exp.consumer");
const { startSmartFlashcardConsumer } = require("./consumers/smart-flashcard.consumer");
const { startVocabAnalyticsConsumer } = require("./consumers/vocab-analytics.consumer");
const { runLessonAiPregenConsumer } = require("./consumers/lesson-pregen.consumer");

console.log("=======================================================");
console.log("KHOI DONG KAFKA BACKGROUND WORKER (ANHLINGO EVENT RUNNER)");
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
      runLessonAiPregenConsumer(),
    ]);
    console.log("\nTat ca Kafka Consumers da san sang tiep nhan su kien!\n");
  } catch (err) {
    console.error("Khong the khoi dong Kafka Worker:", err.message);
    process.exit(1);
  }
}

runWorker();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nDang dung Kafka Worker an toan...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nDang dung Kafka Worker an toan...");
  process.exit(0);
});
