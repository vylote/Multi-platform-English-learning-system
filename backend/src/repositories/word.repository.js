const db = require("../config/db");
const Word = require("../models/word.model");

class WordRepository {
  async searchByFullText(originalQuery) {
    const trimmed = originalQuery.trim();

    const sql = `
    SELECT id, word, pronunciation, part_of_speech, meaning_vi
    FROM words
    WHERE LOWER(word) = LOWER($1)
    LIMIT 1;
  `;
    const { rows } = await db.query(sql, [trimmed]);
    return rows.map((row) => new Word({ ...row, isExternal: false }));
  }

  //TODO: client: cho phép tái sử dụng transaction đang mở từ FlashcardRepository, mặc định mở pool connection riêng
  async upsert(wordData, client = db) {
    const sql = `
      INSERT INTO words (word, pronunciation, part_of_speech, meaning_vi)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (LOWER(word)) DO UPDATE 
      SET 
        pronunciation = EXCLUDED.pronunciation,
        part_of_speech = EXCLUDED.part_of_speech,
        meaning_vi = EXCLUDED.meaning_vi
      RETURNING id;
    `;
    const { rows } = await client.query(sql, [
      wordData.word.trim(),
      wordData.pronunciation || "",
      wordData.part_of_speech || "noun",
      wordData.meaning_vi || "",
    ]);
    return rows[0].id;
  }

  // Lấy ngẫu nhiên N từ thuộc 1 chủ đề mà user CHƯA SỞ HỮU (chưa có trong flashcards, bất kể status)
  async findRandomByTopicExcludingOwned(topicId, userId, limit) {
    const sql = `
    SELECT id, word, pronunciation, part_of_speech, meaning_vi, topic_id
    FROM words w
    WHERE w.topic_id = $1
      AND w.id NOT IN (SELECT word_id FROM flashcards WHERE user_id = $2)
    ORDER BY RANDOM()
    LIMIT $3;
  `;
    const { rows } = await db.query(sql, [topicId, userId, limit]);
    return rows.map((row) => new Word({ ...row, isExternal: false }));
  }
}

module.exports = new WordRepository();
