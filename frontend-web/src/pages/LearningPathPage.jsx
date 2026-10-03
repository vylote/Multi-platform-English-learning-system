import { useState, useEffect } from "react";
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

// Độ lệch ngang (px) lặp theo chu kỳ -> tạo đường đi ngoằn ngoèo
const ZIGZAG = [0, 44, 72, 44, 0, -44, -72, -44];

function TopicNode({ topic, tierColor, isCurrent, isOpen, onClick }) {
  const locked = !topic.isUnlocked;
  const done = topic.masteryPercent >= 100;
  const accent = done ? GOLD : tierColor;
  const pct = Math.min(topic.masteryPercent, 100);

  return (
    <div
      className={`relative flex flex-col items-center ${isCurrent ? "pt-9" : ""}`}
    >
      {isCurrent && (
        <span
          className="absolute top-0 px-3 py-1 rounded-xl text-xs font-extrabold uppercase
                     bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 animate-bounce"
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
                   transition-transform hover:scale-105 active:scale-95"
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
          {locked ? "🔒" : done ? "✓" : "★"}
        </span>
      </button>

      <p className="mt-2 text-xs font-bold text-center max-w-[130px] leading-tight text-gray-800 dark:text-gray-100">
        {topic.title}
      </p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">
        {locked ? "Đã khóa" : `${topic.masteryPercent}%`}
      </p>
    </div>
  );
}

function TopicCard({ topic, prevTopic, tierColor }) {
  const locked = !topic.isUnlocked;

  if (locked) {
    return (
      <div className="mt-4 w-[300px] max-w-full rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Đạt ít nhất <b>{UNLOCK_THRESHOLD}%</b> ở chủ đề{" "}
          <b>{prevTopic?.title}</b> để mở khóa.
        </p>
      </div>
    );
  }

  return (
    <div
      className="mt-4 w-[300px] max-w-full rounded-2xl p-4 text-white shadow-lg"
      style={{ backgroundColor: tierColor }}
    >
      <h3 className="font-extrabold text-lg mb-3">{topic.title}</h3>

      <div className="h-2.5 rounded-full bg-black/20 overflow-hidden mb-2">
        <div
          className="h-full rounded-full bg-white"
          style={{ width: `${Math.min(topic.masteryPercent, 100)}%` }}
        />
      </div>
      <p className="text-sm font-semibold mb-1">
        Thành thạo: {topic.masteryPercent}%
      </p>
      <p className="text-xs opacity-90">
        Từ vựng đã thuộc: {topic.masteredWords}/{topic.totalWords}
      </p>
      <p className="text-xs opacity-90">
        Điểm bài thi cao nhất:{" "}
        {topic.bestExamScore !== null
          ? `${topic.bestExamScore}/10`
          : "chưa thi"}
      </p>
      <p className="text-xs opacity-90 mb-4">
        Điểm bài học cao nhất:{" "}
        {topic.bestLessonScore != null
          ? `${Math.round(topic.bestLessonScore)}%`
          : "chưa làm"}
      </p>

      <div className="flex flex-col gap-2">
        <Link
          to={`/learn/topics/${topic.id}`}
          className="text-center py-2.5 rounded-xl bg-white text-sm font-extrabold uppercase"
          style={{ color: tierColor }}
        >
          Bắt đầu bài học
        </Link>
        <div className="flex gap-2">
          <Link
            to={withReturnTo(`/review?topicId=${topic.id}`, "/learn")}
            className="flex-1 text-center py-2.5 rounded-xl bg-white text-sm font-extrabold uppercase"
            style={{ color: tierColor }}
          >
            Ôn từ vựng
          </Link>
          <Link
            to={withReturnTo(`/exams/topics/${topic.id}`, "/learn")}
            className="flex-1 text-center py-2.5 rounded-xl bg-white text-sm font-extrabold uppercase"
            style={{ color: tierColor }}
          >
            Làm bài thi
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
        <p className="text-sm text-gray-400 dark:text-gray-500 py-16 text-center">
          Đang tải lộ trình...
        </p>
      </MainLayout>
    );
  }

  const { tier, needsPlacement, path } = data;
  const completedCount = path.filter((t) => t.masteryPercent >= 100).length;
  // isCurrent có thể đúng với nhiều topic cùng lúc -> chỉ đánh dấu "Học tiếp" ở topic đầu tiên
  const currentId = path.find((t) => t.isCurrent)?.id;

  return (
    <MainLayout>
      <div className="max-w-[520px] mx-auto pb-16">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Lộ trình của bạn
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {tier ? `Trình độ: ${TIER_META[tier].label} · ` : ""}
            {completedCount}/{path.length} chủ đề hoàn thành
          </p>
        </div>

        {needsPlacement && (
          <div className="mb-6 p-4 rounded-2xl border-2 border-[#ff9600]/40 bg-[#ff9600]/10 text-sm text-gray-700 dark:text-gray-200">
            Bạn chưa làm bài kiểm tra đầu vào nên mới thấy các chủ đề cơ bản.{" "}
            <Link
              to="/placement-test"
              className="font-bold text-[#ff9600] underline"
            >
              Làm ngay
            </Link>
          </div>
        )}

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
                    className="rounded-2xl px-4 py-3 mb-7 text-white flex items-center justify-between"
                    style={{ backgroundColor: meta.color }}
                  >
                    <span className="font-extrabold uppercase text-sm">
                      Phần {TIER_ORDER.indexOf(topic.difficulty) + 1}
                    </span>
                    <span className="text-sm font-semibold">{meta.label}</span>
                  </div>
                )}

                <div className="flex flex-col items-center">
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
      </div>
    </MainLayout>
  );
}
