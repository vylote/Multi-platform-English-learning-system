import { useState, useCallback } from "react";

// So khớp linh hoạt: bỏ dấu câu, viết hoa/thường không tính là sai
function normalizeText(text) {
  return text.trim().toLowerCase().replace(/[^\w\s]/g, "");
}

export default function PronunciationPractice({ targetWord, onResult }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null); // null | "correct" | "incorrect" | "unsupported"

  const isSupported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  const playTargetAudio = useCallback(() => {
    const utterance = new SpeechSynthesisUtterance(targetWord);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }, [targetWord]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setResult("unsupported");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setResult(null);
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
      if (event.error === "not-allowed") {
        setResult("unsupported");
      }
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, [isSupported, targetWord, onResult]);

  return (
    <div className="max-w-[420px] mx-auto p-6 rounded-2xl border border-gray-200 dark:border-gray-700 text-center">
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{targetWord}</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Nghe mẫu, sau đó bấm micro và đọc theo</p>

      <div className="flex justify-center gap-3 mb-6">
        <button
          type="button"
          onClick={playTargetAudio}
          className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-medium text-sm
                     hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          🔊 Nghe mẫu
        </button>

        <button
          type="button"
          onClick={startListening}
          disabled={isListening}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-colors ${
            isListening ? "bg-red-500 animate-pulse" : "bg-[#58cc02] hover:bg-[#4cb001]"
          }`}
        >
          {isListening ? "🎙️ Đang nghe..." : "🎙️ Bấm để nói"}
        </button>
      </div>

      {result === "unsupported" && (
        <p className="text-sm text-orange-500">
          Trình duyệt của bạn không hỗ trợ nhận diện giọng nói, hoặc chưa cấp quyền micro. Vui lòng dùng Chrome/Edge và cho phép truy cập micro.
        </p>
      )}

      {transcript && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Bạn đã nói: <span className="font-semibold text-gray-700 dark:text-gray-300">"{transcript}"</span>
        </p>
      )}

      {result === "correct" && (
        <p className="text-lg font-bold text-[#58cc02]">✓ Chính xác! Phát âm đúng.</p>
      )}
      {result === "incorrect" && (
        <p className="text-lg font-bold text-red-500">✗ Chưa đúng, thử lại nhé.</p>
      )}
    </div>
  );
}