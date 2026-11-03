require("dotenv").config();
const { ensureTopicsExist } = require("./topics");
const { publishActivityCompleted } = require("./producers/activity.producer");

async function testProduceActivity() {
  await ensureTopicsExist();
  console.log("Đang gửi hoạt động học tập mẫu vào Kafka Cluster...");

  const mockActivity = {
    userId: 2,
    activityType: "LESSON_COMPLETED",
    referenceId: 10,
    score: 90,
    timezoneOffsetMinutes: 420,
    timestamp: Date.now(),
  };

  const ok = await publishActivityCompleted(mockActivity);
  if (ok) {
    console.log(
      "Test Producer thành công! Message đã được đẩy lên Kafka Topic: learning.activity.completed"
    );
    console.log(
      "Kiểm tra Terminal chạy Worker: cả 2 Consumer Groups (streak-tracker-group và gamification-exp-group) sẽ cùng xử lý message này!"
    );
    console.log("Mở http://localhost:8085 (Kafka UI) để xem 2 Consumer Groups tiêu thụ cùng lúc.");
  } else {
    console.error("Gửi message thất bại.");
  }

  process.exit(ok ? 0 : 1);
}

testProduceActivity();

