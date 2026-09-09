import { useSelector } from "react-redux";
import MainLayout from "../components/MainLayout";
import QuickWordSearch from "../components/QuickWordSearch";

export default function MainPage() {
  const { user } = useSelector((state) => state.auth);

  return (
    <MainLayout>
      <QuickWordSearch />
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Chào, {user?.username}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Tra từ nhanh hoặc tiếp tục luyện tập hôm nay.
        </p>
      </div>
    </MainLayout>
  );
}