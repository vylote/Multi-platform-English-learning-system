require("dotenv").config();
const db = require("../config/db");
const topicRepository = require("../repositories/topic.repository");
const systemSettingService = require("./system-setting.service");
const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const isXai = GROQ_API_KEY && GROQ_API_KEY.startsWith("xai-");
const GROQ_URL = isXai
  ? "https://api.x.ai/v1/chat/completions"
  : "https://api.groq.com/openai/v1/chat/completions";
const ACTIVE_MODEL = isXai ? process.env.GROQ_MODEL || "grok-4-fast" : GROQ_MODEL;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class AdminExamService {
  // Lấy danh sách toàn bộ chủ đề phục vụ dropdown
  async getTopics() {
    return await topicRepository.findAll();
  }

  // Lấy danh sách đề thi kèm phân trang và lọc
  async getExams({ page = 1, limit = 10, search = "", topicId = "ALL", examType = "ALL" }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      conditions.push(`(e.title ILIKE $${paramIndex} OR t.title ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (topicId && topicId !== "ALL") {
      conditions.push(`e.topic_id = $${paramIndex}`);
      params.push(parseInt(topicId, 10));
      paramIndex++;
    }

    if (examType && examType !== "ALL") {
      conditions.push(`e.exam_type = $${paramIndex}`);
      params.push(examType);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Đếm tổng số bản ghi
    const countSql = `
      SELECT COUNT(*) AS total
      FROM exams e
      LEFT JOIN topics t ON e.topic_id = t.id
      ${whereClause}
    `;
    const countRes = await db.query(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    // Lấy dữ liệu phân trang kèm số câu hỏi
    const dataSql = `
      SELECT 
        e.id, 
        e.topic_id, 
        e.title, 
        e.duration, 
        e.exam_type, 
        e.created_at,
        t.title AS topic_title,
        t.difficulty AS topic_difficulty,
        COUNT(q.id) AS question_count
      FROM exams e
      LEFT JOIN topics t ON e.topic_id = t.id
      LEFT JOIN questions q ON q.exam_id = e.id
      ${whereClause}
      GROUP BY e.id, t.title, t.difficulty
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataParams = [...params, limitNum, offset];
    const { rows } = await db.query(dataSql, dataParams);

    return {
      exams: rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  // Lấy chi tiết đề thi kèm toàn bộ câu hỏi và đáp án (dành cho Admin review)
  async getExamDetail(examId) {
    const id = parseInt(examId, 10);
    if (isNaN(id)) {
      throw new AppException(ErrorCode.INVALID_DATA, "Mã đề thi không hợp lệ.");
    }

    const examSql = `
      SELECT 
        e.id, 
        e.topic_id, 
        e.title, 
        e.duration, 
        e.exam_type, 
        e.created_at,
        t.title AS topic_title,
        t.description AS topic_description,
        t.difficulty AS topic_difficulty
      FROM exams e
      LEFT JOIN topics t ON e.topic_id = t.id
      WHERE e.id = $1
      LIMIT 1
    `;
    const examRes = await db.query(examSql, [id]);
    if (examRes.rows.length === 0) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy đề thi.");
    }

    const questionsSql = `
      SELECT 
        id, 
        question_text, 
        option_a, 
        option_b, 
        option_c, 
        option_d, 
        correct_option
      FROM questions
      WHERE exam_id = $1
      ORDER BY id ASC
    `;
    const questionsRes = await db.query(questionsSql, [id]);

    return {
      ...examRes.rows[0],
      questions: questionsRes.rows,
      question_count: questionsRes.rows.length,
    };
  }

  // Xóa đề thi
  async deleteExam(examId) {
    const id = parseInt(examId, 10);
    if (isNaN(id)) {
      throw new AppException(ErrorCode.INVALID_DATA, "Mã đề thi không hợp lệ.");
    }

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Xóa câu trả lời học viên, kết quả thi và phiên thi liên quan
      await client.query(
        "DELETE FROM exam_answers WHERE session_id IN (SELECT id FROM exam_sessions WHERE exam_id = $1)",
        [id],
      );
      await client.query("DELETE FROM exam_results WHERE exam_id = $1", [id]);
      await client.query("DELETE FROM exam_sessions WHERE exam_id = $1", [id]);
      await client.query("DELETE FROM questions WHERE exam_id = $1", [id]);
      const res = await client.query("DELETE FROM exams WHERE id = $1 RETURNING id, title", [id]);

      if (res.rows.length === 0) {
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Đề thi không tồn tại để xóa.");
      }

      await client.query("COMMIT");
      return res.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // Sinh đề thi mới theo thông số Admin nhập
  async generateExam({
    topicId,
    count = 10,
    duration = 15,
    title,
    method = "AUTO", // 'AUTO' | 'AI' | 'DATABASE'
    examType = "TOPIC", // 'TOPIC' | 'PLACEMENT'
  }) {
    const questionCount = Math.min(50, Math.max(4, parseInt(count, 10) || 10));
    const examDuration = Math.min(180, Math.max(5, parseInt(duration, 10) || 15));

    let targetTopic = null;
    let finalTitle = title ? title.trim() : "";

    if (examType === "TOPIC") {
      const tId = parseInt(topicId, 10);
      if (isNaN(tId)) {
        throw new AppException(ErrorCode.INVALID_DATA, "Vui lòng chọn một chủ đề hợp lệ.");
      }

      targetTopic = await topicRepository.findById(tId);
      if (!targetTopic) {
        throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Chủ đề được chọn không tồn tại.");
      }

      if (!finalTitle) {
        finalTitle = `Đề thi: ${targetTopic.title}`;
      }
    } else {
      if (!finalTitle) {
        finalTitle = "Bài kiểm tra đầu vào (Placement Test)";
      }
    }

    let questions = [];
    let generationSource = "DATABASE";

    const aiEnabled = await systemSettingService.get("ai.enable_generation", true);

    if (method === "AI" && !aiEnabled) {
      throw new AppException(
        ErrorCode.SYSTEM_ERROR,
        "Tính năng sinh đề bằng AI đang tạm thời bị Quản trị viên vô hiệu hóa trong Cấu hình Hệ thống.",
      );
    }

    // 1. Nếu chọn AI hoặc AUTO và có GROQ_API_KEY và được bật AI
    if ((method === "AI" || method === "AUTO") && GROQ_API_KEY && aiEnabled) {
      try {
        let prompt;
        if (examType === "PLACEMENT") {
          const [beginnerTopics, intermediateTopics, advancedTopics] = await Promise.all([
            topicRepository.findSampleByDifficulty("BEGINNER", 5),
            topicRepository.findSampleByDifficulty("INTERMEDIATE", 5),
            topicRepository.findSampleByDifficulty("ADVANCED", 5),
          ]);
          const topicsByTier = {
            BEGINNER: beginnerTopics,
            INTERMEDIATE: intermediateTopics,
            ADVANCED: advancedTopics,
          };
          prompt = this._buildPlacementPrompt(topicsByTier, questionCount);
        } else {
          prompt = this._buildTopicPrompt(targetTopic, questionCount);
        }

        const parsed = await this._callGroq(prompt);
        questions = this._validateQuestions(parsed);
        generationSource = "AI (Groq/LLM)";
      } catch (aiError) {
        console.warn("⚠️ AI generation thất bại:", aiError.message);
        if (method === "AI") {
          throw new AppException(
            ErrorCode.SYSTEM_ERROR,
            `Không thể sinh đề bằng AI: ${aiError.message}`,
          );
        }
        // Nếu là AUTO thì tiếp tục fallback xuống database
      }
    }

    // 2. Nếu chưa có câu hỏi (hoặc method === 'DATABASE') -> Sinh từ kho từ vựng DB
    if (questions.length === 0) {
      if (examType === "TOPIC") {
        questions = await this._generateQuestionsFromDb(targetTopic, questionCount);
        generationSource = "Kho từ vựng chuẩn (Database)";
      } else {
        throw new AppException(
          ErrorCode.INVALID_DATA,
          "Bài kiểm tra Placement yêu cầu API Key AI để trộn đề theo trình độ.",
        );
      }
    }

    if (questions.length === 0) {
      throw new AppException(ErrorCode.SYSTEM_ERROR, "Không thể tạo được câu hỏi trắc nghiệm nào.");
    }

    // 3. Lưu vào Database trong Transaction
    const examId = await this._saveExamToDb({
      topicId: targetTopic ? targetTopic.id : null,
      title: finalTitle,
      duration: examDuration,
      examType,
      questions,
    });

    return {
      id: examId,
      title: finalTitle,
      topicId: targetTopic ? targetTopic.id : null,
      topicTitle: targetTopic ? targetTopic.title : null,
      duration: examDuration,
      examType,
      questionCount: questions.length,
      generationSource,
      questions,
    };
  }

  // --- PRIVATE HELPERS ---

  _buildTopicPrompt(topic, count) {
    return `You are an expert Cambridge/IELTS/TOEIC English test creator.
Generate exactly ${count} multiple-choice English questions (4 options A/B/C/D, strictly 1 correct answer) for the topic: "${topic.title}"${
      topic.description ? ` (${topic.description})` : ""
    }.

STRICT REQUIREMENTS:
1. 100% ENGLISH ONLY: Both the question text and all 4 options (A, B, C, D) MUST BE 100% IN ENGLISH. Absolutely DO NOT include any Vietnamese words, sentences, or translations anywhere.
2. Question Styles (mix of the following):
   - Fill-in-the-blank / Contextual sentence (Cloze): e.g. "The manager asked the team to prepare a preliminary ______ before the meeting."
   - Vocabulary definition & usage: e.g. "Which of the following words describes a person/thing that ...?"
   - Synonyms / Contextual meaning: e.g. "Which word is closest in meaning to '...' in the sentence: '...'?"
3. Options:
   - Each option (A, B, C, D) must be a single English word or short English phrase of the same grammatical category.
   - All 4 options must be distinct, valid, plausible English words.
4. Output format: Return ONLY a valid JSON object without markdown code blocks, without extra comments.

Format:
{
  "questions": [
    { "question_text": "...", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...", "correct_option": "A" }
  ]
}`;
  }

  _buildPlacementPrompt(topicsByTier, count) {
    const perTier = Math.floor(count / 3);
    const lastTierCount = count - perTier * 2;
    const listTitles = (tier) =>
      (topicsByTier[tier] || []).map((t) => t.title).join(", ") || "(general English)";

    return `You are an expert English language examiner designing a formal Placement Test to accurately assess and classify learners into BEGINNER, INTERMEDIATE, and ADVANCED levels.

Generate exactly ${count} multiple-choice English questions (4 options A/B/C/D, strictly 1 correct answer), arranged from EASIEST to HARDEST:
- ${perTier} BEGINNER questions (A1-A2 level): basic grammar, common everyday vocabulary (topics: ${listTitles("BEGINNER")})
- ${perTier} INTERMEDIATE questions (B1-B2 level): prepositions, phrasal verbs, tenses, collocations (topics: ${listTitles("INTERMEDIATE")})
- ${lastTierCount} ADVANCED questions (C1-C2 level): complex grammar, subtle vocabulary nuances, idioms (topics: ${listTitles("ADVANCED")})

STRICT REQUIREMENTS:
1. 100% ENGLISH ONLY: Both question text and all 4 options (A, B, C, D) MUST BE IN ENGLISH. Never use Vietnamese.
2. Order questions strictly from easiest (question 1) to hardest (question ${count}).
3. All 4 options must be distinct, plausible English words or phrases.
4. Output format: Return ONLY valid JSON, no markdown code blocks.

Format:
{
  "questions": [
    { "question_text": "...", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...", "correct_option": "A" }
  ]
}`;
  }

  async _callGroq(prompt, { retries = 3 } = {}) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: ACTIVE_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      if (res.status === 429) {
        const wait = 2500 * attempt;
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`AI API error ${res.status}: ${text.slice(0, 200)}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("AI trả về phản hồi rỗng");

      try {
        return JSON.parse(content);
      } catch (e) {
        throw new Error("Không thể parse cấu trúc JSON từ AI.");
      }
    }
    throw new Error("Quá giới hạn tần suất yêu cầu AI, vui lòng thử lại sau.");
  }

  _validateQuestions(parsed) {
    if (!parsed || !Array.isArray(parsed.questions)) {
      throw new Error("Dữ liệu câu hỏi trả về không đúng định dạng mảng.");
    }
    const valid = [];
    for (const q of parsed.questions) {
      const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
      const ok =
        typeof q.question_text === "string" &&
        q.question_text.trim().length > 0 &&
        opts.every((o) => typeof o === "string" && o.trim().length > 0) &&
        ["A", "B", "C", "D"].includes(q.correct_option) &&
        new Set(opts.map((o) => o.trim().toLowerCase())).size === 4;
      if (ok) valid.push(q);
    }
    if (valid.length === 0) {
      throw new Error("Không có câu hỏi trắc nghiệm hợp lệ nào được tạo ra.");
    }
    return valid;
  }

  async _generateQuestionsFromDb(topic, count) {
    const { rows: topicWords } = await db.query(
      "SELECT id, word, pronunciation, part_of_speech, meaning_vi FROM words WHERE topic_id = $1",
      [topic.id],
    );

    if (topicWords.length < 4) {
      throw new AppException(
        ErrorCode.INVALID_DATA,
        `Chủ đề "${topic.title}" không có đủ từ vựng để tạo 4 lựa chọn (cần ít nhất 4 từ).`,
      );
    }

    const { rows: otherWords } = await db.query(
      "SELECT id, word, meaning_vi, part_of_speech FROM words WHERE topic_id != $1 AND topic_id IS NOT NULL ORDER BY RANDOM() LIMIT 150",
      [topic.id],
    );

    const cleanMeaning = (str) => {
      if (!str) return "";
      const parts = str.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
      return parts.slice(0, 2).join(", ");
    };

    const TEMPLATES = [
      (w, t, m) => `Which English word means "${m}" in the context of "${t}"?`,
      (w, t, m) => `Choose the correct word to complete: "The team explored the importance of ______ in our ${t.toLowerCase()} study."`,
      (w, t, m) => `Select the English term that matches the following description: "${m}".`,
      (w, t, m) => `Fill in the blank with the appropriate word: "During our session about ${t.toLowerCase()}, we focused on '______'."`,
      (w, t, m) => `Which of the following English words corresponds to "${m}"?`,
      (w, t, m) => `Choose the word that correctly fits the context: "We need to understand the concept of ______ before continuing the ${t.toLowerCase()} exercise."`,
    ];

    const shuffledTopicWords = [...topicWords].sort(() => 0.5 - Math.random());
    const selectedWords = shuffledTopicWords.slice(0, Math.min(count, topicWords.length));
    const rawQuestions = [];

    for (let i = 0; i < selectedWords.length; i++) {
      const target = selectedWords[i];
      const meaning = cleanMeaning(target.meaning_vi);
      const templateFn = TEMPLATES[i % TEMPLATES.length];
      const question_text = templateFn(target.word, topic.title, meaning);
      const correctText = target.word;

      const otherEnglishWords = shuffledTopicWords
        .filter((w) => w.id !== target.id)
        .map((w) => w.word)
        .filter((w) => w.toLowerCase() !== correctText.toLowerCase());

      const fallbackWords = otherWords
        .map((w) => w.word)
        .filter((w) => w.toLowerCase() !== correctText.toLowerCase());

      const distractorPool = [...new Set([...otherEnglishWords, ...fallbackWords])];
      distractorPool.sort(() => 0.5 - Math.random());
      const distractors = distractorPool.slice(0, 3);
      if (distractors.length < 3) continue;

      const allOptions = [correctText, ...distractors].sort(() => 0.5 - Math.random());
      const optLetters = ["A", "B", "C", "D"];
      const correctIndex = allOptions.indexOf(correctText);

      rawQuestions.push({
        question_text,
        option_a: allOptions[0],
        option_b: allOptions[1],
        option_c: allOptions[2],
        option_d: allOptions[3],
        correct_option: optLetters[correctIndex],
      });
    }

    return this._validateQuestions({ questions: rawQuestions });
  }

  async _saveExamToDb({ topicId, title, duration, examType, questions }) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const examRes = await client.query(
        `INSERT INTO exams (topic_id, title, duration, exam_type) VALUES ($1, $2, $3, $4) RETURNING id`,
        [topicId, title, duration, examType],
      );
      const examId = examRes.rows[0].id;

      for (const q of questions) {
        await client.query(
          `INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [examId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option],
        );
      }

      await client.query("COMMIT");
      return examId;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new AdminExamService();
