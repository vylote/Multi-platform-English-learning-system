import { Link, useNavigate } from "react-router-dom";
import { X, ArrowLeft, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function AuthLayout({ onClose, onBack, mode = "login", children }) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen w-full bg-[#ede8dc] dark:bg-[#16171d] text-gray-900 dark:text-gray-100 flex flex-col justify-between transition-colors duration-200 select-none">
      {/* 1. TOP HEADER */}
      <header className="w-full border-b-2 border-[#d5cdbd] dark:border-gray-800 bg-[#f4efe4]/80 dark:bg-[#16171d]/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo Brand: anhlingo */}
          <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-b from-[#58cc02] to-[#46a302] p-1 flex items-center justify-center shadow-md shadow-[#58cc02]/25 border-b-3 border-[#3b8702] group-hover:scale-105 transition-transform shrink-0">
              <svg viewBox="0 0 36 36" fill="none" className="w-full h-full drop-shadow-xs">
                <rect x="3" y="4" width="30" height="28" rx="14" fill="#58cc02" />
                <ellipse cx="18" cy="24" rx="9" ry="7" fill="#6fe318" />
                <circle cx="12" cy="14" r="5.5" fill="white" />
                <circle cx="24" cy="14" r="5.5" fill="white" />
                <circle cx="13" cy="14" r="3" fill="#0f172a" />
                <circle cx="25" cy="14" r="3" fill="#0f172a" />
                <circle cx="14" cy="13" r="1.2" fill="white" />
                <circle cx="26" cy="13" r="1.2" fill="white" />
                <polygon points="18,17 15,22 21,22" fill="#ff9600" />
              </svg>
            </div>
            <div className="flex items-baseline tracking-tight">
              <span className="text-xl sm:text-[22px] font-black text-[#58cc02] lowercase leading-none">anh</span>
              <span className="text-xl sm:text-[22px] font-black text-gray-900 dark:text-white lowercase leading-none">lingo</span>
              <span className="w-2 h-2 rounded-full bg-[#58cc02] ml-0.5 inline-block" />
            </div>
          </Link>

          {/* Right Controls: Switch Mode + Theme + Close */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Switch Mode Button (Duolingo Header Style) */}
            {mode === "login" ? (
              <Link
                to="/register"
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 border-[#d5cdbd] dark:border-gray-700 border-b-4 bg-[#f4efe4] dark:bg-gray-800 text-[#1cb0f6] dark:text-[#38bdf8] font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-[#e4ded0] dark:hover:bg-gray-700 active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer shadow-xs"
              >
                Đăng ký
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 border-[#d5cdbd] dark:border-gray-700 border-b-4 bg-[#f4efe4] dark:bg-gray-800 text-[#1cb0f6] dark:text-[#38bdf8] font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-[#e4ded0] dark:hover:bg-gray-700 active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer shadow-xs"
              >
                Đăng nhập
              </Link>
            )}

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
              aria-label={isDark ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
              className="w-9 h-9 rounded-xl flex items-center justify-center border-2 border-[#d5cdbd] dark:border-gray-700 hover:border-[#b8af9c] dark:hover:border-gray-600 bg-[#f4efe4] dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all cursor-pointer shadow-xs"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Back or Close Button */}
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Quay lại"
                className="w-9 h-9 rounded-xl flex items-center justify-center border-2 border-[#d5cdbd] dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-[#e4ded0] dark:hover:bg-gray-800 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng"
                className="w-9 h-9 rounded-xl flex items-center justify-center border-2 border-[#d5cdbd] dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-[#e4ded0] dark:hover:bg-gray-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* 2. MAIN CARD CONTENT */}
      <main className="flex-1 w-full flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="bg-white dark:bg-[#18232c] w-full max-w-[440px] rounded-3xl border-2 border-[#d5cdbd] dark:border-[#2b3840] shadow-xl p-6 sm:p-8 transition-colors duration-200">
          {children}
        </div>
      </main>

      {/* 3. SUBTLE FOOTER */}
      <footer className="w-full text-center py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">
        anhlingo © {new Date().getFullYear()} — Nền tảng học tiếng Anh thông minh
      </footer>
    </div>
  );
}