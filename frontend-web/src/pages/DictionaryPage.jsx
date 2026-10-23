import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import api from "../api/api";

const RECENT_KEY = "els_dict_recent_searches";
const MAX_RECENT = 8;

const SUGGESTED_WORDS = [
  { word: "opportunity", label: "Cơ hội" },
  { word: "resilience", label: "Kiên cường" },
  { word: "delicious", label: "Ngon miệng" },
  { word: "knowledge", label: "Tri thức" },
  { word: "journey", label: "Hành trình" },
  { word: "challenge", label: "Thử thách" },
  { word: "efficient", label: "Hiệu quả" },
  { word: "curious", label: "Tò mò" },
];

function speak(text) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export default function DictionaryPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searchSource, setSearchSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [copiedWord, setCopiedWord] = useState(null);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Debounce query 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const saveRecent = useCallback((w) => {
    const trimmed = w.trim().toLowerCase();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed)].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Perform search
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setSearchedQuery("");
      setSearchSource("");
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    api
      .get("/words/search", {
        params: { q: debouncedQuery },
        signal: controller.signal,
      })
      .then((res) => {
        const data = res.data?.result || [];
        setResults(data);
        setSearchSource(res.data?.message || "");
        setSearchedQuery(debouncedQuery);
        if (data.length > 0) {
          saveRecent(debouncedQuery);
        }
      })
      .catch((err) => {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        setResults([]);
        setSearchedQuery(debouncedQuery);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, saveRecent]);

  const handleCopy = (word) => {
    navigator.clipboard?.writeText(word);
    setCopiedWord(word);
    setTimeout(() => setCopiedWord(null), 1800);
  };

  const handleSelectWord = (word) => {
    setQuery(word);
  };

  return (
    <MainLayout>
      <div className="w-full max-w-[880px] mx-auto py-2 sm:py-4">
        {/* Header */}
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Tra cứu từ điển
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tra cứu nhanh ngữ nghĩa, phát âm IPA, từ loại và nghe âm thanh chuẩn giọng bản xứ.
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="relative mb-6">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400 dark:text-gray-500 text-lg pointer-events-none">
              🔍
            </span>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập từ vựng cần tra (ví dụ: resilience, challenge, run...)"
              className="w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-800 text-base sm:text-lg font-bold text-gray-900 dark:text-white
                         placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-normal
                         focus:outline-none focus:border-[#58cc02] dark:focus:border-[#58cc02]
                         shadow-xs transition-all"
              autoFocus
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setSearchedQuery("");
                }}
                className="absolute right-4 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Lịch sử tra cứu gần đây */}
        {recentSearches.length > 0 && !query && (
          <div className="mb-6 p-4 rounded-3xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <span>🕒</span> Tra cứu gần đây
              </span>
              <button
                type="button"
                onClick={clearRecent}
                className="text-xs font-bold text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                Xóa lịch sử
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => handleSelectWord(word)}
                  className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-[#58cc02] hover:text-[#58cc02] dark:hover:text-[#58cc02] transition-all cursor-pointer active:scale-95"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Từ vựng gợi ý */}
        {!query && (
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
              <span>✨</span> Từ vựng gợi ý hôm nay
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SUGGESTED_WORDS.map((item) => (
                <button
                  key={item.word}
                  type="button"
                  onClick={() => handleSelectWord(item.word)}
                  className="p-3 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#58cc02] dark:hover:border-[#58cc02] text-left transition-all group cursor-pointer shadow-2xs active:scale-95"
                >
                  <p className="text-sm font-black text-gray-900 dark:text-white group-hover:text-[#58cc02] transition-colors truncate">
                    {item.word}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                    {item.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trạng thái Đang tải */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-9 h-9 border-3 border-[#58cc02] border-t-transparent rounded-full animate-spin mb-3 inline-block" />
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold">
              Đang tra cứu từ điển...
            </p>
          </div>
        )}

        {/* Không tìm thấy kết quả */}
        {!loading && searchedQuery && results.length === 0 && (
          <div className="p-8 rounded-3xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700/80 text-2xl flex items-center justify-center mx-auto mb-3">
              🔍
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">
              Không tìm thấy kết quả cho "{searchedQuery}"
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              Hãy kiểm tra lại chính tả hoặc thử tìm kiếm với dạng từ nguyên thể (ví dụ: <em>run</em> thay vì <em>running</em>).
            </p>
          </div>
        )}

        {/* Danh sách kết quả */}
        {!loading && results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Tìm thấy {results.length} kết quả
              </span>
              {searchSource && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#58cc02]/10 text-[#58cc02] border border-[#58cc02]/20">
                  {searchSource}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {results.map((item, idx) => {
                const isCopied = copiedWord === item.word;
                return (
                  <div
                    key={item.id ?? `${item.word}-${idx}`}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#58cc02] dark:hover:border-[#58cc02] shadow-xs hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-1.5">
                          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            {item.word}
                          </h2>

                          {item.pronunciation && (
                            <span className="text-xs sm:text-sm font-mono text-[#58cc02] font-bold px-2.5 py-0.5 rounded-lg bg-[#58cc02]/10 border border-[#58cc02]/20">
                              {item.pronunciation}
                            </span>
                          )}

                          {item.part_of_speech && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {item.part_of_speech}
                            </span>
                          )}

                          {item.isExternal && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              Online MW
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nút phát âm âm thanh */}
                      <button
                        type="button"
                        onClick={() => speak(item.word)}
                        aria-label={`Nghe phát âm từ ${item.word}`}
                        title="Nghe phát âm"
                        className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700/80 hover:bg-[#58cc02] text-gray-600 dark:text-gray-300 hover:text-white flex items-center justify-center text-xl shrink-0 transition-all active:scale-90 shadow-2xs cursor-pointer group-hover:bg-[#58cc02]/10 group-hover:text-[#58cc02]"
                      >
                        🔊
                      </button>
                    </div>

                    {/* Nghĩa tiếng Việt */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700 mb-4">
                      <p className="text-xs uppercase font-extrabold text-gray-400 dark:text-gray-500 mb-1">
                        Nghĩa tiếng Việt
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 leading-relaxed">
                        {item.meaning_vi}
                      </p>
                    </div>

                    {/* Các nút thao tác nhanh */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex-wrap">
                      <button
                        type="button"
                        onClick={() => speak(item.word)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/70 hover:bg-[#58cc02]/10 hover:text-[#58cc02] dark:hover:text-[#58cc02] transition-colors cursor-pointer"
                      >
                        <span>🔊</span>
                        <span>Nghe lại</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(item.word)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/70 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      >
                        <span>{isCopied ? "✓" : "📋"}</span>
                        <span>{isCopied ? "Đã sao chép!" : "Sao chép từ"}</span>
                      </button>

                      <Link
                        to="/review"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700/70 hover:bg-[#58cc02]/10 hover:text-[#58cc02] dark:hover:text-[#58cc02] transition-colors"
                      >
                        <span>🎴</span>
                        <span>Vào ôn tập từ vựng</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}