const translate = require('google-translate-api-x');

class TranslationService {
  async translateToVietnamese(text) {
    if (!text || !text.trim()) return text;
    try {
      const res = await translate(text, { from: 'en', to: 'vi' });
      return res.text;
    } catch (error) {
      console.error("Lỗi gọi thư viện dịch thuật:", error);
      return text;
    }
  }

  async translateWordConcise(word) {
    if (!word || !word.trim()) return null;
    
    const translated = await this.translateToVietnamese(word.trim());
    
    // Nếu kết quả trả về y hệt từ gốc -> Google không dịch được
    if (!translated || translated.toLowerCase() === word.trim().toLowerCase()) {
      return null;
    }
    
    // Viết hoa chữ cái đầu cho đẹp
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  }
}

module.exports = new TranslationService();