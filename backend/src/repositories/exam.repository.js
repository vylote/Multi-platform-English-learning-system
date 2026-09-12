const db = require("../config/db");
const { Exam, ExamQuestionSafe } = require("../models/exam.model");

class ExamRepository {
  async search({ topicId, title, duration, page, pageSize }) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (topicId) {
      conditions.push(`e.topic_id = $${paramIndex++}`);
      params.push(topicId);
    }
    if (title) {
      conditions.push(`e.title ILIKE $${paramIndex++}`);
      params.push(`%${title}%`);
    }
    if (duration) {
      conditions.push(`e.duration = $${paramIndex++}`);
      params.push(duration);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Đếm tổng số bản ghi khớp điều kiện (chưa phân trang) - phục vụ totalElements/totalPages
    const countSql = `
    SELECT COUNT(*) AS total
    FROM exams e
    ${whereClause};
  `;
    const countResult = await db.query(countSql, params);
    const totalElements = Number(countResult.rows[0].total);

    // Trang client gửi lên đếm từ 1 -> OFFSET cần trừ 1 trước khi nhân pageSize
    const offset = (page - 1) * pageSize;

    const dataSql = `
    SELECT e.id, e.topic_id, e.title, e.duration, COUNT(q.id) AS question_count
    FROM exams e
    LEFT JOIN questions q ON q.exam_id = e.id
    ${whereClause}
    GROUP BY e.id
    ORDER BY e.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++};
  `;
    const dataParams = [...params, pageSize, offset];
    const { rows } = await db.query(dataSql, dataParams);

    return {
      exams: rows.map((row) => new Exam(row)),
      totalElements,
    };
  }

  async findById(examId) {
    const sql = `
    SELECT e.id, e.topic_id, e.title, e.duration, COUNT(q.id) AS question_count
    FROM exams e
    LEFT JOIN questions q ON q.exam_id = e.id
    WHERE e.id = $1
    GROUP BY e.id;
  `;
    const { rows } = await db.query(sql, [examId]);
    return rows[0] ? new Exam(rows[0]) : null;
  }

  // Câu hỏi để LÀM BÀI - không lấy correct_option
  async findQuestionsSafe(examId) {
    const sql = `
      SELECT id, question_text, option_a, option_b, option_c, option_d
      FROM questions
      WHERE exam_id = $1
      ORDER BY id ASC;
    `;
    const { rows } = await db.query(sql, [examId]);
    return rows.map((row) => new ExamQuestionSafe(row));
  }

  // Câu hỏi ĐẦY ĐỦ (kèm correct_option) - dùng nội bộ khi chấm điểm, KHÔNG trả ra ngoài trực tiếp
  async findQuestionsWithAnswer(examId) {
    const sql = `
      SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option
      FROM questions
      WHERE exam_id = $1
      ORDER BY id ASC;
    `;
    const { rows } = await db.query(sql, [examId]);
    return rows;
  }

  async createSession(userId, examId) {
    const sql = `
      INSERT INTO exam_sessions (exam_id, user_id, status)
      VALUES ($1, $2, 'IN_PROGRESS')
      RETURNING id, exam_id, user_id, started_at, status;
    `;
    const { rows } = await db.query(sql, [examId, userId]);
    return rows[0];
  }

  async findSessionById(sessionId, userId) {
    const sql = `
      SELECT id, exam_id, user_id, started_at, submitted_at, status
      FROM exam_sessions
      WHERE id = $1 AND user_id = $2;
    `;
    const { rows } = await db.query(sql, [sessionId, userId]);
    return rows[0] || null;
  }

  async markSessionSubmitted(sessionId, client = db) {
    const sql = `
      UPDATE exam_sessions
      SET status = 'SUBMITTED', submitted_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING submitted_at;
    `;
    const { rows } = await client.query(sql, [sessionId]);
    return rows[0].submitted_at;
  }

  async insertAnswers({ sessionId, answers }, client = db) {
    for (const a of answers) {
      await client.query(
        `INSERT INTO exam_answers (session_id, question_id, selected_option)
         VALUES ($1, $2, $3)
         ON CONFLICT (session_id, question_id) DO UPDATE SET selected_option = EXCLUDED.selected_option;`,
        [sessionId, a.question_id, a.selected_option || null],
      );
    }
  }

  async insertResult(
    { userId, examId, sessionId, score, timeSpent },
    client = db,
  ) {
    const sql = `
      INSERT INTO exam_results (user_id, exam_id, session_id, score, time_spent)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;
    const { rows } = await client.query(sql, [
      userId,
      examId,
      sessionId,
      score,
      timeSpent,
    ]);
    return rows[0].id;
  }

  async findHistoryByUser(userId) {
    const sql = `
      SELECT r.id, r.exam_id, e.title AS exam_title, r.score, r.time_spent, r.submitted_at
      FROM exam_results r
      JOIN exams e ON e.id = r.exam_id
      WHERE r.user_id = $1
      ORDER BY r.submitted_at DESC;
    `;
    const { rows } = await db.query(sql, [userId]);
    return rows;
  }

  async findActiveSession(userId, examId) {
    const sql = `
    SELECT id FROM exam_sessions
    WHERE user_id = $1 AND exam_id = $2 AND status = 'IN_PROGRESS'
    LIMIT 1;
  `;
    const { rows } = await db.query(sql, [userId, examId]);
    return rows[0] || null;
  }

  async findActiveSession(userId, examId) {
    const sql = `
    SELECT id, exam_id, user_id, started_at, status
    FROM exam_sessions
    WHERE user_id = $1 AND exam_id = $2 AND status = 'IN_PROGRESS'
    LIMIT 1;
  `;
    const { rows } = await db.query(sql, [userId, examId]);
    return rows[0] || null;
  }

  async cancelSession(sessionId, userId) {
    const sql = `
    UPDATE exam_sessions
    SET status = 'CANCELLED', submitted_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2 AND status = 'IN_PROGRESS'
    RETURNING id;
  `;
    const { rows } = await db.query(sql, [sessionId, userId]);
    return rows.length > 0;
  }

  async getClient() {
    return db.pool.connect();
  }
}

module.exports = new ExamRepository();
