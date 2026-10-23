import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";
import MainLayout from "../layouts/MainLayout";
import { getReturnTo, withReturnTo } from "../utils/navigation";

export default function ExamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = getReturnTo(searchParams);

  const [exam, setExam] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api
      .get(`/exams/${id}`, { signal: controller.signal })
      .then((res) => setExam(res.data?.result))
      .catch((error) => {
        if (error.code === "ERR_CANCELED") return;
        setLoadError(error.response?.data?.message || "Không tìm thấy đề thi.");
      });
    return () => controller.abort();
  }, [id]);

  if (loadError && !exam) {
    return (
      <MainLayout>
        <div className="max-w-xl mx-auto py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/40 text-red-500 mx-auto flex items-center justify-center text-3xl mb-4 border border-red-200 dark:border-red-800">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Đã xảy ra lỗi</h2>
          <p className="text-sm text-red-500 dark:text-red-400 mb-6">{loadError}</p>
          <button
            onClick={() => navigate(returnTo || "/exams")}
            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ← Quay lại danh sách
          </button>
        </div>
      </MainLayout>
    );
  }

  if (!exam) {
    return (
      <MainLayout>
        <div className="py-24 text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#58cc02] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Đang tải thông tin đề thi...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* STICKY TOP NAVIGATION BAR */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-white/85 dark:bg-gray-900/85 -mt-4 sm:-mt-6 md:-mt-8 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3.5 border-b border-gray-200/60 dark:border-gray-800/80 mb-6 flex items-center justify-between gap-4 transition-all shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(returnTo || "/exams")}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100/90 dark:bg-gray-800/90 hover:bg-gray-200/90 dark:hover:bg-gray-700 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs transition-all cursor-pointer group active:scale-95 shrink-0"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            <span>{returnTo ? "Quay lại" : "Danh sách đề thi"}</span>
          </button>

          <span className="text-gray-300 dark:text-gray-700 font-light hidden sm:inline">/</span>

          <span className="text-sm font-bold text-gray-900 dark:text-white truncate hidden sm:inline max-w-[320px]">
            {exam.title}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/60">
            ⏱ {exam.duration} phút • {exam.question_count || 10} câu
          </span>
          <button
            onClick={() => navigate(withReturnTo(`/exams/${id}/take`, returnTo))}
            className="px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#58cc02] hover:bg-[#4cb001] active:scale-95 shadow-xs shadow-[#58cc02]/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Vào thi ngay</span>
            <span>→</span>
          </button>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto pb-12 text-left">

        {/* HERO BRIEFING CARD */}
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-3xl p-6 sm:p-10 shadow-sm overflow-hidden relative">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-3xl shadow-xs shrink-0">
              📝
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                {exam.title}
              </h1>
            </div>
          </div>

          {/* Test Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="p-4 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700 text-center">
              <span className="text-2xl block mb-1">⏱</span>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Thời gian</div>
              <div className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                {exam.duration} phút
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700 text-center">
              <span className="text-2xl block mb-1">✏️</span>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Số câu hỏi</div>
              <div className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                {exam.question_count || 10} câu
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700 text-center">
              <span className="text-2xl block mb-1">🎯</span>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Hình thức</div>
              <div className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                Trắc nghiệm
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-100/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-700 text-center">
              <span className="text-2xl block mb-1">🏆</span>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Thang điểm</div>
              <div className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                10.0
              </div>
            </div>
          </div>

          {/* Exam Rules & Instructions */}
          <div className="p-5 rounded-2xl bg-[#58cc02]/5 dark:bg-[#58cc02]/10 border border-[#58cc02]/20 mb-8">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>💡</span> Lưu ý và hướng dẫn làm bài:
            </h3>
            <ul className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#58cc02] font-bold">•</span>
                <span>Thời gian đếm ngược sẽ bắt đầu chạy ngay khi bạn nhấn <strong>Bắt đầu làm bài</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#58cc02] font-bold">•</span>
                <span>Hệ thống tự động lưu các câu trả lời bạn chọn; bạn có thể chuyển qua lại giữa các câu để sửa trước khi nộp.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#58cc02] font-bold">•</span>
                <span>Khi hết thời gian quy định, bài thi sẽ được tự động nộp và chấm điểm ngay lập tức.</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => navigate(withReturnTo(`/exams/${id}/take`, returnTo))}
            className="w-full py-4 px-6 rounded-2xl font-extrabold text-base sm:text-lg text-white bg-[#58cc02] hover:bg-[#4cb001] shadow-md shadow-[#58cc02]/25 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>🚀 BẮT ĐẦU LÀM BÀI THI NGAY</span>
            <span className="text-xl">→</span>
          </button>
        </div>
      </div>
    </MainLayout>
  );
}