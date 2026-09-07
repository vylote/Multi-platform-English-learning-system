const db = require("../config/db");
const Word = require("../models/word.model");

class WordRepository {
  async searchByFullText(sanitizedQuery, originalQuery) {
    const formattedQuery = sanitizedQuery.replace(/\s+/g, " & ") + ":*";
    const sql = `
      SELECT id, word, pronunciation, part_of_speech, meaning_vi,
             ts_rank(to_tsvector('english', word || ' ' || meaning_vi), to_tsquery('english', $1)) as rank
      FROM words
      WHERE to_tsvector('english', word || ' ' || meaning_vi) @@ to_tsquery('english', $1)
      ORDER BY
        (LOWER(word) = LOWER($2)) DESC,
        (LOWER(word) LIKE LOWER($2) || '%') DESC,
        rank DESC,
        length(word) ASC
      LIMIT 20;
    `;
    // Truyền thêm originalQuery vào $2
    const { rows } = await db.query(sql, [formattedQuery, originalQuery]);
    return rows.map((row) => new Word({ ...row, isExternal: false }));
  }

  // client: cho phép tái sử dụng transaction đang mở từ FlashcardRepository, mặc định dùng db riêng
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
      wordData.definition || "",
      wordData.example_sentence || "",
    ]);
    return rows[0].id;
  }
}

module.exports = new WordRepository();