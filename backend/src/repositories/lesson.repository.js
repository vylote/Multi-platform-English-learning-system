const db = require("../config/db");

class LessonRepository {
  async saveAttempt({ userId, topicId, quizScore, pronunciationScore }) {
    const sql = `
      INSERT INTO lesson_attempts (user_id, topic_id, quiz_score, pronunciation_score)
      VALUES ($1, $2, $3, $4)
      RETURNING id, completed_at;
    `;
    const { rows } = await db.query(sql, [userId, topicId, quizScore, pronunciationScore]);
    return rows[0];
  }

  async findBestScoreForTopic(userId, topicId) {
    const sql = `
      SELECT MAX((quiz_score + pronunciation_score) / 2) AS best_combined_score
      FROM lesson_attempts
      WHERE user_id = $1 AND topic_id = $2;
    `;
    const { rows } = await db.query(sql, [userId, topicId]);
    return rows[0]?.best_combined_score !== null ? Number(rows[0].best_combined_score) : null;
  }
}

module.exports = new LessonRepository();