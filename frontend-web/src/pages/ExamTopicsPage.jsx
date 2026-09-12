import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import MainLayout from "../layouts/MainLayout";

const TILE_COLORS = ["#58cc02", "#1cb0f6", "#ff9600", "#ce82ff", "#ff4b4b", "#2b70c9", "#fbbf24", "#14b8a6"];

export default function ExamTopicsPage() {
  const [topics, setTopics] = useState(null);
  const [loadError, setLoadError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    api
      .get("/topics", { signal: controller.signal })
      .then((res) => setTopics(res.data?.result || []))
      .catch((error) => {
        if (error.code === "ERR_CANCELED") return;
        setLoadError(error.response?.data?.message || "Không thể tải danh sách chủ đề.");
        setTopics([]);
      });
    return () => controller.abort();
  }, []);

  if (topics === null) {
    return (
      <MainLayout>
        <p className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">Đang tải danh sách chủ đề...</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Luyện đề</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Chọn chủ đề để xem các đề thi.</p>

        {loadError && <p className="text-sm text-red-500 dark:text-red-400 mb-4">{loadError}</p>}

        <div className="flex flex-wrap gap-3">
          {topics.map((topic, index) => (
            <button
              key={topic.id}
              onClick={() => navigate(`/learn/topics/${topic.id}`)}
              style={{ backgroundColor: TILE_COLORS[index % TILE_COLORS.length] }}
              className="inline-flex items-center justify-center whitespace-nowrap px-7 py-6 rounded-3xl
                         text-white font-extrabold text-lg shadow-md hover:scale-[1.03] hover:shadow-xl
                         transition-all duration-150 max-w-[320px]"
            >
              <span className="truncate">{topic.title}</span>
            </button>
          ))}
        </div>

        {topics.length === 0 && !loadError && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-6">Chưa có chủ đề nào.</p>
        )}
      </div>
    </MainLayout>
  );
}