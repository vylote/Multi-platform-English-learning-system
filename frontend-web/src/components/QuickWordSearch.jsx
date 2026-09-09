import { useState, useEffect, useRef } from "react";
import api from "../api/api";

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export default function QuickWordSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [resultQuery, setResultQuery] = useState(null); // query mà "results"/"errorMessage" hiện có thuộc về
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef(null);
  const trimmedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(trimmedQuery, 400);

  useEffect(() => {
    if (!debouncedQuery) return; // không có gì để tra - không cần setState nào cả

    const controller = new AbortController();

    api
      .get("/words/search", { params: { q: debouncedQuery }, signal: controller.signal })
      .then((response) => {
        const data = response.data?.result || [];
        setResults(data);
        setErrorMessage(data.length === 0 ? `Không tìm thấy kết quả cho "${debouncedQuery}".` : "");
        setResultQuery(debouncedQuery);
      })
      .catch((error) => {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED") return; // bị hủy vì có query mới hơn - bỏ qua

        const apiMessage = error.response?.data?.message;
        setResults([]);
        setErrorMessage(apiMessage || "Không thể kết nối tới máy chủ. Vui lòng thử lại.");
        setResultQuery(debouncedQuery);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      event.target.blur();
    }
  };

  // Suy ra trạng thái ngay khi render, không lưu "status" riêng trong state
  const isWaitingForDebounce = trimmedQuery.length > 0 && trimmedQuery !== debouncedQuery;
  const isLoading = debouncedQuery.length > 0 && resultQuery !== debouncedQuery;
  const hasResponse = debouncedQuery.length > 0 && resultQuery === debouncedQuery && !isWaitingForDebounce;

  const showDropdown = isOpen && trimmedQuery.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-[480px]">
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500"
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Tra từ nhanh — ví dụ: apple, run, far-sighted..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                     placeholder:text-gray-400 dark:placeholder:text-gray-500
                     focus:outline-none focus:ring-2 focus:ring-[#58cc02] focus:border-transparent
                     transition-colors"
        />

        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setResultQuery(null);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
                       dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Xóa từ khóa"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 shadow-lg max-h-[360px] overflow-y-auto"
        >
          {(isWaitingForDebounce || isLoading) && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500 dark:text-gray-400">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Đang tra cứu...
            </div>
          )}

          {hasResponse && results.length === 0 && (
            <div className="px-4 py-5 text-sm text-gray-500 dark:text-gray-400">
              {errorMessage}
            </div>
          )}

          {hasResponse &&
            results.map((item) => (
              <div
                key={item.id ?? item.word}
                className="px-4 py-3 border-b last:border-b-0 border-gray-100 dark:border-gray-700
                           hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 dark:text-white">{item.word}</span>
                  {item.pronunciation && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">{item.pronunciation}</span>
                  )}
                  {item.part_of_speech && (
                    <span className="text-xs italic text-gray-400 dark:text-gray-500">{item.part_of_speech}</span>
                  )}
                  {item.isExternal && (
                    <span className="text-[11px] font-semibold text-[#58cc02] bg-[#58cc02]/10 px-2 py-0.5 rounded-full">
                      Từ điển online
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.meaning_vi}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}