import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Bot,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Loader2,
  BookOpen,
} from "lucide-react";
import api from "../api/api";

export default function ExamAiFeedback({ sessionId, className = "" }) {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  const isMountedRef = useRef(true);
  const timerRef = useRef(null);

  const fetchFeedback = async (currentPoll = 0) => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(`/exams/sessions/${sessionId}/ai-feedback`);
      const data = res.data?.result;

      if (!isMountedRef.current) return;

      if (data && data.status !== "PROCESSING") {
        setFeedback(data);
        setLoading(false);
        setError(null);
        return;
      }

      // Vẫn đang ở trạng thái PROCESSING qua hàng đợi Kafka
      if (currentPoll < 15) {
        setPollCount(currentPoll + 1);
        timerRef.current = setTimeout(() => {
          fetchFeedback(currentPoll + 1);
        }, 2000);
      } else {
        setLoading(false);
        setFeedback({
          status: "TIMEOUT",
          summary: "Hệ thống hàng đợi AI đang có nhiều yêu cầu xử lý. Bạn có thể nhấn 'Thử lại' để kiểm tra kết quả mới nhất.",
        });
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setLoading(false);
      setError(
        err.response?.data?.message || "Không thể kết nối đến máy chủ AI."
      );
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    setLoading(true);
    setError(null);
    setPollCount(0);

    fetchFeedback(0);

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [sessionId]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setPollCount(0);
    fetchFeedback(0);
  };

  if (!sessionId) return null;

  // Trạng thái đang tải / AI đang phân tích
  if (loading) {
    return (
      <div
        className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 dark:from-indigo-950/20 dark:via-gray-800 dark:to-purple-950/20 border-2 border-indigo-200/80 dark:border-indigo-800/60 shadow-sm text-left ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                  Trợ lý AI đang phân tích bài thi...
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Kafka Queue
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Đang tổng hợp các lỗi sai và xây dựng lộ trình cải thiện cá nhân hóa
                {pollCount > 1 ? ` (${pollCount * 2}s)` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Shimmer skeleton */}
        <div className="space-y-2.5 pt-2">
          <div className="h-4 bg-indigo-100/70 dark:bg-gray-700/60 rounded-full w-5/6 animate-pulse" />
          <div className="h-4 bg-indigo-100/50 dark:bg-gray-700/40 rounded-full w-4/6 animate-pulse" />
          <div className="h-4 bg-indigo-100/30 dark:bg-gray-700/20 rounded-full w-3/6 animate-pulse" />
        </div>
      </div>
    );
  }

  // Trạng thái gặp lỗi hoặc Timeout
  if (error || feedback?.status === "TIMEOUT") {
    return (
      <div
        className={`p-6 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-left ${className}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                Chưa nhận được phản hồi AI
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                {error || feedback?.summary || "Yêu cầu phân tích đang xếp hàng trong hệ thống."}
              </p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 hover:bg-amber-50 cursor-pointer transition-all shadow-2xs"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!feedback) return null;

  const isPerfect = feedback.status === "PERFECT";
  const recommendations = feedback.recommendations || [];

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-white dark:bg-gray-800 border-2 border-indigo-200/90 dark:border-indigo-800/80 shadow-md text-left transition-all ${className}`}
    >
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                Đánh Giá & Lời Khuyên Từ AI
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Phân tích tự động từ kết quả bài làm qua sự kiện ngầm Kafka
            </p>
          </div>
        </div>

        {/* Provider Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Bot className="w-3.5 h-3.5" />
          <span>{feedback.provider || "Groq AI"}</span>
        </div>
      </div>

      {/* Main Feedback Summary */}
      <div className="relative z-10 mb-4 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
          {feedback.summary}
        </p>
      </div>

      {/* Common Mistakes & Traps (if present) */}
      {feedback.commonMistakes && (
        <div className="relative z-10 mb-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-1">
                Lỗi sai thường gặp & Bẫy ngữ pháp
              </span>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {feedback.commonMistakes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations / Actionable next steps */}
      {recommendations.length > 0 && (
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2.5">
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              {isPerfect ? "Gợi ý nâng cao" : "Lộ trình ôn tập gợi ý"}
            </h4>
          </div>

          <div className="space-y-2">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60 text-xs sm:text-sm text-gray-700 dark:text-gray-300"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 font-medium leading-relaxed">
                  {rec}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


