const db = require("../config/db");
const Flashcard = require("../models/flashcard.model");
const Word = require("../models/word.model");

class FlashcardRepository {
  async getClient() {
    return db.pool.connect();
  }

  //TODO: idx uq_user_word
  async bulkInsertNew(userId, topicId, wordItems, client = db) {
    for (const w of wordItems) {
      await client.query(
        `INSERT INTO flashcards (user_id, word_id, topic_id, status)
         VALUES ($1, $2, $3, 'NEW')
         ON CONFLICT (user_id, word_id) DO NOTHING;`,
        [userId, w.id, topicId],
      );
    }
  }

  async findByUser(userId) {
    const sql = `
      SELECT f.id, f.user_id, f.word_id, f.topic_id, f.status, f.last_reviewed, f.created_at,
             w.word, w.pronunciation, w.part_of_speech, w.meaning_vi
      FROM flashcards f
      JOIN words w ON w.id = f.word_id
      WHERE f.user_id = $1
      ORDER BY f.id DESC;
    `;
    const { rows } = await db.query(sql, [userId]);
    return this._mapRows(rows);
  }

  // Toàn bộ thẻ chưa MASTERED của user, giới hạn trong 1 topic cụ thể
  //idx uq_flashcards_user_topic
  async findByUserAndTopic(userId, topicId) {
    const sql = `
    SELECT f.id, f.user_id, f.word_id, f.topic_id, f.status, f.last_reviewed, f.created_at,
           w.word, w.pronunciation, w.part_of_speech, w.meaning_vi
    FROM flashcards f
    JOIN words w ON w.id = f.word_id
    WHERE f.user_id = $1 AND f.topic_id = $2 AND f.status != 'MASTERED'
    ORDER BY
      (f.status = 'NEW') DESC,
      f.last_reviewed ASC NULLS FIRST;
  `;
    const { rows } = await db.query(sql, [userId, topicId]);
    return this._mapRows(rows);
  }

  // Toàn bộ thẻ của user thuộc 1 topic cụ thể, KHÔNG lọc status (dùng ngay sau khi vừa
  // bulkInsertNew cho 1 topic hoàn toàn mới -> chắc chắn mọi thẻ đều NEW, không cần lọc)
  async findAllByUserAndTopic(userId, topicId) {
    const sql = `
    SELECT f.id, f.user_id, f.word_id, f.topic_id, f.status, f.last_reviewed, f.created_at,
           w.word, w.pronunciation, w.part_of_speech, w.meaning_vi
    FROM flashcards f
    JOIN words w ON w.id = f.word_id
    WHERE f.user_id = $1 AND f.topic_id = $2
    ORDER BY f.id ASC;
  `;
    const { rows } = await db.query(sql, [userId, topicId]);
    return this._mapRows(rows);
  }

  async updateStatus(id, userId, status) {
    const sql = `
      UPDATE flashcards
      SET status = $1, last_reviewed = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING id, user_id, word_id, topic_id, status, last_reviewed, created_at;
    `;
    const { rows } = await db.query(sql, [status, id, userId]);
    return rows[0] ? new Flashcard(rows[0]) : null;
  }

  async deleteById(id, userId) {
    const sql = `DELETE FROM flashcards WHERE id = $1 AND user_id = $2 RETURNING id;`;
    const { rows } = await db.query(sql, [id, userId]);
    return rows.length > 0;
  }

  // Đếm số lượng thẻ đang ở trạng thái MASTERED và được ôn tập lần cuối vào hôm nay
  // (Tính theo đúng múi giờ của người dùng, áp dụng cho cả thẻ cũ lẫn thẻ mới)
  async countTodayMastered(userId, timezoneOffsetMinutes) {
    const sql = `
      SELECT COUNT(*)
      FROM flashcards
      WHERE user_id = $1
        AND status = 'MASTERED'
        AND last_reviewed IS NOT NULL
        AND (last_reviewed AT TIME ZONE 'UTC' + ($2 * INTERVAL '1 minute'))::date =
            (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' + ($2 * INTERVAL '1 minute'))::date;
    `;
    const { rows } = await db.query(sql, [userId, timezoneOffsetMinutes]);
    return parseInt(rows[0].count, 10);
  }

  _mapRows(rows) {
    return rows.map(
      (row) =>
        new Flashcard({
          id: row.id,
          user_id: row.user_id,
          word_id: row.word_id,
          topic_id: row.topic_id,
          status: row.status,
          last_reviewed: row.last_reviewed,
          created_at: row.created_at,
          word: new Word({
            id: row.word_id,
            word: row.word,
            pronunciation: row.pronunciation,
            part_of_speech: row.part_of_speech,
            meaning_vi: row.meaning_vi,
            isExternal: false,
          }),
        }),
    );
  }
}

module.exports = new FlashcardRepository();
