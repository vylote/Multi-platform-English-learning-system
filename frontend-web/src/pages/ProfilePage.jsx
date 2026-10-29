import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Calendar,
  Hash,
  Award,
  LogOut,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Crown,
  GraduationCap,
} from "lucide-react";

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

  const highestScore =
    examHistory.length > 0
      ? Math.max(...examHistory.map((e) => Number(e.score || 0)))
      : null;

  return (
    <MainLayout>
      <div className="w-full max-w-[840px] mx-auto py-2 sm:py-4 text-left">
        {/* ============ USER HERO CARD ============ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-sm mb-6 relative overflow-hidden transition-colors">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar Circle */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-[#58cc02] to-[#46a302] text-white flex items-center justify-center text-3xl sm:text-4xl font-black uppercase shadow-md shadow-[#58cc02]/25 border-b-4 border-[#3b8702]">
                {user?.username?.[0] || "U"}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-[#d5cdbd] dark:border-gray-700 flex items-center justify-center shadow-xs">
                <img
                  src="/assets/icons/mascot.svg"
                  alt="Mascot"
                  className="w-5 h-5 object-contain"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white truncate">
                  {user?.username}
                </h1>

                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#58cc02]/10 text-[#58cc02] border border-[#58cc02]/30">
                    {user?.role === "ADMIN" ? (
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <GraduationCap className="w-3.5 h-3.5" />
                    )}
                    <span>{user?.role === "ADMIN" ? "Quản trị viên" : "Học viên"}</span>
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

              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                {user?.email}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-5 text-xs font-bold text-gray-600 dark:text-gray-400 flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#58cc02]" />
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
                  <Hash className="w-4 h-4 text-[#1cb0f6]" />
                  <span>ID: #{user?.id ?? "–"}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============ THỐNG KÊ HỌC TẬP (4 STAT CARDS) ============ */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#58cc02]" />
              <span>Thống kê thành tích</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Chuỗi Streak */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs text-left transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-3">
                <img
                  src="/assets/icons/streak-fire.svg"
                  alt="Streak"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-orange-500">
                {currentStreak}
              </p>
              <p className="text-xs font-black text-gray-800 dark:text-gray-200 mt-0.5">
                Ngày liên tiếp
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-1 flex items-center gap-1">
                {completedToday ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#58cc02]" />
                    <span className="text-[#58cc02]">Đã học hôm nay</span>
                  </>
                ) : (
                  <span>Chưa học hôm nay</span>
                )}
              </p>
            </div>

            {/* 2. Chủ đề hoàn thành */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs text-left transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-[#58cc02]/10 flex items-center justify-center mb-3">
                <img
                  src="/assets/icons/mascot.svg"
                  alt="Topics"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#58cc02]">
                {completedTopics}/{totalTopics || 0}
              </p>
              <p className="text-xs font-black text-gray-800 dark:text-gray-200 mt-0.5">
                Chủ đề thành thạo
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-1">
                {totalTopics > 0
                  ? `${Math.round((completedTopics / totalTopics) * 100)}% lộ trình`
                  : "Đang cập nhật"}
              </p>
            </div>

            {/* 3. Từ vựng đã nắm vững */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs text-left transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-[#1cb0f6]/10 flex items-center justify-center mb-3">
                <img
                  src="/assets/icons/gem.svg"
                  alt="Vocab"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#1cb0f6]">
                {masteredWords}
              </p>
              <p className="text-xs font-black text-gray-800 dark:text-gray-200 mt-0.5">
                Từ vựng ghi nhớ
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-1">
                Trên tổng {totalWords || 0} từ
              </p>
            </div>

            {/* 4. Bài thi đã làm */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs text-left transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-[#ce82ff]/10 flex items-center justify-center mb-3">
                <img
                  src="/assets/icons/trophy.svg"
                  alt="Exams"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#ce82ff]">
                {examHistory.length}
              </p>
              <p className="text-xs font-black text-gray-800 dark:text-gray-200 mt-0.5">
                Bài thi hoàn tất
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-1">
                {highestScore !== null ? `Cao nhất: ${highestScore}/10` : "Chưa làm bài"}
              </p>
            </div>
          </div>
        </div>

        {/* ============ CHUỖI HOẠT ĐỘNG TUẦN (WEEKLY STREAK) ============ */}
        {week && week.length > 0 && (
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs mb-6 text-left transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <img
                    src="/assets/icons/streak-fire.svg"
                    alt="Streak"
                    className="w-4 h-4 object-contain inline-block"
                  />
                  <span>Lịch sử chuỗi học 7 ngày qua</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Duy trì việc ôn tập hoặc học từ mới mỗi ngày để giữ lửa chuỗi.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {week.map((day) => {
                const isDone = day.isCompleted;
                const isToday =
                  new Date().toISOString().split("T")[0] === day.date;
                return (
                  <div
                    key={day.date}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border-2 transition-all ${
                      isDone
                        ? "bg-[#58cc02]/10 border-[#58cc02]/40 text-[#58cc02]"
                        : isToday
                          ? "bg-orange-500/10 border-orange-400/50"
                          : "bg-gray-100/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-1.5">
                      {formatWeekdayLabel(day.date)}
                    </span>
                    <div className="w-7 h-7 flex items-center justify-center">
                      {isDone ? (
                        <img
                          src="/assets/icons/streak-fire.svg"
                          alt="Done"
                          className="w-5 h-5 object-contain"
                        />
                      ) : isToday ? (
                        <span className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============ LỊCH SỬ THI GẦN ĐÂY ============ */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs mb-6 text-left transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <img
                src="/assets/icons/trophy.svg"
                alt="Trophy"
                className="w-4 h-4 object-contain inline-block"
              />
              <span>Lịch sử làm bài thi gần đây</span>
            </h3>
            <Link
              to="/exams"
              className="text-xs font-black text-[#58cc02] hover:underline inline-flex items-center gap-1"
            >
              <span>Xem danh sách đề thi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {examHistory.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <img
                  src="/assets/icons/trophy.svg"
                  alt="No exams"
                  className="w-8 h-8 object-contain opacity-60"
                />
              </div>
              <p className="text-sm font-extrabold text-gray-800 dark:text-gray-200 mb-1">
                Bạn chưa thực hiện bài thi nào
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                Làm bài kiểm tra đầu vào hoặc thi theo chủ đề để đánh giá năng lực của bạn!
              </p>
              <Link
                to="/exams"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black uppercase text-white bg-[#58cc02] hover:bg-[#4cb001] shadow-md shadow-[#58cc02]/25 transition-all"
              >
                <span>Làm bài thi ngay</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {examHistory.slice(0, 5).map((item, idx) => {
                const scoreNum = Number(item.score ?? 0);
                const isPassed = scoreNum >= 6.0;
                return (
                  <div
                    key={item.id ?? idx}
                    className="p-3.5 sm:p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 hover:border-[#58cc02] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                        {item.exam_title || item.title || `Bài thi #${item.exam_id || idx + 1}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {item.submitted_at || item.created_at
                            ? new Date(item.submitted_at || item.created_at).toLocaleDateString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })
                            : "Đã hoàn thành"}
                        </span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm sm:text-base font-black px-3 py-1.5 rounded-xl border ${
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
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-gray-700 shadow-2xs text-left transition-colors">
          <h3 className="text-sm font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#58cc02]" />
            <span>Quản lý tài khoản</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
              Tài khoản của bạn được mã hóa và bảo mật với cơ chế xác thực JWT nhiều thiết bị. Bạn có thể đăng xuất khỏi phiên làm việc bất cứ lúc nào.
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-2 border-rose-500/30 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}