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
    console.log("[Kafka Producer] Kết nối Vocab Producer tới Kafka Cluster thành công!");
  }
  return producer;
}

/**
 * Bắn event từ vựng yếu / làm sai vào Kafka Topic: vocab.learning.events
 * @param {object} payload { userId, wordId, word, topicId, eventType, mistakeDetail }
 */
async function publishVocabEvent(payload) {
  try {
    const prod = await getProducer();
    await prod.send({
      topic: topics.VOCAB_EVENTS,
      messages: [
        {
          key: String(payload.userId), // Phân vùng theo userId để giữ nguyên trình tự sự kiện của học viên
          value: JSON.stringify(payload),
          headers: {
            "event-type": payload.eventType || "VOCAB_FAILED",
            "source": "anhlingo-api",
            "timestamp": Date.now().toString(),
          },
        },
      ],
    });

    console.log(
      `[Kafka Producer] Đã bắn event [${topics.VOCAB_EVENTS}] - User ID: ${payload.userId}, Từ: '${payload.word || payload.wordId}', Loại: ${payload.eventType}`
    );
    return true;
  } catch (err) {
    console.warn(
      `[Kafka Producer Warning] Không thể gửi message vào topic '${topics.VOCAB_EVENTS}':`,
      err.message
    );
    return false;
  }
}

/**
 * Bắn hàng loạt event từ vựng yếu (dùng khi nộp bài thi hoặc kết thúc bài học có nhiều câu sai)
 * @param {Array<object>} events Danh sách các event từ vựng
 */
async function publishBatchVocabEvents(events) {
  if (!events || events.length === 0) return true;
  try {
    const prod = await getProducer();
    const messages = events.map((item) => ({
      key: String(item.userId),
      value: JSON.stringify(item),
      headers: {
        "event-type": item.eventType || "VOCAB_FAILED",
        "source": "anhlingo-api",
        "timestamp": Date.now().toString(),
      },
    }));

    await prod.send({
      topic: topics.VOCAB_EVENTS,
      messages,
    });

    console.log(
      `[Kafka Producer] Đã bắn ${messages.length} event [${topics.VOCAB_EVENTS}] vào Kafka Cluster`
    );
    return true;
  } catch (err) {
    console.warn("[Kafka Producer Warning] Lỗi gửi batch vocab events:", err.message);
    return false;
  }
}

module.exports = {
  publishVocabEvent,
  publishBatchVocabEvents,
};

