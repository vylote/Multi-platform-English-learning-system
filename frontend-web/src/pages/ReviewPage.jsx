import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DailyFlashcardReview from "../components/DailyFlashcardReview";
import TopicSelector from "../components/TopicSelector";
import { getReturnTo } from "../utils/navigation";
import api from "../api/api";

export default function ReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = getReturnTo(searchParams);

  const [selection, setSelection] = useState(() => {
    const raw = searchParams.get("topicId");
    const rawTitle = searchParams.get("topicTitle");
    return /^\d+$/.test(raw ?? "") ? { id: raw, title: rawTitle || "" } : null;
  });

  useEffect(() => {
    if (selection?.id && !selection?.title) {
      api
        .get("/topics")
        .then((res) => {
          const list = res.data?.result || [];
          const found = list.find((t) => String(t.id) === String(selection.id));
          if (found?.title) {
            setSelection((prev) => (prev ? { ...prev, title: found.title } : null));
          }
        })
        .catch(() => {});
    }
  }, [selection?.id, selection?.title]);

  const endpoint =
    selection === "random"
      ? "/flashcards/daily"
      : selection
        ? `/flashcards/practice/${selection.id}`
        : null;

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo);
      return;
    }
    setSelection(null);
    setSearchParams({});
  };

  const topicName =
    selection === "random"
      ? "Ngẫu nhiên 10 từ"
      : selection?.title || "Bộ thẻ ôn tập";

  return (
    <MainLayout>
      <div className="w-full flex flex-col items-center py-6 px-4">
        {!selection && (
          <div className="w-full max-w-[900px] mx-auto py-6 sm:py-8 px-4 text-center">
            {/* CLEAN HEADER FOR TOPIC SELECTION */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#58cc02]/10 border border-[#58cc02]/30 text-[#58cc02] text-xs font-extrabold uppercase tracking-wider mb-3">
                <span>🎴</span> Ôn tập thông minh
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                Luyện từ vựng qua Flashcards
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                Ghi nhớ từ vựng hiệu quả bằng phương pháp Lặp lại ngắt quãng (Spaced Repetition). Chọn một chủ đề để bắt đầu 10 từ hôm nay!
              </p>
            </div>

            <TopicSelector
              onSelectTopic={(topic) => setSelection(topic)}
              onSelectRandom={() => setSelection("random")}
            />
          </div>
        )}

        {selection && (
          <DailyFlashcardReview
            key={endpoint}
            endpoint={endpoint}
            topicName={topicName}
            returnTo={returnTo}
            onBack={handleBack}
            onComplete={handleBack}
          />
        )}
      </div>
    </MainLayout>
  );
}