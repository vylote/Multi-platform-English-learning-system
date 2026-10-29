import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ExamLayout({
  title,
  onExit,
  headerCenter,
  headerRight,
  rightSidebar,
  children,
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="h-screen w-full flex bg-[#ede8dc]/40 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors overflow-hidden">
      {/* 1. MAIN COLUMN (SLIM UNIFIED TOP BAR + SCROLLABLE BODY) */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* SLIM UNIFIED TOP BAR (h-12) */}
        <header className="shrink-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 sm:px-5 h-12 flex items-center justify-between gap-4 shadow-2xs transition-colors">
          {/* Left: Exit button & optional title */}
          <div className="flex items-center gap-3 shrink-0">
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:text-red-500 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-all cursor-pointer shadow-2xs"
              >
                <span>✕</span>
                <span>Thoát</span>
              </button>
            )}
            {title && (
              <span className="hidden sm:inline-block text-xs font-semibold text-gray-500 dark:text-gray-400 truncate max-w-[220px]">
                {title}
              </span>
            )}
          </div>

          {/* Center: Progress Bar or Custom Header Center */}
          {headerCenter && (
            <div className="flex-1 max-w-lg mx-auto flex items-center justify-center">
              {headerCenter}
            </div>
          )}

          {/* Right: Extra controls & Mobile toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {headerRight}

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
              aria-label={isDark ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-750 transition-all cursor-pointer shadow-2xs group"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500 group-hover:-rotate-12 transition-transform" />
              )}
            </button>

            {rightSidebar && (
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-[#58cc02]/15 text-[#58cc02] hover:bg-[#58cc02]/25 border border-[#58cc02]/30 transition-all cursor-pointer shadow-2xs"
              >
                <span>📋</span>
                <span>Bảng thi</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Questions Content */}
        <main id="exam-main-scroll" className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin">
          <div className={`mx-auto animate-fadeIn ${rightSidebar ? "max-w-[860px]" : "max-w-[1200px]"}`}>
            {children}
          </div>
        </main>
      </div>

      {/* 2. DEDICATED FULL-HEIGHT RIGHT SIDEBAR (Desktop) */}
      {rightSidebar && (
        <>
          <aside className="hidden lg:flex w-[310px] xl:w-[340px] 2xl:w-[360px] h-screen shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-col z-30 shadow-md">
            {rightSidebar}
          </aside>

          {/* Mobile Drawer Overlay */}
          {mobileDrawerOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs animate-fadeIn"
              onClick={() => setMobileDrawerOpen(false)}
            />
          )}

          {/* Mobile Drawer Slide-over */}
          <aside
            className={`fixed top-0 right-0 h-screen w-[320px] sm:w-[350px] max-w-[85vw] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
              mobileDrawerOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-200 dark:border-gray-800">
              <span className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider">
                Bảng điều khiển bài thi
              </span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {rightSidebar}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}