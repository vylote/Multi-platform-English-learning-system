require("dotenv").config();
const db = require("../config/db");

const PLACEMENT_QUESTIONS = [
  // ==========================================
  // BEGINNER (Câu 1 - 10)
  // ==========================================
  {
    question_text: "She ______ to school every morning by bus.",
    option_a: "go",
    option_b: "goes",
    option_c: "going",
    option_d: "gone",
    correct_option: "B",
  },
  {
    question_text: "I don't have ______ milk left in the fridge.",
    option_a: "some",
    option_b: "any",
    option_c: "many",
    option_d: "a",
    correct_option: "B",
  },
  {
    question_text: "Where ______ you from? - I am from Vietnam.",
    option_a: "is",
    option_b: "am",
    option_c: "are",
    option_d: "be",
    correct_option: "C",
  },
  {
    question_text: "Yesterday, they ______ dinner at an Italian restaurant.",
    option_a: "have",
    option_b: "ate",
    option_c: "eating",
    option_d: "eats",
    correct_option: "B",
  },
  {
    question_text: "My sister is a doctor. ______ works at the city hospital.",
    option_a: "He",
    option_b: "She",
    option_c: "They",
    option_d: "It",
    correct_option: "B",
  },
  {
    question_text: "Look at the sky! It is very cloudy; it ______ rain soon.",
    option_a: "is going to",
    option_b: "will to",
    option_c: "was",
    option_d: "goes",
    correct_option: "A",
  },
  {
    question_text: "This is the ______ book I have ever read.",
    option_a: "good",
    option_b: "better",
    option_c: "best",
    option_d: "well",
    correct_option: "C",
  },
  {
    question_text: "He usually goes to bed ______ 10:30 PM.",
    option_a: "on",
    option_b: "in",
    option_c: "at",
    option_d: "for",
    correct_option: "C",
  },
  {
    question_text: "Can you help ______ with this heavy suitcase?",
    option_a: "I",
    option_b: "my",
    option_c: "me",
    option_d: "mine",
    correct_option: "C",
  },
  {
    question_text: "There are three ______ on the dining table.",
    option_a: "apple",
    option_b: "apples",
    option_c: "an apple",
    option_d: "appling",
    correct_option: "B",
  },

  // ==========================================
  // INTERMEDIATE (Câu 11 - 20)
  // ==========================================
  {
    question_text: "If I ______ enough money, I would travel around the world.",
    option_a: "have",
    option_b: "had",
    option_c: "will have",
    option_d: "having",
    correct_option: "B",
  },
  {
    question_text: "She has lived in this city ______ five years.",
    option_a: "since",
    option_b: "for",
    option_c: "during",
    option_d: "ago",
    correct_option: "B",
  },
  {
    question_text: "The new bridge ______ by the construction team last month.",
    option_a: "was completed",
    option_b: "is completed",
    option_c: "completed",
    option_d: "has completed",
    correct_option: "A",
  },
  {
    question_text: "While Tom ______ a book, the phone suddenly rang.",
    option_a: "read",
    option_b: "is reading",
    option_c: "was reading",
    option_d: "has read",
    correct_option: "C",
  },
  {
    question_text: "The man ______ car was stolen reported the incident to the police.",
    option_a: "who",
    option_b: "whose",
    option_c: "whom",
    option_d: "which",
    correct_option: "B",
  },
  {
    question_text: "You ______ wear a helmet when riding a motorbike; it is required by law.",
    option_a: "might",
    option_b: "must",
    option_c: "could",
    option_d: "would",
    correct_option: "B",
  },
  {
    question_text: "He decided to ______ smoking because of his health condition.",
    option_a: "give up",
    option_b: "take off",
    option_c: "look after",
    option_d: "put on",
    correct_option: "A",
  },
  {
    question_text: "I am looking forward to ______ you at the annual conference next week.",
    option_a: "meet",
    option_b: "met",
    option_c: "meeting",
    option_d: "be meeting",
    correct_option: "C",
  },
  {
    question_text: "Although it rained heavily, they ______ playing football.",
    option_a: "continued",
    option_b: "prevented",
    option_c: "hesitated",
    option_d: "refused",
    correct_option: "A",
  },
  {
    question_text: "By the time we arrived at the cinema, the movie ______ already.",
    option_a: "starts",
    option_b: "had started",
    option_c: "has started",
    option_d: "starting",
    correct_option: "B",
  },

  // ==========================================
  // ADVANCED (Câu 21 - 30)
  // ==========================================
  {
    question_text: "Rarely ______ such an extraordinary performance on this stage.",
    option_a: "have I seen",
    option_b: "I have seen",
    option_c: "did I saw",
    option_d: "I saw",
    correct_option: "A",
  },
  {
    question_text: "It is essential that every participant ______ present before 8:00 AM.",
    option_a: "is",
    option_b: "be",
    option_c: "was",
    option_d: "being",
    correct_option: "B",
  },
  {
    question_text: "Had you informed us earlier, we ______ appropriate arrangements.",
    option_a: "will make",
    option_b: "would make",
    option_c: "would have made",
    option_d: "had made",
    correct_option: "C",
  },
  {
    question_text: "Her explanation was so ______ that nobody in the room could understand it.",
    option_a: "lucid",
    option_b: "convoluted",
    option_c: "straightforward",
    option_d: "transparent",
    correct_option: "B",
  },
  {
    question_text: "The company managed to weather the financial crisis by cutting ______ expenditure.",
    option_a: "redundant",
    option_b: "essential",
    option_c: "mandatory",
    option_d: "critical",
    correct_option: "A",
  },
  {
    question_text: "Not until the investigation concluded ______ the true cause of the malfunction.",
    option_a: "they discovered",
    option_b: "did they discover",
    option_c: "they did discover",
    option_d: "have they discovered",
    correct_option: "B",
  },
  {
    question_text: "The negotiations reached an ______ after neither side was willing to compromise.",
    option_a: "impasse",
    option_b: "breakthrough",
    option_c: "agreement",
    option_d: "initiative",
    correct_option: "A",
  },
  {
    question_text: "Scarcely had the speaker finished his address ______ the audience burst into applause.",
    option_a: "than",
    option_b: "when",
    option_c: "then",
    option_d: "that",
    correct_option: "B",
  },
  {
    question_text: "His remarks were perceived as completely ______ to the topic under discussion.",
    option_a: "relevant",
    option_b: "extraneous",
    option_c: "pertinent",
    option_d: "central",
    correct_option: "B",
  },
  {
    question_text: "Despite the overwhelming odds against them, the team persevered and emerged ______.",
    option_a: "triumphant",
    option_b: "defeated",
    option_c: "obsolete",
    option_d: "precarious",
    correct_option: "A",
  },
];

async function seedPlacementExam() {
  const client = await db.pool.connect();
  try {
    console.log("🚀 Bắt đầu quá trình seed bài kiểm tra đầu vào (Placement Test)...");

    await client.query("BEGIN");

    // Xóa bài placement cũ nếu đã tồn tại để đảm bảo idempotency
    const existing = await client.query("SELECT id FROM exams WHERE exam_type = 'PLACEMENT'");
    if (existing.rows.length > 0) {
      const oldId = existing.rows[0].id;
      console.log(`⚠️  Phát hiện bài Placement cũ (ID: ${oldId}). Đang làm mới...`);
      await client.query("DELETE FROM exams WHERE id = $1", [oldId]);
    }

    // Tạo đề thi Placement Test mới
    const examRes = await client.query(
      `INSERT INTO exams (topic_id, title, duration, exam_type)
       VALUES (NULL, 'Bài kiểm tra đầu vào (Placement Test)', 25, 'PLACEMENT')
       RETURNING id, title, duration, exam_type`,
    );
    const exam = examRes.rows[0];
    console.log(`✅ Đã tạo đề thi: [ID: ${exam.id}] "${exam.title}" (${exam.duration} phút)`);

    // Chèn 30 câu hỏi
    for (let i = 0; i < PLACEMENT_QUESTIONS.length; i++) {
      const q = PLACEMENT_QUESTIONS[i];
      await client.query(
        `INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [exam.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option],
      );
    }

    await client.query("COMMIT");
    console.log(`✅ Đã nạp thành công ${PLACEMENT_QUESTIONS.length} câu hỏi trắc nghiệm chuẩn hóa.`);
    console.log("   - 10 câu DỄ (Beginner)");
    console.log("   - 10 câu TRUNG BÌNH (Intermediate)");
    console.log("   - 10 câu KHÓ (Advanced)");
    console.log("\n🎉 SEED PLACEMENT EXAM THÀNH CÔNG VÀ SẴN SÀNG SỬ DỤNG!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Lỗi khi seed bài Placement Test:", err);
    process.exit(1);
  } finally {
    client.release();
    await db.pool.end();
  }
}

seedPlacementExam();
