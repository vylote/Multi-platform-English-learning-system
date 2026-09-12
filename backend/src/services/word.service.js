const wordRepository = require("../repositories/word.repository");
const Word = require("../models/word.model");
const translationService = require("./translation.service");
const { ErrorCode } = require("../common/error-code");
const AppException = require("../exceptions/app.exception");
const redisClient = require("../config/redis");

const MW_COLLEGIATE_KEY = process.env.MW_COLLEGIATE_API_KEY;
const MW_LEARNERS_KEY = process.env.MW_LEARNERS_API_KEY;

const MW_TIMEOUT_MS = 5000;

const MAX_QUERY_WORDS = 4;
const MAX_QUERY_LENGTH = 50;

const CACHE_KEY_PREFIX = "word_search:";
const CACHE_TTL_SECONDS = 3600;

class WordService {
  async fetchFromMerriamWebster(word, dictType) {
    const isCollegiate = dictType === "collegiate";
    const apiKey = isCollegiate ? MW_COLLEGIATE_KEY : MW_LEARNERS_KEY;

    if (!apiKey) {
      console.error(`Thiếu API key Merriam-Webster (${dictType})`);
      return null;
    }

    const baseUrl = isCollegiate
      ? "https://www.dictionaryapi.com/api/v3/references/collegiate/json"
      : "https://www.dictionaryapi.com/api/v3/references/learners/json";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MW_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${baseUrl}/${encodeURIComponent(word)}?key=${apiKey}`,
        { signal: controller.signal },
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(
          `Merriam-Webster (${dictType}) HTTP lỗi:`,
          response.status,
        );
        return null;
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) return null;

      // Từ không tồn tại -> MW trả về mảng string gợi ý chính tả, không phải object
      if (typeof data[0] === "string") return null;

      // Chỉ giữ entry THẬT SỰ có nghĩa (bỏ entry rỗng dạng cross-reference,
      // vd "donut" -> chỉ trỏ sang "doughnut", không có shortdef riêng)
      const validEntries = data.filter(
        (e) => e && Array.isArray(e.shortdef) && e.shortdef.length > 0,
      );
      if (validEntries.length === 0) return null;

      // Ưu tiên: (1) khớp chính xác headword -> (2) khớp trong danh sách biến thể (stems) -> (3) entry đầu tiên có nghĩa
      const entry =
        validEntries.find(
          (e) => e.meta?.id?.split(":")[0].toLowerCase() === word.toLowerCase(),
        ) ||
        validEntries.find(
          (e) =>
            Array.isArray(e.meta?.stems) &&
            e.meta.stems.some((s) => s.toLowerCase() === word.toLowerCase()),
        ) ||
        validEntries[0];

      return {
        headword: word, // giữ đúng spelling người dùng đã gõ (vd "donut" không đổi thành "doughnut")
        pronunciation: this.extractMwPronunciation(entry),
        partOfSpeech: entry.fl || "",
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        console.error(
          `Merriam-Webster (${dictType}) timeout sau ${MW_TIMEOUT_MS}ms:`,
          word,
        );
      } else {
        console.error(`Lỗi gọi Merriam-Webster (${dictType}):`, error.message);
      }
      return null;
    }
  }

  extractMwPronunciation(entry) {
    const hwiPrs = entry.hwi?.prs;
    if (hwiPrs && hwiPrs.length > 0) {
      const first = hwiPrs[0];
      if (first.ipa) return `/${first.ipa}/`;
      if (first.mw) return `/${first.mw}/`;
    }

    // Fallback: phiên âm nằm trong biến thể chính tả (vd "donut" là biến thể của "doughnut")
    if (Array.isArray(entry.vrs)) {
      for (const variant of entry.vrs) {
        const vPrs = variant.prs;
        if (vPrs && vPrs.length > 0) {
          const first = vPrs[0];
          if (first.ipa) return `/${first.ipa}/`;
          if (first.mw) return `/${first.mw}/`;
        }
      }
    }

    return "";
  }

  async fetchFromExternalApi(word) {
    // Ưu tiên Collegiate (bao quát hơn), fallback Learner's (định nghĩa đơn giản, hợp người học)
    let mwResult = await this.fetchFromMerriamWebster(word, "collegiate");
    if (!mwResult) {
      mwResult = await this.fetchFromMerriamWebster(word, "learners");
    }
    if (!mwResult) return null;

    // Dịch nghĩa tiếng Việt ngắn gọn cho TỪ, không dịch định nghĩa tiếng Anh của MW
    const definitionVi = await translationService.translateWordConcise(
      mwResult.headword,
    );
    if (!definitionVi) return null;

    return new Word({
      id: null,
      word: mwResult.headword,
      pronunciation: mwResult.pronunciation,
      part_of_speech: mwResult.partOfSpeech,
      meaning_vi: definitionVi,
      isExternal: true,
    });
  }

  validateQuery(queryStr) {
    if (!queryStr) {
      throw new AppException(
        ErrorCode.INVALID_DATA,
        "Từ khóa tìm kiếm không được để trống",
      );
    }
    if (queryStr.length > MAX_QUERY_LENGTH) {
      throw new AppException(
        ErrorCode.INVALID_DATA,
        "Vui lòng nhập một từ hoặc cụm từ ngắn để tra cứu, không phải cả câu.",
      );
    }
    const wordCount = queryStr.split(/\s+/).filter(Boolean).length;
    if (wordCount > MAX_QUERY_WORDS) {
      throw new AppException(
        ErrorCode.INVALID_DATA,
        "Vui lòng nhập tối đa 4 từ để tra cứu từ điển.",
      );
    }
  }

  async getCachedResult(cacheKey) {
    try {
      const cached = await redisClient.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      // Redis lỗi (mất kết nối, timeout...) không được làm fail cả request tra từ
      // -> chỉ log lại, coi như cache miss, để luồng tiếp tục tra DB/API ngoài bình thường
      console.error(
        "Lỗi đọc Redis cache (bỏ qua, tra trực tiếp):",
        error.message,
      );
      return null;
    }
  }

  async setCachedResult(cacheKey, response) {
    try {
      await redisClient.set(cacheKey, JSON.stringify(response), {
        EX: CACHE_TTL_SECONDS,
      });
    } catch (error) {
      console.error("Lỗi ghi Redis cache:", error.message);
    }
  }

  async searchWords(rawQuery) {
    const queryStr = (rawQuery || "").trim();
    this.validateQuery(queryStr);

    const cacheKey = `${CACHE_KEY_PREFIX}${queryStr.toLowerCase()}`;

    // 1. Kiểm tra cache trước tiên - nếu người khác đã tra từ này gần đây, trả ngay không đụng DB/API ngoài
    const cachedResponse = await this.getCachedResult(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 2. Cache miss -> tra local DB
    const localResults = await wordRepository.searchByFullText(queryStr);
    if (localResults.length > 0) {
      const response = { source: "local", results: localResults };
      await this.setCachedResult(cacheKey, response);
      return response;
    }

    // 3. Local cũng miss -> tra external API
    const externalWord = await this.fetchFromExternalApi(queryStr);
    if (externalWord) {
      const cachedId = await wordRepository.upsert(externalWord);
      externalWord.id = cachedId;
      const response = { source: "external", results: [externalWord] };
      await this.setCachedResult(cacheKey, response);
      return response;
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
