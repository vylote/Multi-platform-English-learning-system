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
      <div className="w-full flex flex-col items-center py-2 sm:py-4">
        {!selection && (
          <div className="w-full mx-auto text-center">
            {/* CLEAN HEADER FOR TOPIC SELECTION */}
            <div className="mb-6 sm:mb-8 text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Luyện từ vựng qua Flashcards
              </h1>
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