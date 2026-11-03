const { Partitioners } = require("kafkajs");
const kafka = require("../client");
const topics = require("../topics");

let producer = null;

async function getProducer() {
  if (!producer) {
    producer = kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
    await producer.connect();
    console.log("[Kafka Producer] Kết nối Activity Producer tới Kafka Cluster thành công!");
  }
  return producer;
}

/**
 * Bắn event hoạt động học tập hoàn thành vào Kafka Topic: learning.activity.completed
 * @param {object} payload Thông tin hoạt động hoàn thành (userId, activityType, score, timezoneOffsetMinutes, ...)
 */
async function publishActivityCompleted(payload) {
  try {
    const prod = await getProducer();
    await prod.send({
      topic: topics.LEARNING_ACTIVITY_COMPLETED,
      messages: [
        {
          key: String(payload.userId),
          value: JSON.stringify(payload),
          headers: {
            "event-type": "LEARNING_ACTIVITY_COMPLETED",
            "source": "anhlingo-api",
            "timestamp": Date.now().toString(),
          },
        },
      ],
    });

    console.log(
      `[Kafka Producer] Đã bắn event [${topics.LEARNING_ACTIVITY_COMPLETED}] cho User ID: ${payload.userId}, Loại: ${payload.activityType}`
    );
    return true;
  } catch (err) {
    console.warn(
      `[Kafka Producer Warning] Không thể gửi message vào topic '${topics.LEARNING_ACTIVITY_COMPLETED}':`,
      err.message
    );
    return false;
  }
}

module.exports = {
  publishActivityCompleted,
};

