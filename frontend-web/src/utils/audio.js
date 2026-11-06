/**
 * Trình phát âm thanh đa nền tảng (Cross-platform Audio Player)
 * Tương thích 100% với Firefox trên Linux, Chrome, Safari và Android WebView.
 * 
 * Sử dụng nguồn phát âm chuẩn quốc tế Youdao US (Type 2 = American English)
 * định dạng audio/mpeg tiêu chuẩn, không bị chặn bởi tường lửa hay Referer.
 */

let currentAudio = null;

export function playAudio(text) {
  if (!text || typeof window === "undefined") return;

  const cleanText = text.trim();
  if (!cleanText) return;

  // Dọn dẹp đối tượng âm thanh cũ nếu đang phát
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = "";
    } catch {
      // Bỏ qua lỗi ngắt âm thanh
    }
    currentAudio = null;
  }

  const encoded = encodeURIComponent(cleanText);
  // Endpoint phát âm tiếng Anh Mỹ (US English) chuẩn xác, hỗ trợ mọi trình duyệt
  const audioUrl = `https://dict.youdao.com/dictvoice?type=2&audio=${encoded}`;

  try {
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch((err) => {
        // Chỉ fallback nếu không phải do người dùng chủ động ngắt (AbortError)
        if (err.name !== "AbortError") {
          console.warn("[Online TTS fallback]:", err.message);
          fallbackSpeechSynthesis(cleanText);
        }
      });
    }
  } catch (err) {
    console.warn("[Audio Creation Error]:", err.message);
    fallbackSpeechSynthesis(cleanText);
  }
}

function fallbackSpeechSynthesis(text) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;

    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find((v) => v.lang.startsWith("en"));
    if (enVoice) {
      utterance.voice = enVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error("[SpeechSynthesis Error]:", e);
  }
}
