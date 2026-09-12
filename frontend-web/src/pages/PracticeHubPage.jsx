import MainLayout from "../layouts/MainLayout";
import DailyFlashcardReview from "../components/DailyFlashcardReview";
import TopicSelector from "../components/TopicSelector";
import { useState } from "react";

export default function PracticeHubPage() {
  const [selection, setSelection] = useState(null);

  const endpoint =
    selection === "random"
      ? "/flashcards/daily"
      : selection
        ? `/flashcards/practice/${selection.id}`
        : null;

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
            onBack={() => setSelection(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}
