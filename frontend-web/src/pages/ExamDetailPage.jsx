import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import MainLayout from "../layouts/MainLayout";

export default function ExamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
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
        <p className="text-sm text-red-500 dark:text-red-400 py-10 text-center">{loadError}</p>
      </MainLayout>
    );
  }
  if (!exam) {
    return (
      <MainLayout>
        <p className="text-sm text-gray-400 dark:text-gray-500 py-10 text-center">Đang tải...</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[640px] mx-auto py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{exam.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8">
          <span>⏰ {exam.duration} phút</span>
          <span>✏️ {exam.question_count} câu hỏi</span>
        </div>

        <button
          onClick={() => navigate(`/learn/exams/${id}/take`)}
          className="w-full py-3.5 rounded-xl font-bold text-white bg-[#58cc02] hover:bg-[#4cb001] transition-colors"
        >
          BẮT ĐẦU LÀM BÀI
        </button>
      </div>
    </MainLayout>
  );
}