const db = require("../config/db");

class WordQuestionRepository {
  async findByWordIds(wordIds) {
    if (!wordIds || wordIds.length === 0) return [];
    const sql = `
      SELECT id, word_id, question_text, option_a, option_b, option_c, option_d, correct_option
      FROM word_questions
      WHERE word_id = ANY($1::int[]);
    `;
    const { rows } = await db.query(sql, [wordIds]);
    return rows;
  }

  async saveBatch(questions) {
    if (!questions || questions.length === 0) return [];
    const results = [];
    for (const q of questions) {
      const sql = `
        INSERT INTO word_questions (word_id, question_text, option_a, option_b, option_c, option_d, correct_option)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
      `;
      const { rows } = await db.query(sql, [
        q.wordId,
        q.questionText,
        q.optionA,
        q.optionB,
        q.optionC,
        q.optionD,
        q.correctOption,
      ]);
      results.push({ ...q, id: rows[0].id });
    }
    return results;
  }

  async findWordsWithoutQuestions(topicId, limit = 10) {
    const sql = `
      SELECT w.id, w.word, w.meaning_vi, w.pronunciation
      FROM words w
      LEFT JOIN word_questions wq ON wq.word_id = w.id
      WHERE w.topic_id = $1 AND wq.id IS NULL
      LIMIT $2;
    `;
    const { rows } = await db.query(sql, [topicId, limit]);
    return rows;
  }
}

module.exports = new WordQuestionRepository();

