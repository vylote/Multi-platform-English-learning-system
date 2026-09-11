import { useState, useEffect } from "react";
import api from "../api/api";

const TILE_COLORS = [
  "#58cc02", // xanh lá
  "#1cb0f6", // xanh dương
  "#ff9600", // cam
  "#ce82ff", // tím
  "#ff4b4b", // đỏ
  "#2b70c9", // xanh đậm
  "#fbbf24", // vàng
  "#14b8a6", // ngọc
];

export default function TopicSelector({ onSelectTopic, onSelectRandom }) {
  const [topics, setTopics] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    api
      .get("/topics", { signal: controller.signal })
      .then((response) => setTopics(response.data?.result || []))
      .catch((error) => {
        if (error.code === "ERR_CANCELED") return;
        setLoadError(error.response?.data?.message || "Không thể tải danh sách chủ đề.");
        setTopics([]);
      });

    return () => controller.abort();
  }, []);

  if (topics === null) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
        Đang tải danh sách chủ đề...
      </div>
    );
  }

  return (
    <div className="w-full max-w-[820px] mx-auto">
      <div className="flex flex-wrap gap-3 justify-center">
        {/* Khối "Ngẫu nhiên" - cùng hệ khối với topic, viền nét đứt để phân biệt vai trò đặc biệt */}
        <button
          onClick={onSelectRandom}
          className="inline-flex items-center justify-center whitespace-nowrap
                     px-7 py-6 rounded-3xl border-2 border-dashed border-[#58cc02]
                     text-[#58cc02] font-extrabold text-lg
                     hover:scale-[1.03] hover:shadow-lg transition-all duration-150"
        >
          🎲 Ngẫu nhiên
        </button>

        {topics.map((topic, index) => (
          <button
            key={topic.id}
            onClick={() => onSelectTopic(topic)}
            style={{ backgroundColor: TILE_COLORS[index % TILE_COLORS.length] }}
            className="inline-flex items-center justify-center whitespace-nowrap
                       px-7 py-6 rounded-3xl text-white font-extrabold text-lg
                       shadow-md hover:scale-[1.03] hover:shadow-xl
                       transition-all duration-150 max-w-[320px]"
          >
            <span className="truncate">{topic.title}</span>
          </button>
        ))}
      </div>

      {loadError && (
        <p className="text-sm text-red-500 dark:text-red-400 text-center mt-6">{loadError}</p>
      )}

      {topics.length === 0 && !loadError && (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-6">
          Chưa có chủ đề nào được thiết lập.
        </p>
      )}
    </div>
  );
}