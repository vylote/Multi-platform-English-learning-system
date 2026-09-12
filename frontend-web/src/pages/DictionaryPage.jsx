import MainLayout from "../layouts/MainLayout";
import QuickWordSearch from "../components/QuickWordSearch";

export default function DictionaryPage() {
  return (
    <MainLayout>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Tra cứu từ điển</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Tra nhanh nghĩa, phiên âm, loại từ.
        </p>
        <QuickWordSearch />
      </div>
    </MainLayout>
  );
}