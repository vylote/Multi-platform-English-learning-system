import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Sparkles,
  CheckCircle2,
  Gift,
  ArrowUpRight,
  Zap,
  Sun,
  Moon,
} from "lucide-react";
import { fetchStreakStatus, fetchStreakWeek } from "../store/slice/streakSlice";
import { useTheme } from "../context/ThemeContext";

const WEEKDAY_LABELS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatWeekdayLabel(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return WEEKDAY_LABELS_VI[date.getDay()];
}

export default function RightSidebar() {
  const dispatch = useDispatch();
  const { isDark, toggleTheme } = useTheme();
  const { currentStreak, completedToday, week, loaded } = useSelector(
    (state) => state.streak
  );
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchStreakStatus());
    dispatch(fetchStreakWeek());
  }, [dispatch]);

  const isLit = currentStreak > 0 && completedToday;
  const isAtRisk = currentStreak > 0 && !completedToday;

  return (
    <aside className="w-[320px] xl:w-[340px] shrink-0 h-screen sticky top-0 hidden xl:flex flex-col p-4 sm:p-5 border-l-2 border-[#d5cdbd] dark:border-gray-800 bg-[#f4efe4] dark:bg-gray-900 overflow-y-auto scrollbar-thin transition-colors duration-300 select-none z-20">
      {/* 1. TOP STATS BAR (EVENLY BALANCED ROW WITH THEME TOGGLE) */}
      <div className="shrink-0 flex items-center justify-between gap-1.5 mb-5">
        {/* STREAK PILL */}
        <div className="relative group flex-1">
          <button
            type="button"
            className={`w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-2xl font-black text-sm transition-all duration-150 border-2 cursor-pointer active:scale-95 ${
              isLit
                ? "bg-orange-500/15 border-orange-500/40 text-orange-900 dark:text-orange-400 hover:bg-orange-500/25 shadow-xs"
                : "bg-[#e4ded0] dark:bg-gray-800 border-[#d5cdbd] dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:text-orange-600"
            }`}
          >
            <span
              className={`transition-transform group-hover:scale-125 shrink-0 ${
                isLit ? "animate-pulse" : "grayscale opacity-50"
              }`}
            >
              <img
                src="/assets/icons/streak-fire.svg"
                alt="Streak fire"
                className="w-5 h-5 object-contain"
              />
            </span>
            <span className="font-black text-gray-950 dark:text-white">
              {loaded ? currentStreak : "–"}
            </span>
          </button>

          {/* STREAK POPOVER */}
          <div className="absolute left-0 top-full mt-2 w-[280px] rounded-3xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-[#f4efe4] dark:bg-gray-800 shadow-2xl p-4 z-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-black text-gray-900 dark:text-white">
                {currentStreak > 0
                  ? `Chuỗi ${currentStreak} ngày!`
                  : "Chưa có chuỗi ngày học"}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-black bg-orange-500/20 text-orange-800 dark:text-orange-400">
                {isLit ? "Đã giữ lửa" : "Chưa học"}
              </span>
            </div>

            <p className="text-xs text-gray-700 dark:text-gray-400 mb-3 leading-relaxed font-semibold">
              {isAtRisk
                ? "⚠️ Hoàn thành 1 bài học hôm nay để không mất chuỗi!"
                : "Luyện tập mỗi ngày để xây dựng thói quen kiên trì."}
            </p>

            {/* 7-DAY CALENDAR GRID */}
            <div className="grid grid-cols-7 gap-1 bg-[#e4ded0]/80 dark:bg-gray-900/60 p-2 rounded-2xl border border-[#d5cdbd] dark:border-gray-700/60">
              {week.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-700 dark:text-gray-400 font-black">
                    {formatWeekdayLabel(day.date)}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                      day.completed
                        ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-sm"
                        : "bg-[#dcd5c5] dark:bg-gray-800 text-gray-600 dark:text-gray-500"
                    }`}
                  >
                    {day.completed ? (
                      <img
                        src="/assets/icons/streak-fire.svg"
                        alt="Active day"
                        className="w-4 h-4 object-contain"
                      />
                    ) : (
                      "·"
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GEMS PILL */}
        <div>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-2xl font-black text-sm bg-sky-500/15 border-2 border-sky-500/40 text-sky-900 dark:text-sky-400 hover:bg-sky-500/25 shadow-xs transition-all cursor-pointer active:scale-95 group"
          >
            <span className="group-hover:scale-125 transition-transform shrink-0">
              <img
                src="/assets/icons/gem.svg"
                alt="Gems"
                className="w-5 h-5 object-contain"
              />
            </span>
            <span className="font-black text-sky-950 dark:text-sky-300">500</span>
          </button>
        </div>

        {/* HEARTS PILL */}
        <div className="flex-1">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-2xl font-black text-sm bg-rose-500/15 border-2 border-rose-500/40 text-rose-900 dark:text-rose-400 hover:bg-rose-500/25 shadow-xs transition-all cursor-pointer active:scale-95 group"
          >
            <span className="group-hover:scale-125 transition-transform shrink-0">
              <img
                src="/assets/icons/heart.svg"
                alt="Hearts"
                className="w-5 h-5 object-contain animate-pulse"
              />
            </span>
            <span className="font-black text-rose-950 dark:text-rose-300">5</span>
          </button>
        </div>

        {/* THEME TOGGLE BUTTON (LIGHT/DARK) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
          className="flex items-center justify-center p-2 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-[#e4ded0] dark:bg-gray-800 hover:bg-[#dbd3c2] dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all cursor-pointer shadow-xs active:scale-95 group shrink-0"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-500 group-hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform" />
          )}
        </button>
      </div>

      {/* 2. SUPER ANHLINGO PROMO CARD (UNIFIED IN BOTH LIGHT & DARK MODES) */}
      <div className="shrink-0 rounded-3xl p-5 mb-5 bg-white dark:bg-[#18232c] border-2 border-[#d5cdbd] dark:border-[#2b3840] shadow-sm text-left transition-colors">
        {/* Badge Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-[#1c7400] dark:text-[#58cc02] border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Super Anhlingo</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
            VIP
          </span>
        </div>

        <h3 className="text-base font-black text-gray-950 dark:text-white leading-tight mb-2">
          Học tập không giới hạn
        </h3>

        {/* Clean feature list */}
        <div className="space-y-1.5 mb-4 text-xs text-gray-800 dark:text-gray-300 font-bold">
          <div className="flex items-center gap-2">
            <span className="text-[#58cc02] font-black text-sm">✓</span>
            <span>Trái tim vô hạn khi làm bài</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#58cc02] font-black text-sm">✓</span>
            <span>Trải nghiệm sạch không quảng cáo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#58cc02] font-black text-sm">✓</span>
            <span>AI chấm phát âm và giải thích chi tiết</span>
          </div>
        </div>

        {/* 3D Duolingo CTA Button */}
        <button
          type="button"
          className="w-full py-2.5 px-4 rounded-2xl bg-[#58cc02] hover:bg-[#4cb001] active:translate-y-0.5 border-b-4 border-[#3b8702] text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer text-center"
        >
          Dùng thử 7 ngày miễn phí
        </button>
      </div>

      {/* 3. DAILY QUESTS CARD (NHIỆM VỤ HÀNG NGÀY) */}
      <div className="shrink-0 rounded-3xl border-2 border-[#d5cdbd] dark:border-[#2b3840] bg-white dark:bg-[#18232c] p-4 sm:p-5 mb-5 text-left shadow-2xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-500 flex items-center justify-center font-black text-sm">
              🎯
            </div>
            <h3 className="font-black text-sm text-gray-950 dark:text-white uppercase tracking-wider">
              Nhiệm vụ hôm nay
            </h3>
          </div>
          <span className="text-xs font-black text-amber-800 dark:text-amber-500 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25">
            1/3 xong
          </span>
        </div>

        <div className="flex flex-col gap-3.5">
          {/* QUEST 1: EARN XP */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-500 flex items-center justify-center shrink-0 text-sm">
              <Zap className="w-4 h-4 fill-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-xs font-black mb-1 text-gray-900 dark:text-gray-100">
                <span className="truncate">Kiếm 30 điểm XP</span>
                <span className="text-gray-600 dark:text-gray-400 text-[11px] font-bold">15 / 30</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#e4ded0] dark:bg-gray-700/60 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: "50%" }}
                />
              </div>
            </div>
          </div>

          {/* QUEST 2: FLASHCARDS (COMPLETED) */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#58cc02]/15 text-[#1c7400] dark:text-[#58cc02] flex items-center justify-center shrink-0 text-sm font-black">
              🎴
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-xs font-black mb-1 text-gray-900 dark:text-gray-100">
                <span className="truncate">Ôn tập 10 thẻ từ</span>
                <span className="text-[#1c7400] dark:text-[#58cc02] font-black text-[11px] flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Xong
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#e4ded0] dark:bg-gray-700/60 overflow-hidden">
                <div
                  className="h-full bg-[#58cc02] rounded-full"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>

          {/* QUEST 3: EXAM */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-500 flex items-center justify-center shrink-0 text-sm font-black">
              📝
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-xs font-black mb-1 text-gray-900 dark:text-gray-100">
                <span className="truncate">Hoàn thành 1 bài thi</span>
                <span className="text-gray-600 dark:text-gray-400 text-[11px] font-bold">0 / 1</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#e4ded0] dark:bg-gray-700/60 overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{ width: "0%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CHEST REWARD PREVIEW */}
        <div className="mt-4 pt-3 border-t border-[#d5cdbd]/60 dark:border-gray-800 flex items-center justify-between text-xs text-gray-700 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="font-bold">Rương quà:</span>
          </div>
          <span className="font-black text-amber-700 dark:text-amber-400">+25 💎 & 50 XP</span>
        </div>
      </div>

      {/* 4. LEADERBOARD LEAGUE PREVIEW (BẢNG XẾP HẠNG) */}
      <div className="shrink-0 rounded-3xl border-2 border-[#d5cdbd] dark:border-[#2b3840] bg-white dark:bg-[#18232c] p-4 sm:p-5 mb-5 text-left shadow-2xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-yellow-500/15 text-yellow-700 dark:text-yellow-500 flex items-center justify-center text-sm font-black">
              🏆
            </div>
            <div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                Giải đấu Đồng
              </h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 font-bold">
                Tuần này • Còn 2 ngày
              </p>
            </div>
          </div>

          <Link
            to="/profile"
            className="text-xs font-black text-[#1c7400] dark:text-[#58cc02] hover:underline flex items-center gap-0.5"
          >
            <span>Chi tiết</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* TOP USERS LIST */}
        <div className="flex flex-col gap-2">
          {/* RANK 1 */}
          <div className="flex items-center gap-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <span className="text-sm font-black text-amber-700 dark:text-amber-500 w-4 text-center">1</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
              M
            </div>
            <span className="text-xs font-black text-gray-900 dark:text-gray-200 truncate flex-1">
              Minh Anh
            </span>
            <span className="text-xs font-black text-amber-700 dark:text-amber-500">420 XP</span>
          </div>

          {/* RANK 2 */}
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-500/10 border border-slate-500/25">
            <span className="text-sm font-black text-slate-700 dark:text-slate-400 w-4 text-center">2</span>
            <div className="w-7 h-7 rounded-lg bg-slate-400 text-white font-black text-xs flex items-center justify-center shrink-0">
              H
            </div>
            <span className="text-xs font-black text-gray-900 dark:text-gray-200 truncate flex-1">
              Hoàng Long
            </span>
            <span className="text-xs font-black text-slate-700 dark:text-slate-400">350 XP</span>
          </div>

          {/* RANK 3 (CURRENT USER) */}
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#58cc02]/20 border-2 border-[#58cc02]/50 shadow-2xs">
            <span className="text-sm font-black text-[#1c7400] dark:text-[#58cc02] w-4 text-center">3</span>
            <div className="w-7 h-7 rounded-lg bg-[#58cc02] text-white font-black text-xs flex items-center justify-center shrink-0">
              {user?.username?.[0] || "U"}
            </div>
            <span className="text-xs font-black text-[#1c7400] dark:text-[#58cc02] truncate flex-1">
              {user?.username || "Bạn"} (Bạn)
            </span>
            <span className="text-xs font-black text-[#1c7400] dark:text-[#58cc02]">240 XP</span>
          </div>
        </div>

        <p className="text-[11px] text-gray-700 dark:text-gray-400 mt-3 text-center font-bold">
          🚀 Top 7 người đứng đầu sẽ được thăng hạng!
        </p>
      </div>

      {/* 5. FOOTER & COPYRIGHT */}
      <footer className="shrink-0 mt-auto pt-4 border-t border-[#d5cdbd] dark:border-[#2b3840] text-[11px] text-gray-600 dark:text-gray-400 text-center leading-relaxed">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-black mb-1.5 uppercase tracking-wider text-[10px]">
          <Link to="/learn" className="hover:text-black dark:hover:text-gray-200">
            Giới thiệu
          </Link>
          <span>•</span>
          <Link to="/learn" className="hover:text-black dark:hover:text-gray-200">
            Điều khoản
          </Link>
          <span>•</span>
          <Link to="/learn" className="hover:text-black dark:hover:text-gray-200">
            Bảo mật
          </Link>
          <span>•</span>
          <Link to="/learn" className="hover:text-black dark:hover:text-gray-200">
            Trợ giúp
          </Link>
        </div>
        <div className="font-bold text-gray-600 dark:text-gray-400">
          © 2026 ANHLINGO • HỌC TIẾNG ANH THÔNG MINH
        </div>
      </footer>
    </aside>
  );
}