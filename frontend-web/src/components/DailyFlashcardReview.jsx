import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setStreak, fetchStreakWeek } from "../store/slice/streakSlice";
import { getBackendTimezoneOffset } from "../utils/timezone";
import api from "../api/api";

export default function DailyFlashcardReview() {
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
      .get("/flashcards/daily", { signal: controller.signal })
      .then((response) => {
        setCards(response.data?.result || []);
      })
      .catch((error) => {
        if (error.code === "ERR_CANCELED") return;
        setLoadError(
          error.response?.data?.message || "Không thể tải bộ ôn tập hôm nay.",
        );
        setCards([]);
      });

    return () => controller.abort();
  }, []);

  const currentCard = cards && cards[currentIndex];
  const isSessionDone = cards !== null && currentIndex >= cards.length;

  const handleFlip = () => setIsFlipped((prev) => !prev);

  const handleAnswer = async (targetStatus) => {
    if (!currentCard || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await api.put(`/flashcards/${currentCard.id}`, {
        status: targetStatus,
        timezone_offset: getBackendTimezoneOffset(),
      });

      if (response.data?.result?.streak) {
        dispatch(setStreak(response.data.result.streak));
        dispatch(fetchStreakWeek()); // đồng bộ lại panel 7 ngày - ô hôm nay chuyển cam ngay
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
  };

  if (cards === null) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 dark:text-gray-500 text-sm">
        Đang tải bộ ôn tập hôm nay...
      </div>
    );
  }

  if (loadError && cards.length === 0 && currentIndex === 0) {
    return (
      <div className="w-full max-w-[560px] mx-auto text-center py-16">
        <p className="text-red-500 dark:text-red-400 text-sm">{loadError}</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="w-full max-w-[560px] mx-auto text-center py-16">
        <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Bạn đã học hết toàn bộ từ vựng hiện có!
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Hãy quay lại sau khi có thêm chủ đề mới nhé.
        </p>
      </div>
    );
  }

  if (isSessionDone) {
    return (
      <div className="w-full max-w-[560px] mx-auto text-center py-16">
        <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Hoàn thành bộ ôn tập hôm nay! 🎉
        </p>
        {streakInfo && (
          <p className="text-sm text-[#58cc02] font-semibold">
            Chuỗi ngày học của bạn đã được ghi nhận hôm nay!
          </p>
        )}
      </div>
    );
  }

  const { word } = currentCard;
  const progressPercent = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="w-full max-w-[560px] mx-auto">
      {/* Thanh tiến độ */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            Thẻ {currentIndex + 1} / {cards.length}
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              currentCard.status === "MASTERED"
                ? "bg-[#58cc02]/10 text-[#58cc02]"
                : currentCard.status === "LEARNING"
                  ? "bg-orange-100 text-orange-500 dark:bg-orange-900/30"
                  : "bg-blue-100 text-blue-500 dark:bg-blue-900/30"
            }`}
          >
            {currentCard.status}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-[#58cc02] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Thẻ flip - dùng CSS Grid overlay để 2 mặt tự căn theo nội dung dài nhất, không cần cuộn */}
      <div
        className="w-full [perspective:1200px] cursor-pointer select-none"
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleFlip();
          }
        }}
      >
        <div
          className="grid transition-transform duration-500 ease-out [transform-style:preserve-3d]"
          style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* Mặt trước */}
          <div
            className="col-start-1 row-start-1 [backface-visibility:hidden] min-h-[280px]
                       rounded-3xl border-2 border-gray-200 dark:border-gray-700
                       bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/60
                       shadow-lg flex flex-col items-center justify-center gap-4 px-8 py-10"
          >
            <p className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white text-center break-words">
              {word.word}
            </p>
            {word.pronunciation && (
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {word.pronunciation}
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 tracking-wide">
              Chạm để xem nghĩa
            </p>
          </div>

          {/* Mặt sau - đặt cùng ô grid với mặt trước, chiều cao tự bằng mặt cao hơn */}
          <div
            className="col-start-1 row-start-1 [backface-visibility:hidden] min-h-[280px]
                       rounded-3xl border-2 border-gray-200 dark:border-gray-700
                       bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/60
                       shadow-lg flex flex-col items-center justify-center gap-4 px-8 py-10 text-center"
            style={{ transform: "rotateY(180deg)" }}
          >
            {word.part_of_speech && (
              <p className="text-sm italic text-gray-400 dark:text-gray-500">
                {word.part_of_speech}
              </p>
            )}
            <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white leading-relaxed">
              {word.meaning_vi}
            </p>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleAnswer("LEARNING")}
            disabled={isSubmitting}
            className="flex-1 py-4 rounded-2xl font-bold text-base border-2 border-orange-300 text-orange-500
                       hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 transition-colors"
          >
            Cần ôn thêm
          </button>
          <button
            onClick={() => handleAnswer("MASTERED")}
            disabled={isSubmitting}
            className="flex-1 py-4 rounded-2xl font-bold text-base bg-[#58cc02] text-white
                       hover:bg-[#4cb001] disabled:opacity-50 transition-colors shadow-md shadow-[#58cc02]/30"
          >
            Đã thuộc
          </button>
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
