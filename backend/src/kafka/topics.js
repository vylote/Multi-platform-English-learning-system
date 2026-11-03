const kafka = require("./client");

const TOPIC_NAMES = {
  EXAM_SUBMITTED: "exam.submissions",
  LEARNING_ACTIVITY_COMPLETED: "learning.activity.completed",
  VOCAB_EVENTS: "vocab.learning.events",
};

/**
 * Đảm bảo các topic cốt lõi tồn tại trước khi Producer / Consumer bắt đầu làm việc
 */
async function ensureTopicsExist() {
  const admin = kafka.admin();
  try {
    await admin.connect();
    const existingTopics = await admin.listTopics();

    const requiredTopics = [
      {
        topic: TOPIC_NAMES.EXAM_SUBMITTED,
        numPartitions: 3,
        replicationFactor: 3,
      },
      {
        topic: TOPIC_NAMES.LEARNING_ACTIVITY_COMPLETED,
        numPartitions: 3,
        replicationFactor: 3,
      },
      {
        topic: TOPIC_NAMES.VOCAB_EVENTS,
        numPartitions: 3,
        replicationFactor: 3,
      },
    ];

    const topicsToCreate = requiredTopics.filter(
      (t) => !existingTopics.includes(t.topic)
    );

    if (topicsToCreate.length > 0) {
      console.log(
        `[Kafka Admin] Đang tự động tạo ${topicsToCreate.length} topic: ${topicsToCreate.map((t) => t.topic).join(", ")}...`
      );
      await admin.createTopics({
        topics: topicsToCreate,
        waitForLeaders: true,
      });
      console.log("[Kafka Admin] Đã tạo topic thành công và bầu Leader partitions xong!");
    }
  } catch (err) {
    console.warn("[Kafka Admin] Kiểm tra/tạo topic:", err.message);
  } finally {
    try {
      await admin.disconnect();
    } catch (_) { }
  }
}

module.exports = {
  ...TOPIC_NAMES,
  ensureTopicsExist,
};
