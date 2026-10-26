import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import MainLayout from "../layouts/MainLayout";
import { TopicIcon } from "../utils/topicIcons";

const DIFFICULTY_CONFIG = {
  BEGINNER: {
    label: "Cơ bản",
    sublabel: "Beginner",
    badgeBg: "bg-[#58cc02]/10 text-[#58cc02] border-[#58cc02]/30",
  },
  INTERMEDIATE: {
    label: "Trung cấp",
    sublabel: "Intermediate",
    badgeBg: "bg-[#1cb0f6]/10 text-[#1cb0f6] border-[#1cb0f6]/30",
  },
  ADVANCED: {
    label: "Nâng cao",
    sublabel: "Advanced",
    badgeBg: "bg-[#ce82ff]/10 text-[#ce82ff] border-[#ce82ff]/30",
  },
};

export default function ExamTopicsPage() {
  const [topics, setTopics] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
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

  const filteredTopics = useMemo(() => {
    if (!topics) return [];
    return topics.filter((topic) => {
      const matchSearch =
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (topic.description && topic.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDifficulty =
        selectedDifficulty === "ALL" || topic.difficulty === selectedDifficulty;

      return matchSearch && matchDifficulty;
    });
  }, [topics, searchQuery, selectedDifficulty]);

  const counts = useMemo(() => {
    if (!topics) return { ALL: 0, BEGINNER: 0, INTERMEDIATE: 0, ADVANCED: 0 };
    return {
      ALL: topics.length,
      BEGINNER: topics.filter((t) => t.difficulty === "BEGINNER").length,
      INTERMEDIATE: topics.filter((t) => t.difficulty === "INTERMEDIATE").length,
      ADVANCED: topics.filter((t) => t.difficulty === "ADVANCED").length,
    };
  }, [topics]);

  if (topics === null) {
    return (
      <MainLayout>
        <div className="py-24 text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#58cc02] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">
            Đang tải kho chủ đề luyện thi...
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-6 sm:py-8 max-w-[1300px] mx-auto text-left">
        {/* CLEAN HEADER MATCHING REVIEW THEME */}
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Luyện thi trắc nghiệm theo chủ đề
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
            Hệ thống 36 chủ đề được phân cấp từ Cơ bản đến Nâng cao. Mỗi đề thi gồm 10 câu trắc nghiệm
            chuẩn ngữ pháp và từ vựng, có tính giờ và chấm điểm tự động.
          </p>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-8">
          {/* Difficulty Filter Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 shadow-2xs">
            <button
              onClick={() => setSelectedDifficulty("ALL")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedDifficulty === "ALL"
                  ? "bg-[#58cc02] text-white shadow-xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Tất cả ({counts.ALL})
            </button>
            <button
              onClick={() => setSelectedDifficulty("BEGINNER")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedDifficulty === "BEGINNER"
                  ? "bg-[#58cc02] text-white shadow-xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-[#58cc02] dark:hover:text-[#58cc02]"
              }`}
            >
              Cơ bản ({counts.BEGINNER})
            </button>
            <button
              onClick={() => setSelectedDifficulty("INTERMEDIATE")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedDifficulty === "INTERMEDIATE"
                  ? "bg-[#1cb0f6] text-white shadow-xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-[#1cb0f6] dark:hover:text-[#1cb0f6]"
              }`}
            >
              Trung cấp ({counts.INTERMEDIATE})
            </button>
            <button
              onClick={() => setSelectedDifficulty("ADVANCED")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedDifficulty === "ADVANCED"
                  ? "bg-[#ce82ff] text-white shadow-xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-[#ce82ff] dark:hover:text-[#ce82ff]"
              }`}
            >
              Nâng cao ({counts.ADVANCED})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] sm:min-w-[320px]">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">
              🔍
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm chủ đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#58cc02] focus:border-[#58cc02] transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {loadError && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm mb-6">
            ⚠️ {loadError}
          </div>
        )}

        {/* TOPICS GRID */}
        {filteredTopics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTopics.map((topic) => {
              const diffConfig = DIFFICULTY_CONFIG[topic.difficulty] || DIFFICULTY_CONFIG.BEGINNER;

              return (
                <div
                  key={topic.id}
                  onClick={() => navigate(`/exams/topics/${topic.id}`)}
                  className="group relative bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-3xl p-6 flex flex-col justify-between hover:border-[#58cc02] dark:hover:border-[#58cc02] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  <div>
                    {/* Header: Icon + Difficulty Badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-13 h-13 rounded-2xl bg-gray-100 dark:bg-gray-700/80 group-hover:bg-[#58cc02]/10 flex items-center justify-center p-2.5 shadow-2xs group-hover:scale-110 transition-transform">
                        <TopicIcon topicName={topic.title} className="w-8 h-8 object-contain" />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border ${diffConfig.badgeBg}`}
                      >
                        {diffConfig.label}
                      </span>
                    </div>

                    {/* Topic Title */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#58cc02] dark:group-hover:text-[#58cc02] transition-colors line-clamp-1">
                      {topic.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm line-clamp-2 mb-4 leading-relaxed">
                      {topic.description || "Luyện tập các câu hỏi kiểm tra từ vựng và ngữ cảnh thuộc chủ đề này."}
                    </p>
                  </div>

                  {/* Footer metadata & CTA */}
                  <div>
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <span>📝</span> 10 câu hỏi
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <span>⏱</span> 15 phút
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <span>🎯</span> 4 đáp án
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/exams/topics/${topic.id}`);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gray-100 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 group-hover:bg-[#58cc02] group-hover:text-white group-hover:border-[#58cc02] transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <span>Vào luyện đề ngay</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl bg-gray-50/50 dark:bg-gray-800/20">
            <span className="text-4xl mb-3 block">🔍</span>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">
              Không tìm thấy chủ đề phù hợp
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              Thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục độ khó khác.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedDifficulty("ALL");
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#58cc02] text-white hover:bg-[#4cb001] transition-colors shadow-sm"
            >
              Xem tất cả chủ đề
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}