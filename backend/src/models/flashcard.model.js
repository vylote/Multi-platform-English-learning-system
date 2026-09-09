class Flashcard {
  constructor({ id, user_id, word_id, topic_id, status, last_reviewed, created_at, word }) {
    this.id = id;
    this.user_id = user_id;
    this.word_id = word_id;
    this.topic_id = topic_id;
    this.status = status || 'NEW'; // 'NEW' | 'LEARNING' | 'MASTERED'
    this.last_reviewed = last_reviewed || null;
    this.created_at = created_at || null;
    this.word = word || null;
  }

  toJSON() {
    const json = {
      id: this.id,
      user_id: this.user_id,
      word_id: this.word_id,
      topic_id: this.topic_id,
      status: this.status,
      last_reviewed: this.last_reviewed,
      created_at: this.created_at,
    };
    if (this.word) {
      json.word = typeof this.word.toJSON === 'function' ? this.word.toJSON() : this.word;
    }
    return json;
  }
}

module.exports = Flashcard;