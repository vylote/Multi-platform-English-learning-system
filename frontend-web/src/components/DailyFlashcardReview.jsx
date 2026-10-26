import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setStreak, fetchStreakWeek } from "../store/slice/streakSlice";
import { getBackendTimezoneOffset } from "../utils/timezone";
import api from "../api/api";
import { TopicIcon } from "../utils/topicIcons";

export default function DailyFlashcardReview({
  endpoint = "/flashcards/daily",
  topicName = "Bộ thẻ ôn tập",
  returnTo,
  onBack,
}) {
  const [cards, setCards] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streakInfo, setStreakInfo] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    const controller = new AbortController();

    api
      .get(endpoint, { signal: controller.signal })
      .then((response) => {
        setCards(response.data?.result || []);
      })
      .catch((error) => {
        if (error.code === "ERR_CANCELED") return;
        setLoadError(
          error.response?.data?.message || "Không thể tải bộ ôn tập.",
        );
        setCards([]);
      });

    return () => controller.abort();
  }, [endpoint]);

  const currentCard = cards && cards[currentIndex];
  const isSessionDone = cards !== null && currentIndex >= cards.length;

  const playAudio = useCallback((text) => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } catch {
      // SpeechSynthesis có thể không khả dụng
    }
  }, []);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleAnswer = useCallback(
    async (targetStatus) => {
      if (!currentCard || isSubmitting) return;
      setIsSubmitting(true);

      try {
        const response = await api.put(`/flashcards/${currentCard.id}`, {
          status: targetStatus,
          timezone_offset: getBackendTimezoneOffset(),
        });

        if (response.data?.result?.streak) {
          dispatch(setStreak(response.data.result.streak));
          dispatch(fetchStreakWeek());
          setStreakInfo(response.data.result.streak);
        }

        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } catch (error) {
        setLoadError(
          error.response?.data?.message ||
            "Không thể cập nhật tiến độ, vui lòng thử lại.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentCard, isSubmitting, dispatch],
  );

  // Phím tắt
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped && (e.key === "1" || e.key === "ArrowLeft")) {
        e.preventDefault();
        handleAnswer("LEARNING");
      } else if (isFlipped && (e.key === "2" || e.key === "ArrowRight")) {
        e.preventDefault();
        handleAnswer("MASTERED");
      } else if (e.key === "a" || e.key === "A") {
        if (currentCard?.word?.word) {
          playAudio(currentCard.word.word);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, currentCard, handleFlip, handleAnswer, playAudio]);

  const backLabel = returnTo === "/learn" ? "Quay lại lộ trình" : "Chọn chủ đề khác";

  // 1. TRẠNG THÁI ĐANG TẢI
  if (cards === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500 text-sm">
        <div className="w-9 h-9 border-3 border-[#58cc02] border-t-transparent rounded-full animate-spin mb-3 inline-block" />
        <p className="font-semibold">Đang chuẩn bị bộ thẻ ôn tập...</p>
      </div>
    );
  }

  // 2. TRẠNG THÁI LỖI
  if (loadError && cards.length === 0 && currentIndex === 0) {
    return (
      <div className="w-full max-w-[560px] mx-auto text-center py-16">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs hover:border-[#58cc02] transition-all cursor-pointer group active:scale-95 mb-6"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>{backLabel}</span>
          </button>
        )}
        <div className="p-6 rounded-3xl bg-rose-500/10 border-2 border-rose-500/20 text-rose-500 dark:text-rose-400 text-sm font-semibold">
          {loadError}
        </div>
      </div>
    );
  }

  // 3. TRẠNG THÁI HẾT TỪ VỰNG (TRỐNG)
  if (cards.length === 0) {
    return (
      <div className="w-full max-w-[560px] mx-auto text-center py-16">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs hover:border-[#58cc02] transition-all cursor-pointer group active:scale-95 mb-6"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>{backLabel}</span>
          </button>
        )}
        <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#58cc02]/10 border-2 border-[#58cc02]/30 flex items-center justify-center mx-auto mb-4 p-3">
            <img src="/assets/icons/mascot.svg" alt="Finished" className="w-10 h-10 object-contain" />
          </div>
          <p className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Bạn đã ôn tập hết toàn bộ từ vựng hiện có!
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Hãy tiếp tục học thêm các chủ đề mới trên lộ trình học để mở rộng vốn từ nhé.
          </p>
        </div>
      </div>
    );
  }

  // 4. TRẠNG THÁI HOÀN THÀNH
  if (isSessionDone) {
    return (
      <div className="w-full max-w-[560px] mx-auto text-center py-12 px-4">
        {onBack && (
          <div className="text-left mb-6">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs hover:border-[#58cc02] transition-all cursor-pointer group active:scale-95"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>{returnTo === "/learn" ? "Quay lại lộ trình" : "Chọn chủ đề khác"}</span>
            </button>
          </div>
        )}

        <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#58cc02]/10 border-2 border-[#58cc02]/30 flex items-center justify-center mx-auto mb-4 p-3">
            <img src="/assets/icons/trophy.svg" alt="Trophy" className="w-10 h-10 object-contain" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2">
            Hoàn thành bộ ôn tập!
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed">
            Bạn đã ôn tập xong {cards.length} từ vựng của chủ đề{" "}
            <strong className="text-gray-900 dark:text-white font-black">{topicName}</strong>.
          </p>

          {streakInfo && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-500/10 border-2 border-orange-500/20 text-orange-500 font-black text-sm mb-6">
              <img src="/assets/icons/streak-fire.svg" alt="Streak" className="w-5 h-5 object-contain" />
              <span>Chuỗi học tập: {streakInfo.current_streak} ngày liên tiếp!</span>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-[#58cc02] hover:text-[#58cc02] dark:hover:text-[#58cc02] bg-white dark:bg-gray-800 transition-all cursor-pointer active:scale-98 shadow-2xs"
            >
              🔄 Ôn lại bộ này
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="flex-1 py-3.5 rounded-2xl text-sm font-black bg-[#58cc02] hover:bg-[#4cb001] text-white shadow-md shadow-[#58cc02]/25 transition-all cursor-pointer active:scale-98"
              >
                {returnTo === "/learn" ? "Về lộ trình học →" : "Chọn chủ đề khác →"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 5. TRẠNG THÁI ĐANG HỌC (MAIN FLASHCARD VIEW)
  const { word } = currentCard;
  const progressPercent = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="w-full max-w-[560px] mx-auto text-left">
      {/* HEADER BAR: Back Button + Topic Badge */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs hover:border-[#58cc02] dark:hover:border-[#58cc02] transition-all cursor-pointer group active:scale-95"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>{backLabel}</span>
          </button>
        )}

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#58cc02]/10 text-[#58cc02] border border-[#58cc02]/30 shrink-0">
          <TopicIcon topicName={topicName} className="w-4 h-4 object-contain inline-block" />
          <span className="truncate max-w-[180px] sm:max-w-none">{topicName}</span>
        </div>
      </div>

      {/* PROGRESS BAR & STATUS BADGE */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2 text-xs sm:text-sm">
          <span className="font-extrabold text-gray-600 dark:text-gray-300">
            Thẻ {currentIndex + 1} / {cards.length}
          </span>

          <span
            className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
              currentCard.status === "MASTERED"
                ? "bg-[#58cc02]/10 text-[#58cc02] border-[#58cc02]/30"
                : currentCard.status === "LEARNING"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  : "bg-blue-500/10 text-blue-500 border-blue-500/30"
            }`}
          >
            {currentCard.status === "MASTERED"
              ? "🏆 Đã thuộc"
              : currentCard.status === "LEARNING"
                ? "⚡ Đang học"
                : "✨ Từ mới"}
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-[#58cc02] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* FLASHCARD (Duolingo Style 3D Interactive Card) */}
      <div
        className="w-full cursor-pointer select-none group"
        onClick={handleFlip}
        role="button"
        tabIndex={0}
      >
        <div className="w-full min-h-[340px] sm:min-h-[380px] rounded-3xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#58cc02] dark:hover:border-[#58cc02] bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between p-7 sm:p-9 relative active:scale-[0.99]">
          {/* Header trong thẻ */}
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-xl bg-gray-100 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700 text-gray-600 dark:text-gray-300">
              {word.part_of_speech || (isFlipped ? "Nghĩa tiếng Việt" : "Từ vựng tiếng Anh")}
            </span>

            {/* Nút phát âm */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playAudio(word.word);
              }}
              className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-700/80 hover:bg-[#58cc02] text-gray-600 dark:text-gray-300 hover:text-white flex items-center justify-center text-lg active:scale-90 transition-all shadow-2xs cursor-pointer group-hover:bg-[#58cc02]/10 group-hover:text-[#58cc02]"
              title="Phát âm (Phím A)"
            >
              🔊
            </button>
          </div>

          {/* Nội dung trung tâm của thẻ */}
          <div className="my-auto py-6 text-center">
            {!isFlipped ? (
              <div>
                <p className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight break-words mb-3">
                  {word.word}
                </p>
                {word.pronunciation && (
                  <div className="inline-block px-3.5 py-1 rounded-xl bg-[#58cc02]/10 border border-[#58cc02]/20 text-[#58cc02] font-mono font-bold text-base sm:text-lg">
                    {word.pronunciation}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 flex items-center justify-center gap-1.5">
                  <span>🇻🇳</span> Ý nghĩa tiếng Việt
                </span>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-relaxed mb-4 max-w-md mx-auto">
                  {word.meaning_vi}
                </p>
                <div className="inline-block px-3 py-1 rounded-xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-white font-bold">{word.word}</strong>
                  {word.pronunciation ? ` · ${word.pronunciation}` : ""}
                </div>
              </div>
            )}
          </div>

          {/* Gợi ý bấm dưới đáy thẻ */}
          <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-700/50">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 inline-flex items-center gap-1.5">
              <span>💡</span>
              <span>{!isFlipped ? "Chạm thẻ hoặc phím Space để xem nghĩa" : "Chạm thẻ để lật lại từ vựng"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* CÁC NÚT ĐÁNH GIÁ (KHI THẺ ĐÃ LẬT) */}
      {isFlipped && (
        <div className="mt-6 animate-fadeIn">
          <div className="flex gap-3">
            <button
              onClick={() => handleAnswer("LEARNING")}
              disabled={isSubmitting}
              className="flex-1 py-4 rounded-2xl font-black text-sm sm:text-base border-2 border-orange-400/80 dark:border-orange-500 text-orange-500 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 active:scale-98 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              <span>Cần ôn thêm (Phím 1)</span>
            </button>
            <button
              onClick={() => handleAnswer("MASTERED")}
              disabled={isSubmitting}
              className="flex-1 py-4 rounded-2xl font-black text-sm sm:text-base bg-[#58cc02] hover:bg-[#4cb001] text-white active:scale-98 transition-all shadow-md shadow-[#58cc02]/25 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>✓</span>
              <span>Đã thuộc (Phím 2)</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 mt-3 text-[11px] font-bold text-gray-400 dark:text-gray-500">
            <span>Phím tắt:</span>
            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono">
              Space
            </span>
            <span>lật thẻ</span>
            <span>·</span>
            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono">
              A
            </span>
            <span>phát âm</span>
          </div>
        </div>
      )}

      {loadError && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-3 text-center">
          {loadError}
        </p>
      )}
    </div>
  );
}