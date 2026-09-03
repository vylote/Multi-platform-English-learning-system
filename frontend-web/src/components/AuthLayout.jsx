import { X, ArrowLeft, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function AuthLayout({ onClose, onBack, children }) {
  // 1. Kiểm tra trạng thái ngay khi khởi tạo state để tránh render thừa
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.theme === "dark" ||
        (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  // 2. Dùng useEffect ĐỂ ĐỒNG BỘ state ra bên ngoài (DOM và localStorage)
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    }
  }, [isDarkMode]); // Chạy lại mỗi khi isDarkMode thay đổi

  // 3. Hàm toggle chỉ cần đảo ngược state hiện tại
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className="min-h-screen w-full bg-[#f9f9f9] dark:bg-gray-900 flex flex-col transition-colors duration-300">
      {/* Header dùng chung */}
      <header className="w-full p-4 flex items-center justify-between">
        <div className="flex items-center">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Quay lại"
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
        </div>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          title="Bật/tắt chế độ ban đêm"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 w-full max-w-[400px] rounded-lg shadow-lg px-6 py-5 sm:px-8 sm:py-6 transition-colors duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}