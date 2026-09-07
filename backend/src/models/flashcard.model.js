class Flashcard {
  constructor({ id, user_id, word_id, topic_id, status, last_reviewed, word }) {
    this.id = id;
    this.user_id = user_id;
    this.word_id = word_id;
    this.topic_id = topic_id;
    this.status = status || 'NEW'; // 'NEW' | 'LEARNING' | 'MASTERED'
    this.last_reviewed = last_reviewed || null;
    this.word = word || null; // Optional: gắn kèm thông tin Word đầy đủ khi cần trả lồng (JOIN)
  }

  // Phương thức chuẩn hóa dữ liệu phản hồi về Client
  toJSON() {
    const json = {
      id: this.id,
      user_id: this.user_id,
      word_id: this.word_id,
      topic_id: this.topic_id,
      status: this.status,
      last_reviewed: this.last_reviewed,
    };
    // Chỉ đính kèm object word đầy đủ khi service có JOIN sẵn, tránh phá vỡ response cũ
    if (this.word) {
      json.word = typeof this.word.toJSON === 'function' ? this.word.toJSON() : this.word;
    }
    return json;
  }
}

module.exports = Flashcard;