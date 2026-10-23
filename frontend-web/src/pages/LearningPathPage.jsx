import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import MainLayout from "../layouts/MainLayout";
import { withReturnTo } from "../utils/navigation";

const UNLOCK_THRESHOLD = 60; // phải khớp UNLOCK_THRESHOLD ở learning-path.service.js
const RING_R = 34;
const RING_C = 2 * Math.PI * RING_R;
const GOLD = "#ffc800";

const TIER_ORDER = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const TIER_META = {
  BEGINNER: { label: "Cơ bản", color: "#58cc02" },
  INTERMEDIATE: { label: "Trung cấp", color: "#1cb0f6" },
  ADVANCED: { label: "Nâng cao", color: "#ce82ff" },
};

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

// Độ lệch ngang (px) lặp theo chu kỳ -> tạo đường đi ngoằn ngoèo
const ZIGZAG = [0, 44, 72, 44, 0, -44, -72, -44];

function TopicNode({ topic, tierColor, isCurrent, isOpen, onClick }) {
  const locked = !topic.isUnlocked;
  const done = topic.masteryPercent >= 100;
  const accent = done ? GOLD : tierColor;
  const pct = Math.min(topic.masteryPercent, 100);
  const icon = TOPIC_ICONS[topic.title] || "★";

  return (
    <div
      className={`relative flex flex-col items-center ${isCurrent ? "pt-9" : ""}`}
    >
      {isCurrent && (
        <span
          className="absolute top-0 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider
                     bg-white dark:bg-gray-800 border-2 border-[#d5cdbd] dark:border-gray-700 shadow-md animate-bounce"
          style={{ color: tierColor }}
        >
          Học tiếp
        </span>
      )}

      <button
        type="button"
        onClick={onClick}
        aria-expanded={isOpen}
        aria-label={topic.title}
        className="relative w-[84px] h-[84px] rounded-full flex items-center justify-center
                   transition-transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 84 84">
          <circle
            cx="42"
            cy="42"
            r={RING_R}
            fill="none"
            strokeWidth="6"
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
          />
          {!locked && pct > 0 && (
            <circle
              cx="42"
              cy="42"
              r={RING_R}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              stroke={accent}
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - pct / 100)}
            />
          )}
        </svg>
        <span
          className={`relative w-[58px] h-[58px] rounded-full flex items-center justify-center
                      text-2xl font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.18)]
                      ${locked ? "bg-gray-200 dark:bg-gray-700 !text-gray-400" : ""}`}
          style={locked ? undefined : { backgroundColor: accent }}
        >
          {locked ? "🔒" : done ? "✓" : icon}
        </span>
      </button>

      <p className="mt-2 text-xs font-bold text-center max-w-[130px] leading-tight text-gray-800 dark:text-gray-100">
        {topic.title}
      </p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
        {locked ? "Đã khóa" : `${topic.masteryPercent}%`}
      </p>
    </div>
  );
}

function TopicCard({ topic, prevTopic, tierColor }) {
  const locked = !topic.isUnlocked;
  const icon = TOPIC_ICONS[topic.title] || "📚";

  if (locked) {
    return (
      <div className="mt-4 w-[340px] max-w-full rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 text-center shadow-md animate-fadeIn">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700/80 text-xl flex items-center justify-center mx-auto mb-2">
          🔒
        </div>
        <h4 className="font-extrabold text-base text-gray-900 dark:text-white mb-1">
          Chủ đề đang khóa
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Đạt ít nhất <strong className="text-[#58cc02] font-black">{UNLOCK_THRESHOLD}%</strong> ở chủ đề{" "}
          <span className="font-bold text-gray-800 dark:text-gray-200">{prevTopic?.title}</span> để mở khóa chủ đề này.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 w-[340px] max-w-full rounded-3xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6 shadow-xl text-left animate-fadeIn relative">
      {/* Top accent line matching tierColor */}
      <div
        className="absolute top-0 left-6 right-6 h-1 rounded-b-full"
        style={{ backgroundColor: tierColor }}
      />

      {/* Header with Icon and Mastery Badge */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700/80 text-xl flex items-center justify-center shrink-0">
            {icon}
          </div>
          <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white truncate">
            {topic.title}
          </h3>
        </div>
        <span
          className="text-xs font-black px-2.5 py-1 rounded-full shrink-0"
          style={{
            backgroundColor: `${tierColor}20`,
            color: tierColor,
          }}
        >
          {topic.masteryPercent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(topic.masteryPercent, 100)}%`,
            backgroundColor: tierColor,
          }}
        />
      </div>

      {/* Stats Box (Clean dark mode friendly box) */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700 mb-4 text-center">
        <div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">
            Từ vựng
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-gray-100 mt-0.5">
            {topic.masteredWords}/{topic.totalWords}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">
            Điểm bài thi
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-gray-100 mt-0.5">
            {topic.bestExamScore !== null ? `${topic.bestExamScore}/10` : "chưa thi"}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">
            Điểm bài học
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-gray-100 mt-0.5">
            {topic.bestLessonScore != null ? `${Math.round(topic.bestLessonScore)}%` : "chưa học"}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5">
        <Link
          to={`/learn/topics/${topic.id}`}
          className="w-full text-center py-3 rounded-2xl font-black text-sm uppercase text-white shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          style={{ backgroundColor: tierColor }}
        >
          <span>Bắt đầu bài học</span>
          <span>→</span>
        </Link>

        <div className="flex gap-2">
          <Link
            to={withReturnTo(`/review?topicId=${topic.id}&topicTitle=${encodeURIComponent(topic.title)}`, "/learn")}
            className="flex-1 text-center py-2.5 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 hover:border-[#58cc02] dark:hover:border-[#58cc02] text-gray-700 dark:text-gray-200 hover:text-[#58cc02] dark:hover:text-[#58cc02] text-xs font-extrabold uppercase transition-all shadow-2xs active:scale-[0.98]"
          >
            🎴 Ôn từ vựng
          </Link>
          <Link
            to={withReturnTo(`/exams/topics/${topic.id}`, "/learn")}
            className="flex-1 text-center py-2.5 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 hover:border-[#58cc02] dark:hover:border-[#58cc02] text-gray-700 dark:text-gray-200 hover:text-[#58cc02] dark:hover:text-[#58cc02] text-xs font-extrabold uppercase transition-all shadow-2xs active:scale-[0.98]"
          >
            📝 Làm bài thi
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LearningPathPage() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [showScrollUp, setShowScrollUp] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get("/learning-path", { signal: controller.signal })
      .then((res) => setData(res.data?.result))
      .catch((error) => {
        if (error.code === "ERR_CANCELED") return;
        setLoadError(
          error.response?.data?.message || "Không thể tải lộ trình học.",
        );
      });
    return () => controller.abort();
  }, []);

  // Lắng nghe sự kiện cuộn trên phần tử cha <main>
  useEffect(() => {
    if (!data) return;

    const scrollContainer = containerRef.current?.closest("main") || window;
    const handleScroll = () => {
      const scrollTop =
        scrollContainer === window
          ? window.scrollY
          : scrollContainer.scrollTop;
      setShowScrollUp(scrollTop > 380);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [data]);

  const currentId = data?.path?.find((t) => t.isCurrent)?.id;

  const scrollToCurrentTopic = useCallback(() => {
    if (currentId) {
      const targetEl = document.getElementById(`topic-node-${currentId}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        setOpenId(currentId);
        return;
      }
    }
    const scrollContainer = containerRef.current?.closest("main") || window;
    if (scrollContainer === window) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentId]);

  if (loadError && !data) {
    return (
      <MainLayout>
        <p className="text-sm text-red-500 dark:text-red-400 py-16 text-center">
          {loadError}
        </p>
      </MainLayout>
    );
  }
  if (!data) {
    return (
      <MainLayout>
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-[#58cc02] border-t-transparent rounded-full animate-spin mb-4 inline-block" />
          <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold">
            Đang tải lộ trình học...
          </p>
        </div>
      </MainLayout>
    );
  }

  const { tier, needsPlacement, path } = data;
  const completedCount = path.filter((t) => t.masteryPercent >= 100).length;

  return (
    <MainLayout>
      <div ref={containerRef} className="max-w-[560px] mx-auto pb-16 px-4 relative">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2">
            Lộ trình của bạn
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tier ? `Trình độ: ${TIER_META[tier].label} · ` : ""}
            <strong className="text-[#58cc02] font-black">{completedCount}</strong>/{path.length} chủ đề đã hoàn thành
          </p>
        </div>

        {/* PLACEMENT TEST NOTIFICATION */}
        {needsPlacement && (
          <div className="mb-8 p-4 sm:p-5 rounded-3xl border-2 border-[#ff9600]/40 bg-[#ff9600]/10 text-sm text-gray-700 dark:text-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">🎯</span>
              <span>
                Bạn chưa làm bài kiểm tra đầu vào nên hệ thống đang gợi ý từ các chủ đề cơ bản.
              </span>
            </div>
            <Link
              to="/placement-test"
              className="px-4 py-2 rounded-xl text-xs font-black bg-[#ff9600] text-white hover:bg-[#e68700] transition-all shadow-xs shrink-0 uppercase tracking-wider"
            >
              Làm ngay →
            </Link>
          </div>
        )}

        {/* LEARNING PATH NODES */}
        <div className="flex flex-col items-stretch gap-7">
          {path.map((topic, index) => {
            const meta = TIER_META[topic.difficulty];
            const showHeader =
              index === 0 || path[index - 1].difficulty !== topic.difficulty;
            const isOpen = openId === topic.id;

            return (
              <div key={topic.id}>
                {showHeader && (
                  <div
                    className="rounded-2xl px-5 py-3.5 mb-8 text-white flex items-center justify-between shadow-md"
                    style={{ backgroundColor: meta.color }}
                  >
                    <div>
                      <span className="font-black uppercase tracking-wider text-[11px] opacity-90 block">
                        Phần {TIER_ORDER.indexOf(topic.difficulty) + 1}
                      </span>
                      <span className="text-base font-extrabold">{meta.label}</span>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/20 backdrop-blur-xs">
                      {path.filter((t) => t.difficulty === topic.difficulty && t.masteryPercent >= 100).length}/
                      {path.filter((t) => t.difficulty === topic.difficulty).length} chủ đề
                    </span>
                  </div>
                )}

                <div id={`topic-node-${topic.id}`} className="flex flex-col items-center scroll-mt-28">
                  <div
                    style={{
                      transform: `translateX(${ZIGZAG[index % ZIGZAG.length]}px)`,
                    }}
                  >
                    <TopicNode
                      topic={topic}
                      tierColor={meta.color}
                      isCurrent={topic.id === currentId}
                      isOpen={isOpen}
                      onClick={() => setOpenId(isOpen ? null : topic.id)}
                    />
                  </div>
                  {isOpen && (
                    <TopicCard
                      topic={topic}
                      prevTopic={path[index - 1]}
                      tierColor={meta.color}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* NÚT CUỘN NHANH VỀ BÀI ĐANG HỌC */}
        {showScrollUp && (
          <div className="sticky bottom-6 z-30 flex justify-end pointer-events-none mt-6">
            <button
              type="button"
              onClick={scrollToCurrentTopic}
              className="pointer-events-auto inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-800 border-2 border-[#d5cdbd] dark:border-gray-700 shadow-xl text-xs sm:text-sm font-black text-gray-800 dark:text-gray-100 hover:border-[#58cc02] hover:text-[#58cc02] dark:hover:text-[#58cc02] transition-all cursor-pointer group active:scale-95 animate-fadeIn"
              title={currentId ? "Cuộn về chủ đề đang học" : "Cuộn lên đầu trang"}
            >
              <span className="w-6 h-6 rounded-lg bg-[#58cc02]/15 text-[#58cc02] flex items-center justify-center font-black text-sm group-hover:-translate-y-0.5 transition-transform">
                ↑
              </span>
              <span>{currentId ? "Về bài đang học" : "Lên đầu trang"}</span>
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
