import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import MainLayout from "../layouts/MainLayout";
import { withReturnTo } from "../utils/navigation";
import { TopicIcon } from "../utils/topicIcons";

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

function TopicNode({ topic, tierColor, isCurrent, isSelected, onClick }) {
  const locked = !topic.isUnlocked;
  const done = topic.masteryPercent >= 100;
  const accent = done ? GOLD : tierColor;
  const pct = Math.min(topic.masteryPercent, 100);

  return (
    <div className={`relative flex flex-col items-center ${isCurrent ? "pt-7 sm:pt-8" : ""}`}>
      {isCurrent && (
        <span
          className="absolute top-0 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider
                     bg-white dark:bg-gray-800 border-2 border-[#d5cdbd] dark:border-gray-700 shadow-md animate-bounce z-10 whitespace-nowrap"
          style={{ color: tierColor }}
        >
          Học tiếp
        </span>
      )}

      <button
        type="button"
        onClick={onClick}
        aria-label={topic.title}
        className={`relative w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] rounded-full flex items-center justify-center
                   transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
                     isSelected ? "ring-4 ring-offset-2 ring-[#58cc02]" : ""
                   }`}
      >
        <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 84 84">
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
          className={`relative w-[48px] h-[48px] sm:w-[58px] sm:h-[58px] rounded-full flex items-center justify-center
                      font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.18)]
                      ${locked ? "bg-gray-200 dark:bg-gray-700 !text-gray-400" : ""}`}
          style={locked ? undefined : { backgroundColor: accent }}
        >
          {locked ? (
            <img src="/assets/icons/lock.svg" alt="Locked" className="w-5 h-5 sm:w-6 sm:h-6 object-contain opacity-75" />
          ) : done ? (
            <img src="/assets/icons/check.svg" alt="Completed" className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-sm" />
          ) : (
            <TopicIcon topicName={topic.title} className="w-6 h-6 sm:w-7 sm:h-7 object-contain drop-shadow-sm" />
          )}
        </span>
      </button>

      <p className="mt-2 text-[11px] sm:text-xs font-bold text-center max-w-[95px] sm:max-w-[130px] leading-tight text-gray-800 dark:text-gray-100 line-clamp-2">
        {topic.title}
      </p>
      <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
        {locked ? "Đã khóa" : `${topic.masteryPercent}%`}
      </p>
    </div>
  );
}

function TopicModal({ topic, prevTopic, tierColor, onClose }) {
  const locked = !topic.isUnlocked;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn md:pl-[76px] lg:pl-[240px] xl:pl-0"
      onClick={onClose}
    >
      <div
        className="relative max-w-[390px] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {locked ? (
          <div className="relative w-full rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center shadow-2xl animate-fadeIn">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 font-black text-sm cursor-pointer transition-colors"
              aria-label="Đóng"
            >
              ✕
            </button>
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center mx-auto mb-3">
              <img src="/assets/icons/lock.svg" alt="Locked" className="w-8 h-8 object-contain" />
            </div>
            <h4 className="font-extrabold text-lg text-gray-900 dark:text-white mb-2">
              Chủ đề đang khóa
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
              Đạt ít nhất <strong className="text-[#58cc02] font-black">{UNLOCK_THRESHOLD}%</strong> ở chủ đề{" "}
              <span className="font-bold text-gray-800 dark:text-gray-200">{prevTopic?.title}</span> để mở khóa chủ đề này.
            </p>
          </div>
        ) : (
          <div className="relative w-full rounded-3xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-2xl text-left animate-fadeIn">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 font-black text-sm cursor-pointer transition-colors z-10"
              aria-label="Đóng"
            >
              ✕
            </button>

            {/* Header with Icon and Mastery Badge */}
            <div className="flex items-center justify-between gap-3 mb-3 pr-8">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-700/80 flex items-center justify-center shrink-0 p-2">
                  <TopicIcon topicName={topic.title} className="w-7 h-7 object-contain" />
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

            {/* Stats Box */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700 mb-5 text-center">
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
        )}
      </div>
    </div>
  );
}

// Chia topics thành các hàng 3 ô uốn lượn zigzag (Snake Pattern)
function buildSnakeRows(topics) {
  const rows = [];
  for (let i = 0; i < topics.length; i += 3) {
    const chunk = topics.slice(i, i + 3);
    const rowIdx = Math.floor(i / 3);
    const isLTR = rowIdx % 2 === 0;

    // Grid luôn có 3 cột: col 0, col 1, col 2
    // Nếu isLTR: topic thứ 0 -> col 0, topic 1 -> col 1, topic 2 -> col 2
    // Nếu isRTL: topic thứ 0 -> col 2, topic 1 -> col 1, topic 2 -> col 0
    const cells = [null, null, null];
    chunk.forEach((topic, idx) => {
      const col = isLTR ? idx : 2 - idx;
      cells[col] = topic;
    });

    rows.push({
      rowIdx,
      isLTR,
      chunk,
      cells,
    });
  }
  return rows;
}

export default function LearningPathPage() {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);
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

  // Lắng nghe sự kiện ESC để đóng popup
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedTopic(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
        const curr = data?.path?.find((t) => t.id === currentId);
        if (curr) setSelectedTopic(curr);
        return;
      }
    }
    const scrollContainer = containerRef.current?.closest("main") || window;
    if (scrollContainer === window) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentId, data]);

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

  // Gom các topics theo từng Tier (Cơ bản, Trung cấp, Nâng cao)
  const tierSections = TIER_ORDER.map((tierKey) => {
    const tierTopics = path.filter((t) => t.difficulty === tierKey);
    return {
      tierKey,
      meta: TIER_META[tierKey],
      topics: tierTopics,
      rows: buildSnakeRows(tierTopics),
    };
  }).filter((section) => section.topics.length > 0);

  const getPrevTopic = (topicId) => {
    const idx = path.findIndex((t) => t.id === topicId);
    return idx > 0 ? path[idx - 1] : null;
  };

  return (
    <MainLayout>
      <div ref={containerRef} className="max-w-[760px] mx-auto pb-20 px-3 sm:px-6 relative text-left">
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

        {/* TIER SECTIONS */}
        <div className="flex flex-col gap-12">
          {tierSections.map((section, sIndex) => {
            const completedInTier = section.topics.filter((t) => t.masteryPercent >= 100).length;

            return (
              <div key={section.tierKey} className="relative">
                {/* TIER BANNER */}
                <div
                  className="rounded-2xl px-5 py-3.5 mb-10 text-white flex items-center justify-between shadow-md"
                  style={{ backgroundColor: section.meta.color }}
                >
                  <div>
                    <span className="font-black uppercase tracking-wider text-[11px] opacity-90 block">
                      Phần {sIndex + 1}
                    </span>
                    <span className="text-base font-extrabold">{section.meta.label}</span>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/20 backdrop-blur-xs">
                    {completedInTier}/{section.topics.length} chủ đề
                  </span>
                </div>

                {/* SNAKE ROWS CONTAINER */}
                <div className="flex flex-col gap-12 sm:gap-14">
                  {section.rows.map((row, rIdx) => {
                    const isLastRow = rIdx === section.rows.length - 1;

                    return (
                      <div key={rIdx} className="relative grid grid-cols-3 gap-2 sm:gap-4 items-start">
                        {/* CONNECTOR NGANG: Giữa Cột 0 và Cột 1 */}
                        <div className="absolute top-[34px] sm:top-[42px] -translate-y-1/2 left-[21%] sm:left-[23%] w-[24%] sm:w-[20%] flex items-center justify-center pointer-events-none z-0">
                          <svg viewBox="0 0 80 16" className="w-full h-4 text-[#d5cdbd] dark:text-gray-700" fill="none">
                            {row.isLTR ? (
                              <>
                                <line x1="8" y1="8" x2="68" y2="8" stroke="currentColor" strokeWidth="3" strokeDasharray="5 4" strokeLinecap="round" />
                                <polygon points="72,8 64,4 64,12" fill="currentColor" />
                              </>
                            ) : (
                              <>
                                <line x1="72" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="3" strokeDasharray="5 4" strokeLinecap="round" />
                                <polygon points="8,8 16,4 16,12" fill="currentColor" />
                              </>
                            )}
                          </svg>
                        </div>

                        {/* CONNECTOR NGANG: Giữa Cột 1 và Cột 2 */}
                        <div className="absolute top-[34px] sm:top-[42px] -translate-y-1/2 left-[55%] sm:left-[57%] w-[24%] sm:w-[20%] flex items-center justify-center pointer-events-none z-0">
                          <svg viewBox="0 0 80 16" className="w-full h-4 text-[#d5cdbd] dark:text-gray-700" fill="none">
                            {row.isLTR ? (
                              <>
                                <line x1="8" y1="8" x2="68" y2="8" stroke="currentColor" strokeWidth="3" strokeDasharray="5 4" strokeLinecap="round" />
                                <polygon points="72,8 64,4 64,12" fill="currentColor" />
                              </>
                            ) : (
                              <>
                                <line x1="72" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="3" strokeDasharray="5 4" strokeLinecap="round" />
                                <polygon points="8,8 16,4 16,12" fill="currentColor" />
                              </>
                            )}
                          </svg>
                        </div>

                        {/* TURN CONNECTOR: Uốn cong xuống hàng tiếp theo (nếu chưa phải hàng cuối) */}
                        {!isLastRow && (
                          row.isLTR ? (
                            /* Hàng chẵn LTR -> Uốn cong ở Cột 2 (mép phải) xuống Cột 2 hàng dưới */
                            <div className="absolute -bottom-11 right-2 sm:right-6 w-10 sm:w-14 h-12 pointer-events-none z-0">
                              <svg viewBox="0 0 40 48" className="w-full h-full text-[#d5cdbd] dark:text-gray-700" fill="none">
                                <path
                                  d="M 8 0 C 36 6, 36 42, 8 48"
                                  stroke="currentColor"
                                  strokeWidth="3.5"
                                  strokeDasharray="5 4"
                                  strokeLinecap="round"
                                />
                                <polygon points="8,48 15,44 15,52" fill="currentColor" />
                              </svg>
                            </div>
                          ) : (
                            /* Hàng lẻ RTL -> Uốn cong ở Cột 0 (mép trái) xuống Cột 0 hàng dưới */
                            <div className="absolute -bottom-11 left-2 sm:left-6 w-10 sm:w-14 h-12 pointer-events-none z-0">
                              <svg viewBox="0 0 40 48" className="w-full h-full text-[#d5cdbd] dark:text-gray-700" fill="none">
                                <path
                                  d="M 32 0 C 4 6, 4 42, 32 48"
                                  stroke="currentColor"
                                  strokeWidth="3.5"
                                  strokeDasharray="5 4"
                                  strokeLinecap="round"
                                />
                                <polygon points="32,48 25,44 25,52" fill="currentColor" />
                              </svg>
                            </div>
                          )
                        )}

                        {/* 3 CELLS TRONG HÀNG */}
                        {row.cells.map((topic, colIdx) => (
                          <div
                            key={colIdx}
                            className="relative flex flex-col items-center justify-start z-10"
                          >
                            {topic ? (
                              <div id={`topic-node-${topic.id}`} className="scroll-mt-28 flex flex-col items-center w-full">
                                <TopicNode
                                  topic={topic}
                                  tierColor={section.meta.color}
                                  isCurrent={topic.id === currentId}
                                  isSelected={selectedTopic?.id === topic.id}
                                  onClick={() => setSelectedTopic(topic)}
                                />
                              </div>
                            ) : (
                              <div className="w-[68px] h-[68px] sm:w-[84px] sm:h-[84px]" />
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL POPUP THÔNG TIN BÀI HỌC KHI CLICK */}
        {selectedTopic && (
          <TopicModal
            topic={selectedTopic}
            prevTopic={getPrevTopic(selectedTopic.id)}
            tierColor={TIER_META[selectedTopic.difficulty]?.color || "#58cc02"}
            onClose={() => setSelectedTopic(null)}
          />
        )}

        {/* NÚT CUỘN NHANH VỀ BÀI ĐANG HỌC */}
        {showScrollUp && (
          <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <button
              type="button"
              onClick={scrollToCurrentTopic}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 border-b-4 hover:border-[#58cc02] dark:hover:border-[#58cc02] shadow-2xl text-xs sm:text-sm font-black text-gray-900 dark:text-gray-100 hover:text-[#58cc02] dark:hover:text-[#58cc02] transition-all cursor-pointer group active:translate-y-0.5 active:border-b-2"
              title={currentId ? "Cuộn về chủ đề đang học" : "Cuộn lên đầu trang"}
            >
              <span className="w-6 h-6 rounded-xl bg-[#58cc02]/15 text-[#58cc02] flex items-center justify-center font-black text-sm group-hover:-translate-y-0.5 transition-transform">
                ↑
              </span>
              <span className="tracking-wide uppercase font-extrabold whitespace-nowrap">
                {currentId ? "Về bài đang học" : "Lên đầu trang"}
              </span>
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
