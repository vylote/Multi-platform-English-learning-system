import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStreakStatus, fetchStreakWeek } from "../store/slice/streakSlice";

const WEEKDAY_LABELS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatWeekdayLabel(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return WEEKDAY_LABELS_VI[date.getDay()];
}

export default function RightSidebar() {
  const dispatch = useDispatch();
  const { currentStreak, completedToday, week, loaded } = useSelector((state) => state.streak);

  useEffect(() => {
    dispatch(fetchStreakStatus());
    dispatch(fetchStreakWeek());
  }, [dispatch]);

  const isLit = currentStreak > 0 && completedToday;
  const isAtRisk = currentStreak > 0 && !completedToday;

  return (
    <aside className="w-[320px] h-screen sticky top-0 hidden lg:flex flex-col p-6 border-l border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-8 text-gray-700 dark:text-gray-300 font-bold">
        
        <div className="relative group">
          <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl cursor-pointer">
            <span className={`text-xl transition-all ${isLit ? "" : "grayscale opacity-50"}`}>🔥</span>
            <span className={isLit ? "text-orange-500" : "text-gray-400 dark:text-gray-500"}>
              {loaded ? currentStreak : "–"}
            </span>
          </div>

          {/* SỬA PANEL: Đổi right-0 thành left-0, nới rộng w-[290px], giảm padding p-4 */}
          <div
            className="absolute left-0 top-full mt-2 w-[290px] rounded-2xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-800 shadow-xl p-4 z-30 opacity-0 invisible
                       group-hover:opacity-100 group-hover:visible transition-all duration-150"
          >
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              {currentStreak > 0 ? `Chuỗi ${currentStreak} ngày` : "Chưa có chuỗi ngày học"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {isAtRisk
                ? "Hoàn thành ôn tập hôm nay để giữ chuỗi!"
                : "Học mỗi ngày để duy trì chuỗi của bạn."}
            </p>

            {/* SỬA LÕI: Dùng Grid 7 cột (grid-cols-7) thay vì Flex để chia đều tăm tắp, không bao giờ bị tràn */}
            <div className="grid grid-cols-7 gap-1">
              {week.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                    {formatWeekdayLabel(day.date)}
                  </span>
                  {/* SỬA Ô TRÒN: Giảm từ w-8 h-8 xuống w-7 h-7 để vừa khít trong không gian hẹp */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                      day.completed
                        ? "bg-orange-400 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500"
                    }`}
                  >
                    {day.completed ? "🔥" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl cursor-pointer">
          💎 500
        </div>
        <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl cursor-pointer text-red-500">
          ❤️ 5
        </div>
      </div>

      <div className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center">
        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">Thử thách bảng xếp hạng</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Hoàn thành bài học để mở khóa!</p>
      </div>
    </aside>
  );
}