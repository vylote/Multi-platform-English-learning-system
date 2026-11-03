require("dotenv").config();
const { ensureTopicsExist } = require("./topics");
const { publishExamSubmitted } = require("./producers/exam.producer");

async function testProduce() {
  await ensureTopicsExist();
  console.log("Đang gửi bài thi mẫu vào Kafka Cluster...");

  const mockExamSubmission = {
    userId: 999,
    examId: 1,
    sessionId: 8888,
    score: 7.0,
    correctCount: 7,
    totalQuestions: 10,
    timeSpentSeconds: 420,
    wrongQuestions: [
      {
        question_id: 101,
        question_text: "She _____ to the gym every morning before work.",
        selected_option: "A", // goes
        correct_option: "B",
        explanation: "Chủ ngữ ngôi thứ 3 số ít 'She' thì hiện tại đơn thêm -s/-es.",
      },
      {
        question_id: 105,
        question_text: "I am looking forward to _____ from you soon.",
        selected_option: "C", // hear
        correct_option: "D", // hearing
        explanation: "Cấu trúc 'look forward to + V-ing'.",
      },
      {
        question_id: 108,
        question_text: "If I _____ you, I would take that opportunity.",
        selected_option: "A", // was
        correct_option: "C", // were
        explanation: "Câu điều kiện loại 2 giả định trái với thực tế dùng 'were' cho mọi ngôi.",
      },
    ],
    submittedAt: new Date().toISOString(),
  };

  const ok = await publishExamSubmitted(mockExamSubmission);
  if (ok) {
    console.log("Test Producer thành công! Message đã được đẩy lên Kafka Topic: exam.submissions");
    console.log("Hãy mở http://localhost:8085 (Kafka UI) để xem message vừa bay vào.");
  } else {
    console.error("Gửi message thất bại.");
  }

  process.exit(0);
}

testProduce();

