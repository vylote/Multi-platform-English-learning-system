const TRANSLATE_API_BASE = process.env.TRANSLATE_API_BASE_URL;

// Lưu ý: pattern /^[a-zA-Zà-ỹ]/ chỉ để minh họa, xóa dòng dưới nếu không cần
const isGarbage = (text) => {
  if (!text) return true;
  if (text.length > 60) return true; // Nghĩa từ điển thật hiếm khi dài hơn 60 ký tự
  if (/["…]|\.\.\./.test(text)) return true; // Chứa dấu ngoặc kép / dấu ba chấm -> dấu hiệu câu bị cắt
  if (/^(và|cho|là|của|một)\s/i.test(text)) return true; // Bắt đầu bằng từ nối -> chắc chắn là mảnh câu, không phải nghĩa hoàn chỉnh
  return false;
};

class TranslationService {
  async translateToVietnamese(text) {
    if (!text || !text.trim()) return text;
    try {
      const url = `${TRANSLATE_API_BASE}?q=${encodeURIComponent(text)}&langpair=en|vi`;
      const response = await fetch(url);
      if (!response.ok) return text;
      const data = await response.json();
      return data?.responseData?.translatedText || text;
    } catch (error) {
      console.error("Lỗi gọi API dịch thuật:", error);
      return text;
    }
  }

  async translateWordConcise(word) {
    if (!word || !word.trim()) return "";

    try {
      const url = `${TRANSLATE_API_BASE}?q=${encodeURIComponent(word.trim())}&langpair=en|vi`;
      const response = await fetch(url);
      if (!response.ok) return word;

      const data = await response.json();
      const primary = data?.responseData?.translatedText;

      // Chỉ lấy alternatives chất lượng RẤT cao (>=90) và không dính rác
      const alternatives = (data.matches || [])
        .filter((m) => m.translation && Number(m.quality || 0) >= 90)
        .map((m) => m.translation.trim())
        .filter((t) => t.split(" ").length <= 3 && !isGarbage(t));

      const candidates = [primary, ...alternatives].filter((t) => t && !isGarbage(t));

      const uniqueMeanings = [...new Set(candidates.map((t) => t.toLowerCase()))].slice(0, 3);

      if (uniqueMeanings.length === 0) {
        // Không có kết quả nào đủ "sạch" -> báo hiệu cho service biết để tự fallback,
        // KHÔNG trả về rác cho người dùng
        return null;
      }

      return uniqueMeanings.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ");
    } catch (error) {
      console.error("Lỗi gọi API dịch thuật (concise):", error);
      return null;
    }
  }
}

module.exports = new TranslationService();