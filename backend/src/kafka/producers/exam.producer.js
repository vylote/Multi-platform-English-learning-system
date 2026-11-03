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
    console.log("[Kafka Producer] Kết nối Producer tới Kafka Cluster thành công!");
  }
  return producer;
}

/**
 * Bắn event nộp bài thi vào Kafka Topic: exam.submissions
 * @param {object} payload Thông tin bài thi đã nộp
 */
async function publishExamSubmitted(payload) {
  try {
    const prod = await getProducer();
    await prod.send({
      topic: topics.EXAM_SUBMITTED,
      messages: [
        {
          key: String(payload.userId),
          value: JSON.stringify(payload),
          headers: {
            "event-type": "EXAM_SUBMITTED",
            "source": "anhlingo-api",
            "timestamp": Date.now().toString(),
          },
        },
      ],
    });

    console.log(
      `[Kafka Producer] Đã bắn event [${topics.EXAM_SUBMITTED}] cho User ID: ${payload.userId}, Session ID: ${payload.sessionId}, Điểm: ${payload.score}/10`
    );
    return true;
  } catch (err) {
    console.warn(
      `[Kafka Producer Warning] Không thể gửi message vào topic '${topics.EXAM_SUBMITTED}':`,
      err.message
    );
    return false;
  }
}

module.exports = {
  publishExamSubmitted,
};

