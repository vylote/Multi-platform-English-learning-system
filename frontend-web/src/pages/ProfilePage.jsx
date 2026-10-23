import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../api/api";
import { logout } from "../store/slice/authSlice";
import { fetchStreakStatus, fetchStreakWeek } from "../store/slice/streakSlice";
import MainLayout from "../layouts/MainLayout";

const TIER_META = {
  BEGINNER: { label: "Cơ bản", color: "#58cc02" },
  INTERMEDIATE: { label: "Trung cấp", color: "#1cb0f6" },
  ADVANCED: { label: "Nâng cao", color: "#ce82ff" },
};

const WEEKDAY_LABELS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatWeekdayLabel(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return WEEKDAY_LABELS_VI[date.getDay()];
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { currentStreak, completedToday, week } = useSelector((state) => state.streak);

  const [learningData, setLearningData] = useState(null);
  const [examHistory, setExamHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchStreakStatus());
    dispatch(fetchStreakWeek());

    const controller = new AbortController();

    // Tải dữ liệu tiến độ lộ trình học
    const fetchLearningPath = api
      .get("/learning-path", { signal: controller.signal })
      .then((res) => setLearningData(res.data?.result))
      .catch(() => {});

    // Tải lịch sử làm bài thi
    const fetchExamHistory = api
      .get("/exams/history", { signal: controller.signal })
      .then((res) => setExamHistory(res.data?.result || []))
      .catch(() => {});

    Promise.allSettled([fetchLearningPath, fetchExamHistory]).finally(() => {
      setLoading(false);
    });

    return () => controller.abort();
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.log("Lỗi đăng xuất: ", error);
    } finally {
      dispatch(logout());
      toast.success("Đã đăng xuất thành công");
      navigate("/login");
    }
  };

  // Tính toán các chỉ số thống kê
  const path = learningData?.path || [];
  const completedTopics = path.filter((t) => t.masteryPercent >= 100).length;
  const totalTopics = path.length;
  const masteredWords = path.reduce((sum, t) => sum + (t.masteredWords || 0), 0);
  const totalWords = path.reduce((sum, t) => sum + (t.totalWords || 0), 0);
  const userTier = learningData?.tier;
  const tierInfo = userTier ? TIER_META[userTier] : null;

  const highestScore = examHistory.length > 0
    ? Math.max(...examHistory.map((e) => Number(e.score || 0)))
    : null;

  return (
    <MainLayout>
      <div className="w-full mx-auto py-2 sm:py-4">
        {/* ============ USER HERO CARD ============ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-800 border-2 border-[#e8e3d8] dark:border-gray-700 shadow-xs mb-6 relative overflow-hidden">
          {/* Top banner accent strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#58cc02]" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left mt-2">
            {/* Avatar Circle */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#58cc02] to-[#46a302] text-white flex items-center justify-center text-3xl sm:text-4xl font-black uppercase shadow-md shadow-[#58cc02]/20 border-3 border-white dark:border-gray-800">
                {user?.username?.[0] || "U"}
              </div>
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-gray-800 border-2 border-[#58cc02] text-xs flex items-center justify-center shadow-xs">
                🎓
              </span>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white truncate">
                  {user?.username}
                </h1>

                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#58cc02]/10 text-[#58cc02] border border-[#58cc02]/30">
                    {user?.role === "ADMIN" ? "Quản trị viên" : "Học viên"}
                  </span>
                  {tierInfo && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
                      style={{
                        backgroundColor: `${tierInfo.color}15`,
                        color: tierInfo.color,
                        borderColor: `${tierInfo.color}35`,
                        borderWidth: "1px",
                      }}
                    >
                      {tierInfo.label}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                {user?.email}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <span>📅</span>
                  <span>
                    Tham gia:{" "}
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Gần đây"}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span>🆔</span>
                  <span>ID: #{user?.id ?? "–"}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============ THỐNG KÊ HỌC TẬP (4 STAT CARDS) ============ */}
        <div className="mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
            <span>📊</span> Thống kê học tập
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Chuỗi Streak */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-gray-800 border-2 border-[#e8e3d8] dark:border-gray-700 shadow-2xs text-left">
              <span className="text-xl sm:text-2xl block mb-1">🔥</span>
              <p className="text-2xl sm:text-3xl font-black text-orange-500">
                {currentStreak}
              </p>
              <p className="text-xs font-extrabold text-gray-800 dark:text-gray-200 mt-0.5">
                Ngày liên tiếp
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                {completedToday ? "✓ Đã học hôm nay" : "Chưa học hôm nay"}
              </p>
            </div>

            {/* 2. Chủ đề hoàn thành */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-gray-800 border-2 border-[#e8e3d8] dark:border-gray-700 shadow-2xs text-left">
              <span className="text-xl sm:text-2xl block mb-1">🗺️</span>
              <p className="text-2xl sm:text-3xl font-black text-[#58cc02]">
                {completedTopics}/{totalTopics || 0}
              </p>
              <p className="text-xs font-extrabold text-gray-800 dark:text-gray-200 mt-0.5">
                Chủ đề thành thạo
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                {totalTopics > 0 ? `${Math.round((completedTopics / totalTopics) * 100)}% lộ trình` : "Đang cập nhật"}
              </p>
            </div>

            {/* 3. Từ vựng đã nắm vững */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-gray-800 border-2 border-[#e8e3d8] dark:border-gray-700 shadow-2xs text-left">
              <span className="text-xl sm:text-2xl block mb-1">📖</span>
              <p className="text-2xl sm:text-3xl font-black text-[#1cb0f6]">
                {masteredWords}
              </p>
              <p className="text-xs font-extrabold text-gray-800 dark:text-gray-200 mt-0.5">
                Từ vựng ghi nhớ
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                Trên tổng {totalWords || 0} từ
              </p>
            </div>

            {/* 4. Bài thi đã làm */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-gray-800 border-2 border-[#e8e3d8] dark:border-gray-700 shadow-2xs text-left">
              <span className="text-xl sm:text-2xl block mb-1">📝</span>
              <p className="text-2xl sm:text-3xl font-black text-[#ce82ff]">
                {examHistory.length}
              </p>
              <p className="text-xs font-extrabold text-gray-800 dark:text-gray-200 mt-0.5">
                Bài thi hoàn tất
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                {highestScore !== null ? `Điểm cao nhất: ${highestScore}/10` : "Chưa thi"}
              </p>
            </div>
          </div>
        </div>

        {/* ============ CHUỖI HOẠT ĐỘNG TUẦN (WEEKLY STREAK) ============ */}
        {week && week.length > 0 && (
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-800 border-2 border-[#e8e3d8] dark:border-gray-700 shadow-2xs mb-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span>🔥</span> Lịch sử chuỗi học 7 ngày qua
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Duy trì việc ôn tập hoặc học từ mới mỗi ngày để giữ lửa chuỗi.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {week.map((day) => {
                const isDone = day.isCompleted;
                const isToday =
                  new Date().toISOString().split("T")[0] === day.date;
                return (
                  <div
                    key={day.date}
                    className={`flex flex-col items-center p-2.5 rounded-2xl border-2 transition-all ${
                      isDone
                        ? "bg-[#58cc02]/10 border-[#58cc02]/40"
                        : isToday
                          ? "bg-gray-100/80 dark:bg-gray-900/60 border-orange-400/50"
                          : "bg-gray-50 dark:bg-gray-900/40 border-gray-200/80 dark:border-gray-700"
                    }`}
                  >
                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1">
                      {formatWeekdayLabel(day.date)}
                    </span>
                    <span className="text-base sm:text-lg">
                      {isDone ? "🔥" : isToday ? "⏳" : "⚪"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============ LỊCH SỬ THI GẦN ĐÂY ============ */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-800 border-2 border-[#e8e3d8] dark:border-gray-700 shadow-2xs mb-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>🏆</span> Lịch sử làm bài thi gần đây
            </h3>
            <Link
              to="/exams"
              className="text-xs font-bold text-[#58cc02] hover:underline"
            >
              Xem danh sách đề thi →
            </Link>
          </div>

          {examHistory.length === 0 ? (
            <div className="py-8 text-center">
              <span className="text-3xl block mb-2">📝</span>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                Bạn chưa thực hiện bài thi nào
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                Làm bài kiểm tra đầu vào hoặc thi theo chủ đề để đánh giá năng lực!
              </p>
              <Link
                to="/exams"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase text-white bg-[#58cc02] hover:bg-[#4cb001] shadow-md shadow-[#58cc02]/25 transition-all"
              >
                Làm bài thi ngay →
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {examHistory.slice(0, 4).map((item, idx) => {
                const scoreNum = Number(item.score ?? 0);
                const isPassed = scoreNum >= 6.0;
                return (
                  <div
                    key={item.id ?? idx}
                    className="p-3.5 sm:p-4 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                        {item.exam_title || item.title || `Bài thi #${item.exam_id || idx + 1}`}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {item.submitted_at || item.created_at
                          ? new Date(item.submitted_at || item.created_at).toLocaleDateString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                            })
                          : "Đã nộp bài"}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-base sm:text-lg font-black px-3 py-1 rounded-xl border ${
                          isPassed
                            ? "bg-[#58cc02]/10 text-[#58cc02] border-[#58cc02]/30"
                            : "bg-rose-500/10 text-rose-500 border-rose-500/30"
                        }`}
                      >
                        {scoreNum.toFixed(1)}/10
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============ CÀI ĐẶT & ĐĂNG XUẤT ============ */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-2xs text-left">
          <h3 className="text-sm font-black text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
            <span>⚙️</span> Quản lý tài khoản
          </h3>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Phiên đăng nhập hiện tại được bảo mật qua JWT. Bạn có thể đăng xuất bất cứ lúc nào.
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider text-rose-500 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-2 border-rose-500/30 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            >
              <span>🚪</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}