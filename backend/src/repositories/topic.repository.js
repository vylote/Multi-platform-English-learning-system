const db = require("../config/db");

class TopicRepository {
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

  // Bốc đại 1 chủ đề bất kỳ trong toàn hệ thống - dùng khi user không còn thẻ nào dở dang
  async findRandomTopic() {
    const sql = `SELECT id, title FROM topics ORDER BY RANDOM() LIMIT 1;`;
    const { rows } = await db.query(sql);
    return rows[0] || null;
  }
}

module.exports = new TopicRepository();
