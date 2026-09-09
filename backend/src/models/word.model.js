class Word {
  constructor({
    id,
    word,
    pronunciation,
    part_of_speech,
    meaning_vi,
    topic_id,
    isExternal,
    rank,
  }) {
    this.id = id ?? null;
    this.word = word;
    this.pronunciation = pronunciation || "";
    this.part_of_speech = part_of_speech || "";
    this.meaning_vi = meaning_vi || "";
    this.topic_id = topic_id ?? null;
    this.isExternal = isExternal ?? false;
    this.rank = rank; // mức độ liên quan -> only tra cứu local
  }

  toJSON() {
    const json = {
      id: this.id,
      word: this.word,
      pronunciation: this.pronunciation,
      part_of_speech: this.part_of_speech,
      meaning_vi: this.meaning_vi,
      isExternal: this.isExternal,
    };

    if (this.topic_id !== null) json.topic_id = this.topic_id;
    if (this.rank !== undefined && this.rank !== null) {
      json.rank = Number(this.rank);
    }

    return json;
  }
}

module.exports = Word;
