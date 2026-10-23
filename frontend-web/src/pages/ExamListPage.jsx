import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../api/api";
import MainLayout from "../layouts/MainLayout";
import Pagination from "../components/Pagination";
import { getReturnTo, withReturnTo } from "../utils/navigation";

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

export default function ExamListPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = getReturnTo(searchParams);

  const [topic, setTopic] = useState(null);
  const [exams, setExams] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Tải thông tin chủ đề
  useEffect(() => {
    if (!topicId) return;
    const controller = new AbortController();

    api
      .get("/topics", { signal: controller.signal })
      .then((res) => {
        const list = res.data?.result || [];
        const found = list.find((t) => String(t.id) === String(topicId));
        if (found) setTopic(found);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [topicId]);

  // Tải danh sách đề thi của chủ đề
  useEffect(() => {
    const controller = new AbortController();

    api
      .get(`/exams`, {
        params: { topic_id: topicId, page, pageSize: 12 },
        signal: controller.signal,
      })
      .then((res) => {
        const result = res.data?.result || {};
        const dataList = result.data || result.items || result.exams || result.content || [];
        const totalPgs = result.totalPages || result.total_pages || result.totalPage || 1;
        const currPage = result.currentPage || result.current_page || result.page || page;

        setExams(Array.isArray(dataList) ? dataList : []);
        setTotalPages(totalPgs);
        setPage(currPage);
      })
      .catch((error) => {
        if (error.code === "ERR_CANCELED") return;
        setLoadError(error.response?.data?.message || "Không thể tải danh sách đề thi.");
        setExams([]);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [topicId, page]);

  const handleBackClick = () => navigate(returnTo || "/exams");
  const goToDetail = (examId) => navigate(withReturnTo(`/exams/${examId}`, returnTo));

  const rawTitle = exams[0]?.title || "";
  const fallbackTopicTitle = rawTitle
    .replace(/^Đề thi:\s*/i, "")
    .replace(/^Bài thi:\s*/i, "")
    .trim();

  const topicTitle = topic?.title || fallbackTopicTitle || `Chủ đề #${topicId}`;
  const icon = TOPIC_ICONS[topicTitle] || TOPIC_ICONS[topic?.title] || "📚";

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto py-4 sm:py-6 px-2 sm:px-4 text-left">
        {/* TOP NAVIGATION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700 shadow-2xs hover:border-[#58cc02] dark:hover:border-[#58cc02] transition-all cursor-pointer group active:scale-95"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>{returnTo ? "Quay lại Lộ trình" : "Danh sách chủ đề"}</span>
          </button>

          <Link
            to={withReturnTo(`/review?topicId=${topicId}`, `/exams/topics/${topicId}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold text-[#58cc02] hover:text-white bg-[#58cc02]/10 hover:bg-[#58cc02] border-2 border-[#58cc02]/30 hover:border-[#58cc02] transition-all shadow-2xs active:scale-95"
          >
            <span>🎴</span>
            <span>Ôn từ vựng chủ đề này</span>
          </Link>
        </div>

        {/* TOPIC HERO BANNER */}
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-3xl p-6 sm:p-8 mb-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#58cc02]/10 border-2 border-[#58cc02]/30 text-3xl sm:text-4xl flex items-center justify-center shrink-0 shadow-2xs">
                {icon}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#58cc02]/15 text-[#58cc02] border border-[#58cc02]/30">
                    <span>🎯</span> Chủ đề luyện thi
                  </span>
                  {topic?.difficulty && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {topic.difficulty === "BEGINNER"
                        ? "Cơ bản"
                        : topic.difficulty === "INTERMEDIATE"
                          ? "Trung cấp"
                          : "Nâng cao"}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                  {topicTitle}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 max-w-2xl leading-relaxed">
                  {topic?.description ||
                    "Luyện tập các bộ đề kiểm tra trắc nghiệm 10 câu hỏi để củng cố ngữ pháp và nâng cao độ nhạy bén từ vựng."}
                </p>
              </div>
            </div>

            {/* Quick Stats Pill */}
            {!loading && (
              <div className="flex sm:flex-col gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 dark:border-gray-700/60 w-full sm:w-auto justify-between sm:justify-start">
                <div className="p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700 text-left sm:text-right">
                  <div className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                    Số lượng đề thi
                  </div>
                  <div className="text-lg font-black text-[#58cc02]">
                    {exams.length} đề thi
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ERROR STATE */}
        {loadError && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-2xl mb-6 text-sm">
            ⚠️ {loadError}
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500">
            <div className="w-10 h-10 border-4 border-[#58cc02] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold">Đang chuẩn bị đề thi cho bạn...</p>
          </div>
        ) : exams.length === 0 ? (
          /* EMPTY STATE */
          <div className="text-center py-20 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl bg-gray-50/50 dark:bg-gray-800/30 max-w-lg mx-auto">
            <span className="text-5xl mb-3 block">📄</span>
            <h3 className="text-lg font-extrabold text-gray-800 dark:text-gray-200 mb-1">
              Chưa có đề thi cho chủ đề này
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
              Hệ thống đang cập nhật bộ đề mới cho chủ đề này. Bạn có thể quay lại sau nhé!
            </p>
            <button
              onClick={handleBackClick}
              className="px-6 py-3 rounded-2xl text-sm font-extrabold bg-[#58cc02] text-white hover:bg-[#4cb001] transition-all shadow-md shadow-[#58cc02]/25 cursor-pointer"
            >
              ← Quay lại danh sách chủ đề
            </button>
          </div>
        ) : exams.length === 1 ? (
          /* BALANCED 2-COLUMN LAYOUT WHEN ONLY 1 EXAM AVAILABLE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Exam Card (7 cols) */}
            <div className="lg:col-span-7">
              <div
                onClick={() => goToDetail(exams[0].id)}
                className="group bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#58cc02] dark:hover:border-[#58cc02] rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#58cc02]/10 text-[#58cc02] border border-[#58cc02]/30">
                      <span>📝</span> Đề thi chính thức
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      Mã đề: #{exams[0].id}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-5 group-hover:text-[#58cc02] dark:group-hover:text-[#58cc02] transition-colors">
                    {exams[0].title}
                  </h2>

                  {/* 4 Feature Specs Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3.5 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700">
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">Thời gian</div>
                      <div className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                        <span>⏱</span> {exams[0].duration} phút
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700">
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">Số câu hỏi</div>
                      <div className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                        <span>✏️</span> {exams[0].question_count || 10} câu
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700">
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">Hình thức</div>
                      <div className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                        <span>🎯</span> Trắc nghiệm
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700">
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">Thang điểm</div>
                      <div className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                        <span>🏆</span> 10.0 điểm
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToDetail(exams[0].id);
                  }}
                  className="w-full py-4 px-6 rounded-2xl font-extrabold text-base bg-[#58cc02] hover:bg-[#4cb001] text-white shadow-md shadow-[#58cc02]/25 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Bắt đầu làm bài thi</span>
                  <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>

            {/* Supportive Guidelines & Flashcard Tip (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span>💡</span> Hướng dẫn làm bài hiệu quả
                </h3>
                <ul className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-2.5 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[#58cc02] font-bold text-base leading-none">•</span>
                    <span>Đồng hồ đếm ngược 15 phút sẽ chạy ngay sau khi bạn mở đề thi.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#58cc02] font-bold text-base leading-none">•</span>
                    <span>Bạn có thể chọn lại đáp án hoặc đổi câu bất cứ lúc nào trước khi nộp.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#58cc02] font-bold text-base leading-none">•</span>
                    <span>Sau khi nộp, bạn sẽ nhận được điểm và lời giải thích chi tiết cho từng câu.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#58cc02]/5 dark:bg-[#58cc02]/10 border-2 border-[#58cc02]/25 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <div className="text-2xl mb-2">🎴</div>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-1">
                    Chưa sẵn sàng làm bài?
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    Ôn tập nhanh 10 từ vựng chủ đề này bằng Flashcard để tăng khả năng đạt điểm tuyệt đối!
                  </p>
                </div>
                <Link
                  to={withReturnTo(`/review?topicId=${topicId}`, `/exams/topics/${topicId}`)}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-[#58cc02] hover:bg-[#4cb001] text-white transition-all text-center shadow-xs shadow-[#58cc02]/20"
                >
                  Ôn từ vựng ngay →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* MULTIPLE EXAMS GRID (3 COLS) */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {exams.map((exam, idx) => (
                <div
                  key={exam.id}
                  className="group bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-3xl p-6 flex flex-col justify-between hover:border-[#58cc02] dark:hover:border-[#58cc02] shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer text-left"
                  onClick={() => goToDetail(exam.id)}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#58cc02]/10 text-[#58cc02] border border-[#58cc02]/30">
                        <span>📝</span> Đề #{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                        ID: #{exam.id}
                      </span>
                    </div>

                    <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-[#58cc02] dark:group-hover:text-[#58cc02] transition-colors">
                      {exam.title}
                    </h2>

                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700 mb-5 text-xs text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>⏱</span>
                        <span>{exam.duration} phút</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <span>✏️</span>
                        <span>{exam.question_count || 10} câu</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToDetail(exam.id);
                    }}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#58cc02] hover:bg-[#4cb001] text-white shadow-xs shadow-[#58cc02]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Làm bài thi ngay</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onChange={(newPage) => {
                    setLoading(true);
                    setPage(newPage);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}