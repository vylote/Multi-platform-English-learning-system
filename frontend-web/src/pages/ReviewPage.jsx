import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DailyFlashcardReview from "../components/DailyFlashcardReview";
import TopicSelector from "../components/TopicSelector";
import { getReturnTo } from "../utils/navigation";

export default function ReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = getReturnTo(searchParams);

  const [selection, setSelection] = useState(() => {
    const raw = searchParams.get("topicId");
    return /^\d+$/.test(raw ?? "") ? { id: raw } : null;
  });

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

  return (
    <MainLayout>
      <div className="w-full flex flex-col items-center py-10 px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Chọn chủ đề ôn tập
        </h1>
        {!selection && (
          <TopicSelector
            onSelectTopic={(topic) => setSelection(topic)}
            onSelectRandom={() => setSelection("random")}
          />
        )}

        {selection && (
          <DailyFlashcardReview
            key={endpoint} // đổi chủ đề -> remount hoàn toàn, tránh lẫn state (cards/currentIndex) của chủ đề cũ
            endpoint={endpoint}
            onBack={handleBack}
            onComplete={handleBack}
          />
        )}
      </div>
    </MainLayout>
  );
}