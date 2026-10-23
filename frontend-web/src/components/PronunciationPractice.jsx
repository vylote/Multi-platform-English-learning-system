import { useState, useCallback } from "react";

// So khớp linh hoạt: bỏ dấu câu, viết hoa/thường không tính là sai
function normalizeText(text) {
  return text.trim().toLowerCase().replace(/[^\w\s]/g, "");
}

export default function PronunciationPractice({ targetWord, pronunciation, onResult }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null); // null | "correct" | "incorrect"
  const [errorType, setErrorType] = useState(null); // null | "browser_unsupported" | "permission_denied"

  const isSupported =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const playTargetAudio = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(targetWord);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }, [targetWord]);

  const handleSelfPassed = useCallback(() => {
    setResult("correct");
    setErrorType(null);
    if (onResult) onResult(true);
  }, [onResult]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setErrorType("browser_unsupported");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setResult(null);
      setErrorType(null);
      setTranscript("");
    };

    recognition.onresult = (event) => {
      const heard = event.results[0][0].transcript;
      setTranscript(heard);
      const isMatch = normalizeText(heard) === normalizeText(targetWord);
      setResult(isMatch ? "correct" : "incorrect");
      if (onResult) onResult(isMatch);
    };

    recognition.onerror = (event) => {
      console.error("Lỗi nhận diện giọng nói:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setErrorType("permission_denied");
      }
    };

    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
    } catch (err) {
      console.error("Không thể khởi động SpeechRecognition:", err);
      setIsListening(false);
      setErrorType("browser_unsupported");
    }
  }, [isSupported, targetWord, onResult]);

  return (
    <div className="max-w-[480px] mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-center shadow-sm">
      <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
        {targetWord}
      </p>

      {pronunciation && (
        <span className="inline-block text-base font-mono text-[#58cc02] font-bold px-3 py-1 rounded-xl bg-[#58cc02]/10 border border-[#58cc02]/20 mb-4">
          {pronunciation}
        </span>
      )}

      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6">
        Lắng nghe phát âm mẫu, sau đó bấm micro và đọc lại từ vựng
      </p>

      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <button
          type="button"
          onClick={playTargetAudio}
          className="px-5 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-bold text-sm text-gray-700 dark:text-gray-200 hover:border-[#58cc02] hover:text-[#58cc02] dark:hover:text-[#58cc02] hover:bg-[#58cc02]/5 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-2"
        >
          <span>🔊</span>
          <span>Nghe phát âm</span>
        </button>

        {isSupported ? (
          <button
            type="button"
            onClick={startListening}
            disabled={isListening}
            className={`px-6 py-3 rounded-2xl font-black text-sm text-white transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2 ${
              isListening
                ? "bg-rose-500 animate-pulse shadow-rose-500/30"
                : "bg-[#58cc02] hover:bg-[#4cb001] shadow-[#58cc02]/25"
            }`}
          >
            <span>🎙️</span>
            <span>{isListening ? "Đang lắng nghe..." : "Bấm để đọc từ"}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSelfPassed}
            className="px-6 py-3 rounded-2xl font-black text-sm text-white bg-[#58cc02] hover:bg-[#4cb001] shadow-md shadow-[#58cc02]/25 active:scale-95 cursor-pointer flex items-center gap-2 transition-all"
          >
            <span>✓</span>
            <span>Tôi đã luyện đọc từ này</span>
          </button>
        )}
      </div>

      {/* Thông báo riêng cho Firefox / trình duyệt chưa hỗ trợ Web Speech API */}
      {!isSupported && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left mb-4">
          <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 font-bold text-xs uppercase mb-1">
            <span>🦊</span>
            <span>Firefox chưa hỗ trợ Web Speech API</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
            Firefox không tích hợp sẵn công nghệ nhận diện giọng nói (STT). Bạn có thể mở trang trên <strong>Google Chrome</strong> hoặc <strong>Microsoft Edge</strong> để AI chấm điểm qua micro.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            👉 Trên Firefox: Bạn hãy bấm <strong>"Nghe phát âm"</strong> để luyện đọc theo, sau đó bấm <strong>"Tôi đã luyện đọc từ này"</strong> để hoàn tất.
          </p>
        </div>
      )}

      {errorType === "permission_denied" && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 dark:text-rose-400 mb-4 leading-relaxed text-left">
          <strong>Micro bị chặn:</strong> Vui lòng bấm vào biểu tượng ổ khóa/micro trên thanh địa chỉ của trình duyệt để cấp quyền truy cập micro cho trang web.
        </div>
      )}

      {transcript && (
        <div className="p-3 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700 mb-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          Hệ thống nghe được: <strong className="text-gray-900 dark:text-white">"{transcript}"</strong>
        </div>
      )}

      {result === "correct" && (
        <div className="p-3.5 rounded-2xl bg-[#58cc02]/10 border-2 border-[#58cc02]/30 text-sm sm:text-base font-extrabold text-[#58cc02] animate-fadeIn">
          ✓ Xuất sắc! Bạn đã luyện phát âm chuẩn từ này.
        </div>
      )}
      {result === "incorrect" && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-sm sm:text-base font-extrabold text-rose-500 animate-fadeIn">
          ✗ Chưa chuẩn lắm, hãy nghe lại mẫu và thử đọc lại nhé.
        </div>
      )}
    </div>
  );
}