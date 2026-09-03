export default function RightSidebar() {
  return (
    <aside className="w-[320px] h-screen sticky top-0 hidden lg:flex flex-col p-6 border-l border-gray-200 dark:border-gray-700">
      {/* Vùng Header chứa Lửa (Streak), Đá quý (Gems) */}
      <div className="flex items-center justify-between mb-8 text-gray-700 dark:text-gray-300 font-bold">
        <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl cursor-pointer">
          🔥 0
        </div>
        <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl cursor-pointer">
          💎 500
        </div>
        <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl cursor-pointer text-red-500">
          ❤️ 5
        </div>
      </div>

      {/* Khung chứa các Widget sau này (Nhiệm vụ, Bạn bè) */}
      <div className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center">
        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">Thử thách bảng xếp hạng</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Hoàn thành bài học để mở khóa!</p>
      </div>
    </aside>
  );
}