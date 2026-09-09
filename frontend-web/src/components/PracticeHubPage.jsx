import MainLayout from "../components/MainLayout";
import DailyFlashcardReview from "../components/DailyFlashcardReview";

export default function PracticeHubPage() {
  return (
    <MainLayout>
      <div className="w-full flex flex-col items-center py-10 px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Luyện tập
        </h1>
        <DailyFlashcardReview />
      </div>
    </MainLayout>
  );
}