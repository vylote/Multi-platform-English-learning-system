const { Kafka, logLevel } = require("kafkajs");

const brokers = (
  process.env.KAFKA_BROKERS || "localhost:9092,localhost:9093,localhost:9094"
)
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean);

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "anhlingo-backend",
  brokers,
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 300,
    retries: 5,
  },
});

module.exports = kafka;

