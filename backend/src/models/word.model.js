class Word {
  constructor({ id, word, pronunciation, part_of_speech, meaning_vi, isExternal, rank }) {
    this.id = id ?? null;
    this.word = word;
    this.pronunciation = pronunciation || '';
    this.part_of_speech = part_of_speech || '';
    this.meaning_vi = meaning_vi || '';
    this.isExternal = isExternal ?? false; // Đánh dấu từ vựng lấy từ API ngoài hay đã có sẵn trong hệ thống
    this.rank = rank; // Điểm liên quan từ Full-Text Search, chỉ có khi tra từ nội bộ
  }

  // Phương thức chuẩn hóa dữ liệu phản hồi về Client
  toJSON() {
    const json = {
      id: this.id,
      word: this.word,
      pronunciation: this.pronunciation,
      part_of_speech: this.part_of_speech,
      meaning_vi: this.meaning_vi,
      isExternal: this.isExternal,
    };
    
    // Chỉ trả kèm rank khi có (kết quả tìm kiếm nội bộ), tránh rác dữ liệu khi trả từ API ngoài
    if (this.rank !== undefined && this.rank !== null) {
      json.rank = Number(this.rank);
    }
    
    return json;
  }
}

module.exports = Word;