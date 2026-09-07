const { Pool } = require("pg");
const pool = new Pool();
const Flashcard = require("../models/flashcard.model");
const Word = require("../models/word.model");

class FlashcardRepository {
  async getClient() {
    return pool.connect();
  }

  async insert({ userId, wordId, topicId }, client) {
    const sql = `
      INSERT INTO flashcards (user_id, word_id, topic_id, status)
      VALUES ($1, $2, $3, 'NEW')
      ON CONFLICT (user_id, word_id) DO NOTHING
      RETURNING *;
    `;
    const { rows } = await client.query(sql, [userId, wordId, topicId]);
    return rows.length > 0 ? new Flashcard(rows[0]) : null;
  }

  async findByUser(userId) {
    const sql = `
      SELECT f.id, f.user_id, f.word_id, f.topic_id, f.status, f.last_reviewed,
             w.word, w.pronunciation, w.part_of_speech, w.definition, w.example_sentence
      FROM flashcards f
      JOIN words w ON w.id = f.word_id
      WHERE f.user_id = $1
      ORDER BY f.id DESC;
    `;
    const { rows } = await pool.query(sql, [userId]);
    return rows.map(
      (row) =>
        new Flashcard({
          id: row.id,
          user_id: row.user_id,
          word_id: row.word_id,
          topic_id: row.topic_id,
          status: row.status,
          last_reviewed: row.last_reviewed,
          word: new Word({
            id: row.word_id,
            word: row.word,
            pronunciation: row.pronunciation,
            part_of_speech: row.part_of_speech,
            definition: row.definition,
            example_sentence: row.example_sentence,
            isExternal: false,
          }),
        }),
    );
  }
}

module.exports = new FlashcardRepository();