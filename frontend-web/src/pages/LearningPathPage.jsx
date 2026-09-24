import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import MainLayout from "../layouts/MainLayout";

const TILE_COLORS = ["#58cc02", "#1cb0f6", "#ff9600", "#ce82ff", "#ff4b4b", "#2b70c9"];

export default function LearningPathPage() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    api
      .get("/learning-path", { signal: controller.signal })
      .then((res) => setData(res.data?.result))
      .catch((error) => {
        if (error.code === "ERR_CANCELED") return;
        setLoadError(error.response?.data?.message || "Không thể tải lộ trình học.");
      });
    return () => controller.abort();
  }, []);

  if (loadError) {
    return (
      <MainLayout>
        <p className="text-sm text-red-500 dark:text-red-400 py-10 text-center">{loadError}</p>
      </MainLayout>
    );
  }
  if (!data) {
    return (
      <MainLayout>
        <p className="text-sm text-gray-400 dark:text-gray-500 py-10 text-center">Đang tải lộ trình...</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[560px] mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Lộ trình học</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
          Trình độ hiện tại: <span className="font-semibold">{data.tier || "Chưa xác định"}</span>
        </p>

        {data.needsPlacement && (
          <button
            onClick={() => navigate("/placement-test")}
            className="w-full mb-8 py-3.5 rounded-xl font-bold text-white bg-[#58cc02] hover:bg-[#4cb001] transition-colors"
          >
            Làm bài kiểm tra đầu vào
          </button>
        )}

        <div className="space-y-4">
          {data.path.map((topic, index) => (
            <button
              key={topic.id}
              disabled={!topic.isUnlocked}
              onClick={() => navigate(`/practice-hub/topics/${topic.id}`)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                topic.isUnlocked
                  ? "border-transparent hover:scale-[1.02] cursor-pointer"
                  : "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
              }`}
              style={topic.isUnlocked ? { backgroundColor: TILE_COLORS[index % TILE_COLORS.length] } : {}}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  topic.isUnlocked ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                }`}
              >
                {topic.isUnlocked ? (topic.masteryPercent >= 100 ? "✓" : index + 1) : "🔒"}
              </div>
              <div className="flex-1">
                <p className={`font-bold ${topic.isUnlocked ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
                  {topic.title}
                </p>
                <p className={`text-xs ${topic.isUnlocked ? "text-white/80" : "text-gray-400"}`}>
                  {topic.masteryPercent}% hoàn thành
                </p>
              </div>
            </button>
          ))}
        </div>

        {data.path.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
            Chưa có chủ đề nào phù hợp trình độ hiện tại.
          </p>
        )}
      </div>
    </MainLayout>
  );
}