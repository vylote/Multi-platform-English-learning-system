const wordRepository = require("../repositories/word.repository");
const Word = require("../models/word.model");
const translationService = require("./translation.service");
const { ErrorCode } = require("../common/error-code");
const AppException = require("../exceptions/app.exception");

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE

class WordService {
  async fetchFromExternalApi(word) {
    try {
      const response = await fetch(
        `${EXTERNAL_API_BASE}/${encodeURIComponent(word)}`,
      );
      if (!response.ok) return null;

      const data = await response.json();
      if (!data || !Array.isArray(data) || data.length === 0) return null;

      const entry = data[0];
      const phonetics = entry.phonetics || [];
      const pronunciation =
        phonetics.find((p) => p.text)?.text || `/${entry.word}/`;

      const meanings = entry.meanings || [];
      const firstMeaning = meanings[0] || {};
      const partOfSpeech = firstMeaning.partOfSpeech || "noun";

      const definitions = firstMeaning.definitions || [];
      const exampleSentence = definitions[0]?.example || ""; // Giữ nguyên tiếng Anh, không dịch

      // definition = nghĩa từ điển ngắn gọn tiếng Việt (dịch trực tiếp TỪ, không dịch câu giải thích)
      const definitionVi = await translationService.translateWordConcise(
        entry.word,
      );

      return new Word({
        id: null,
        word: entry.word,
        pronunciation,
        part_of_speech: partOfSpeech,
        meaning_vi: definitionVi,
        isExternal: true,
      });
    } catch (error) {
      console.error("Lỗi kết nối API từ điển ngoài:", error);
      return null;
    }
  }

  sanitizeQuery(rawQuery) {
    return (rawQuery || "")
      .trim()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .trim();
  }

  async searchWords(rawQuery) {
    const queryStr = (rawQuery || "").trim();
    if (!queryStr) {
      throw new AppException(
        ErrorCode.INVALID_DATA,
        "Từ khóa tìm kiếm không được để trống",
      );
    }

    const sanitized = this.sanitizeQuery(queryStr);
    const localResults = sanitized
      ? await wordRepository.searchByFullText(sanitized, queryStr)
      : [];
    if (localResults.length > 0) {
      return { source: "local", results: localResults };
    }

    const externalWord = await this.fetchFromExternalApi(queryStr);
    if (externalWord) {
      const cachedId = await wordRepository.upsert(externalWord);
      externalWord.id = cachedId;
      return { source: "external", results: [externalWord] };
    }

    throw new AppException(
      ErrorCode.WORD_NOT_FOUND,
      `Không tìm thấy thông tin cho từ "${queryStr}"`,
    );
  }

  async upsertWord(wordData, client) {
    return wordRepository.upsert(wordData, client);
  }
}

module.exports = new WordService();
