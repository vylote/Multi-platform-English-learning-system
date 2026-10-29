import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import api from "../api/api";
import MainLayout from "../layouts/MainLayout";
import { TopicIcon } from "../utils/topicIcons";

const DIFFICULTY_CONFIG = {
  BEGINNER: {
    label: "Cơ bản",
    sublabel: "Beginner",
    badgeBg: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-emerald-500/30",
    btnBg: "bg-[#58cc02] hover:bg-[#4cb001] border-[#3b8702]",
  },
  INTERMEDIATE: {
    label: "Trung cấp",
    sublabel: "Intermediate",
    badgeBg: "bg-sky-500/15 text-sky-800 dark:text-sky-400 border-sky-500/30",
    btnBg: "bg-[#1cb0f6] hover:bg-[#1899d6] border-[#1899d6]",
  },
  ADVANCED: {
    label: "Nâng cao",
    sublabel: "Advanced",
    badgeBg: "bg-purple-500/15 text-purple-800 dark:text-purple-400 border-purple-500/30",
    btnBg: "bg-[#a855f7] hover:bg-[#9333ea] border-[#7e22ce]",
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
        {/* CLEAN HEADER MATCHING REVIEW & DICTIONARY THEME */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Luyện thi theo chủ đề
          </h1>
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
                  className="group relative bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 border-b-4 hover:border-b-4 hover:border-[#58cc02] dark:hover:border-[#58cc02] rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden text-left"
                >
                  <div>
                    {/* Header: Icon + Difficulty Badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#faf7f0] dark:bg-gray-800 border-2 border-[#e4ded0] dark:border-gray-700 group-hover:border-[#58cc02]/50 flex items-center justify-center p-2.5 shadow-2xs group-hover:scale-105 transition-all shrink-0">
                        <TopicIcon topicName={topic.title} className="w-9 h-9 object-contain" />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border-2 ${diffConfig.badgeBg}`}
                      >
                        {diffConfig.label}
                      </span>
                    </div>

                    {/* Topic Title */}
                    <h3 className="text-lg sm:text-xl font-black text-gray-950 dark:text-white mb-1.5 group-hover:text-[#58cc02] dark:group-hover:text-[#58cc02] transition-colors line-clamp-1 tracking-tight">
                      {topic.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium line-clamp-2 mb-4 leading-relaxed min-h-[38px]">
                      {topic.description || "Luyện tập các câu hỏi kiểm tra từ vựng và ngữ cảnh thuộc chủ đề này."}
                    </p>
                  </div>

                  {/* Footer metadata & CTA */}
                  <div>
                    {/* Compact 3-box stats row - no awkward wrapping */}
                    <div className="grid grid-cols-3 gap-1 py-2 px-2.5 rounded-2xl bg-[#faf7f0] dark:bg-gray-800/80 border border-[#e4ded0] dark:border-gray-700/70 mb-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 py-0.5">
                        <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="text-xs font-black text-gray-800 dark:text-gray-200 whitespace-nowrap">
                          10 câu
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1.5 py-0.5 border-x border-[#e4ded0] dark:border-gray-700/60">
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="text-xs font-black text-gray-800 dark:text-gray-200 whitespace-nowrap">
                          15 phút
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1.5 py-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-xs font-black text-gray-800 dark:text-gray-200 whitespace-nowrap">
                          4 đáp án
                        </span>
                      </div>
                    </div>

                    {/* 3D Duolingo Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/exams/topics/${topic.id}`);
                      }}
                      className={`w-full py-2.5 sm:py-3 px-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider text-white border-b-4 active:translate-y-0.5 active:border-b-2 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer group/btn ${diffConfig.btnBg}`}
                    >
                      <span>Vào luyện đề ngay</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
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