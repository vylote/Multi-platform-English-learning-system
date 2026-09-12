export default function ExamLayout({ title, onExit, children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
        <h1 className="text-base font-semibold truncate">{title}</h1>
        {onExit && (
          <button
            onClick={onExit}
            className="text-sm font-bold px-4 py-1.5 rounded-lg bg-[#1cb0f6] text-white hover:bg-[#189fdf] transition-colors"
          >
            Thoát
          </button>
        )}
      </header>
      <main className="max-w-[1400px] mx-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}