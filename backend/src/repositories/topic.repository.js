const db = require("../config/db");

class TopicRepository {
  async findAll() {
    const sql = `SELECT id, title, description FROM topics ORDER BY title ASC;`;
    const { rows } = await db.query(sql);
    return rows;
  }

  async findById(topicId) {
    const sql = `SELECT id, title, description FROM topics WHERE id = $1;`;
    const { rows } = await db.query(sql, [topicId]);
    return rows[0] || null;
  }

  async existsAny() {
    const { rows } = await db.query(`SELECT 1 FROM topics LIMIT 1;`);
    return rows.length > 0;
  }

  // Bốc ngẫu nhiên 1 chủ đề mà user ĐANG CÓ ít nhất 1 thẻ chưa MASTERED
  //idx uq_flashcards_user_topic
  async findRandomTopicInProgress(userId) {
    const sql = `
      SELECT t.id, t.title
      FROM topics t
      WHERE EXISTS (
        SELECT 1 FROM flashcards f
        WHERE f.topic_id = t.id AND f.user_id = $1 AND f.status != 'MASTERED'
      )
      ORDER BY RANDOM()
      LIMIT 1;
    `;
    const { rows } = await db.query(sql, [userId]);
    return rows[0] || null;
  }

  // Bốc ngẫu nhiên 1 chủ đề CÒN ÍT NHẤT 1 TỪ mà user CHƯA SỞ HỮU (chưa có trong flashcards).
  // Đảm bảo không bốc trúng chủ đề mà user đã "dùng hết" (MASTERED toàn bộ hoặc đã có mọi từ).
  async findRandomTopicWithUnownedWords(userId) {
    const sql = `
      SELECT t.id, t.title
      FROM topics t
      WHERE EXISTS (
        SELECT 1 FROM words w
        WHERE w.topic_id = t.id
          AND w.id NOT IN (SELECT word_id FROM flashcards WHERE user_id = $1)
      )
      ORDER BY RANDOM()
      LIMIT 1;
    `;
    const { rows } = await db.query(sql, [userId]);
    return rows[0] || null; //TODO: hoặc là còn từ chưa học, hoặc là full
  }

  async getProgressForUser(userId) {
    const sql = `
    SELECT
      t.id, t.title, t.order_index, t.difficulty,
      COUNT(DISTINCT w.id) AS total_words,
      COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'MASTERED') AS mastered_words,
      MAX(er.score) FILTER (WHERE e.exam_type = 'TOPIC') AS best_exam_score
    FROM topics t
    LEFT JOIN words w ON w.topic_id = t.id
    LEFT JOIN flashcards f ON f.word_id = w.id AND f.user_id = $1
    LEFT JOIN exams e ON e.topic_id = t.id
    LEFT JOIN exam_results er ON er.exam_id = e.id AND er.user_id = $1
    GROUP BY t.id
    ORDER BY t.order_index ASC;
  `;
    const { rows } = await db.query(sql, [userId]);
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      orderIndex: r.order_index,
      difficulty: r.difficulty,
      totalWords: Number(r.total_words),
      masteredWords: Number(r.mastered_words),
      bestExamScore:
        r.best_exam_score !== null ? Number(r.best_exam_score) : null,
    }));
  }

  async findSampleByDifficulty(difficulty, limit = 5) {
    const sql = `SELECT id, title FROM topics WHERE difficulty = $1 ORDER BY RANDOM() LIMIT $2;`;
    const { rows } = await db.query(sql, [difficulty, limit]);
    return rows;
  }

  async findPriorityTopicIdsByGoal(goal) {
    if (!goal) return [];
    const sql = `SELECT topic_id FROM topic_goal_priority WHERE goal = $1;`;
    const { rows } = await db.query(sql, [goal]);
    return rows.map((r) => r.topic_id);
  }
}

module.exports = new TopicRepository();
