export default function ExamLayout({ title, onExit, children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-8 py-3.5 shadow-xs transition-colors">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#58cc02] flex items-center justify-center text-white shadow-xs shrink-0">
              <span className="text-lg">🎯</span>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#58cc02]">
                ELS Examination Center
              </div>
              <h1 className="text-base sm:text-lg font-bold truncate text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>
          </div>

          {onExit && (
            <button
              onClick={onExit}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-all duration-150 cursor-pointer shadow-2xs"
            >
              <span>✕</span>
              <span>Thoát</span>
            </button>
          )}
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 animate-fadeIn">
        {children}
      </main>
    </div>
  );
}