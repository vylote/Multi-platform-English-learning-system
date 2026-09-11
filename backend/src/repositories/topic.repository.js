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
}

module.exports = new TopicRepository();
