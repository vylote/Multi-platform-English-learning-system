const { Kafka, logLevel } = (() => {
  try {
    return require("kafkajs");
  } catch (_) {
    return { Kafka: null, logLevel: {} };
  }
})();

const kafkaBrokers = (process.env.KAFKA_BROKERS || "localhost:9092,localhost:9093,localhost:9094")
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean);

let kafka = null;
let producer = null;

if (Kafka && process.env.KAFKA_BROKERS) {
  kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || "els-backend",
    brokers: kafkaBrokers,
    logLevel: logLevel.ERROR,
  });

  producer = kafka.producer();
}

/**
 * Gửi event vào Kafka Topic
 * @param {string} topic Tên topic (ví dụ: 'exam.submitted', 'lesson.completed')
 * @param {object} message Dữ liệu payload
 */
async function sendEvent(topic, message) {
  if (!producer) {
    // Nếu chưa cấu hình Kafka, ghi log fallback (không làm gián đoạn API chính)
    return false;
  }
  try {
    await producer.connect();
    await producer.send({
      topic,
      messages: [
        {
          key: message.userId ? String(message.userId) : null,
          value: JSON.stringify(message),
          timestamp: Date.now().toString(),
        },
      ],
    });
    return true;
  } catch (err) {
    console.error(`[Kafka Producer Error] Gửi event vào topic "${topic}" thất bại:`, err.message);
    return false;
  }
}

module.exports = {
  kafka,
  producer,
  sendEvent,
};

