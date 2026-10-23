import { useState, useEffect, useMemo } from "react";
import api from "../api/api";

const TOPIC_ICONS = {
  "Food & Drink": "🍔",
  "Travel & Transport": "✈️",
  "Family & Relationships": "👨‍👩‍👧",
  "Sports & Entertainment": "⚽",
  "Actions & States": "⚡",
  "Shopping & Fashion": "🛍️",
  "Home & Daily Life": "🏡",
  "Time & Seasons": "⏳",
  "Numbers & Measurement": "🔢",
  "Colors & Shapes": "🎨",
  "Feelings & Senses": "❤️",
  "Weather & Atmosphere": "⛅",
  "Business & Finance": "💼",
  "Health & Medicine": "🩺",
  "Education & Science": "🔬",
  "Nature & Environment": "🌿",
  "Emotions & Personality": "😊",
  "Communication & Media": "📱",
  "Arts & Literature": "🎭",
  "History & Culture": "🏛️",
  "Geography & Places": "🗺️",
  "Work & Professions": "👷",
  "Materials & Substances": "🧪",
  "Buildings & Infrastructure": "🏗️",
  "Technology & IT": "💻",
  "Law & Society": "⚖️",
  "Philosophy & Thinking": "🧠",
  "Abstract Concepts": "🌌",
  "Politics & Government": "🏛️",
  "Military & Warfare": "⚔️",
  "Agriculture & Farming": "🌾",
  "Industry & Manufacturing": "🏭",
  "Energy & Resources": "⚡",
  "Religion & Spirituality": "🕊️",
  "Crime & Justice": "🛡️",
  "Disasters & Emergencies": "🚨",
};

export default function TopicSelector({ onSelectTopic, onSelectRandom }) {
  const [topics, setTopics] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredTopics = useMemo(() => {
    if (!topics) return [];
    if (!searchTerm.trim()) return topics;
    return topics.filter((t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [topics, searchTerm]);

  if (topics === null) {
    return (
      <div className="text-center py-20 text-gray-400 dark:text-gray-500 text-sm">
        <div className="inline-block w-9 h-9 border-3 border-[#58cc02] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-medium">Đang tải danh sách chủ đề...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[900px] mx-auto text-left">
      {/* FEATURED: RANDOM DAILY SET */}
      <button
        onClick={onSelectRandom}
        className="w-full mb-8 p-5 sm:p-6 rounded-3xl border-2 border-[#58cc02] bg-[#58cc02]/5 dark:bg-[#58cc02]/10 hover:bg-[#58cc02]/15 hover:border-[#4cb001] shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#58cc02] text-white flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-sm shadow-[#58cc02]/30 group-hover:rotate-12 transition-transform">
            🎲
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#58cc02] text-white">
                Đề xuất hôm nay
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">• 10 từ</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white group-hover:text-[#58cc02] dark:group-hover:text-[#58cc02] transition-colors">
              Luyện 10 từ vựng ngẫu nhiên
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Hệ thống tự động chọn lọc 10 từ phù hợp theo độ ưu tiên ôn tập của bạn.
            </p>
          </div>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 border border-[#58cc02]/30 text-[#58cc02] flex items-center justify-center text-lg font-bold shrink-0 group-hover:translate-x-1 group-hover:bg-[#58cc02] group-hover:text-white transition-all shadow-2xs">
          →
        </div>
      </button>

      {/* SEARCH INPUT & SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
            Chọn chủ đề theo sở thích
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {filteredTopics.length} chủ đề có sẵn
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm chủ đề..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#58cc02] transition-all"
          />
        </div>
      </div>

      {/* TOPICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {filteredTopics.map((topic) => {
          const icon = TOPIC_ICONS[topic.title] || "📚";

          return (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic)}
              className="p-4 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#58cc02] dark:hover:border-[#58cc02] shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between gap-3 group text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#efebe2] dark:bg-gray-700/80 group-hover:bg-[#58cc02]/15 text-gray-900 dark:text-gray-200 group-hover:text-[#1c7400] dark:group-hover:text-[#58cc02] flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                  {icon}
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-sm text-gray-950 dark:text-white group-hover:text-[#1c7400] dark:group-hover:text-[#58cc02] transition-colors truncate">
                    {topic.title}
                  </h4>
                  <span className="text-[11px] text-gray-600 dark:text-gray-400 font-bold flex items-center gap-1">
                    <span>10 từ mỗi lượt</span>
                  </span>
                </div>
              </div>

              <span className="text-gray-400 dark:text-gray-600 group-hover:text-[#1c7400] dark:group-hover:text-[#58cc02] group-hover:translate-x-1 transition-all text-sm font-bold">
                →
              </span>
            </button>
          );
        })}
      </div>

      {loadError && (
        <p className="text-sm text-red-500 dark:text-red-400 text-center mt-6">{loadError}</p>
      )}

      {filteredTopics.length === 0 && !loadError && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p className="text-sm">Không tìm thấy chủ đề nào khớp với từ khóa "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}