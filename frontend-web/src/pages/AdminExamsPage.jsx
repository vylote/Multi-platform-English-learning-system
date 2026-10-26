import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Sparkles,
  BookOpen,
  Layers,
  RotateCw,
  Search,
  Trash2,
  Eye,
  AlertTriangle,
  X,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  FileText,
} from "lucide-react";

import api from "../api/api";
import AdminLayout from "../layouts/AdminLayout";

export default function AdminExamsPage() {
  const [topics, setTopics] = useState([]);
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [filterTopic, setFilterTopic] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");

  // State xem chi tiết câu hỏi
  const [selectedExamDetail, setSelectedExamDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // State xóa đề thi
  const [examToDelete, setExamToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load danh mục chủ đề khi vào trang
  useEffect(() => {
    fetchTopics();
  }, []);

  // Load danh sách đề thi khi search/filter thay đổi
  useEffect(() => {
    fetchExams(1);
  }, [filterTopic, filterType]);

  const fetchTopics = async () => {
    try {
      const res = await api.get("/admin/topics");
      setTopics(res.data?.result || []);
    } catch (_) {}
  };

  const fetchExams = async (targetPage = 1) => {
    try {
      setLoadingExams(true);
      const res = await api.get("/admin/exams", {
        params: {
          page: targetPage,
          limit: 10,
          search: search.trim() || undefined,
          topicId: filterTopic !== "ALL" ? filterTopic : undefined,
          examType: filterType !== "ALL" ? filterType : undefined,
        },
      });

      const data = res.data?.result;
      setExams(data?.exams || []);
      setPagination(
        data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 },
      );
    } catch (err) {
      toast.error("Lỗi khi tải danh sách đề thi.");
    } finally {
      setLoadingExams(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExams(1);
  };

  // Xem chi tiết câu hỏi của một đề
  const handleViewExamDetail = async (examId) => {
    try {
      setLoadingDetail(true);
      setSelectedExamDetail(null);
      const res = await api.get(`/admin/exams/${examId}`);
      setSelectedExamDetail(res.data?.result);
    } catch (err) {
      toast.error("Không thể tải chi tiết câu hỏi của đề thi.");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Xóa đề thi
  const confirmDeleteExam = async () => {
    if (!examToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/exams/${examToDelete.id}`);
      toast.success(`Đã xóa đề thi "${examToDelete.title}" thành công.`);
      setExamToDelete(null);
      fetchExams(pagination.page);
    } catch (err) {
      toast.error("Xóa đề thi thất bại.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 pb-12">
        {/* HEADER: TITLE + ACTION NÚT "SINH ĐỀ THI MỚI" */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Quản lý Đề Thi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
              Danh sách đề thi hệ thống
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Xem toàn bộ các bộ đề thi trắc nghiệm đã tạo, kiểm tra câu hỏi hoặc khởi tạo đề mới.
            </p>
          </div>

          {/* NÚT ĐI TỚI TRANG SINH ĐỀ */}
          <Link
            to="/admin/exams/generate"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-purple-600/30 border-b-4 border-purple-900 active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Sinh đề thi mới</span>
          </Link>
        </div>

        {/* BẢNG QUẢN LÝ TẤT CẢ ĐỀ THI */}
        <div className="rounded-3xl border-2 border-[#d5cdbd] dark:border-gray-800 bg-[#f4efe4] dark:bg-[#18232c] p-5 sm:p-7 shadow-lg flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-gray-950 dark:text-white">
                Tất cả đề thi ({pagination.total})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Tìm kiếm và lọc đề thi theo chủ đề hoặc loại đề
              </p>
            </div>

            {/* BỘ LỌC VÀ TÌM KIẾM */}
            <div className="flex flex-wrap items-center gap-2.5">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Tìm theo tên đề thi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 rounded-xl border border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold outline-none focus:border-purple-600 text-gray-900 dark:text-white"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </form>

              {/* Lọc theo Topic */}
              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả chủ đề</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>

              {/* Lọc theo Loại đề */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả loại đề</option>
                <option value="TOPIC">Đề theo chủ đề</option>
                <option value="PLACEMENT">Placement Test</option>
              </select>

              <button
                type="button"
                onClick={() => fetchExams(pagination.page)}
                title="Làm mới danh sách"
                className="p-2 rounded-xl border border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-600 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto rounded-2xl border border-[#d5cdbd] dark:border-gray-800 bg-white dark:bg-gray-900">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#d5cdbd] dark:border-gray-800 bg-[#ede8dc]/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 uppercase font-black tracking-wider text-[11px]">
                  <th className="py-3 px-4">Mã Đề</th>
                  <th className="py-3 px-4">Tiêu đề đề thi</th>
                  <th className="py-3 px-4">Chủ đề</th>
                  <th className="py-3 px-4">Loại đề</th>
                  <th className="py-3 px-4">Số câu</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d5cdbd]/60 dark:divide-gray-800 text-gray-800 dark:text-gray-200 font-bold">
                {loadingExams ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <RotateCw className="w-4 h-4 animate-spin text-purple-600" />
                        <span>Đang tải danh sách đề thi...</span>
                      </div>
                    </td>
                  </tr>
                ) : exams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-gray-400 stroke-[1.5]" />
                        <span>Chưa có đề thi nào phù hợp với bộ lọc.</span>
                        <Link
                          to="/admin/exams/generate"
                          className="mt-2 text-xs font-black text-purple-600 hover:underline inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Sinh đề thi mới ngay</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  exams.map((exam) => (
                    <tr
                      key={exam.id}
                      className="hover:bg-purple-500/5 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-purple-700 dark:text-purple-400 font-black">
                        #{exam.id}
                      </td>
                      <td className="py-3 px-4 font-black text-gray-950 dark:text-white">
                        {exam.title}
                      </td>
                      <td className="py-3 px-4">
                        {exam.topic_title ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-black bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            {exam.topic_title}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-black ${
                            exam.exam_type === "PLACEMENT"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                              : "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30"
                          }`}
                        >
                          {exam.exam_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                          {exam.question_count || 0} câu
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black">
                        {exam.duration} phút
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-[11px]">
                        {new Date(exam.created_at).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Nút xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => handleViewExamDetail(exam.id)}
                            title="Xem chi tiết câu hỏi"
                            className="p-1.5 rounded-lg border border-[#d5cdbd] dark:border-gray-700 hover:border-purple-600 hover:bg-purple-500/10 text-purple-700 dark:text-purple-400 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút xóa */}
                          <button
                            type="button"
                            onClick={() => setExamToDelete(exam)}
                            title="Xóa đề thi"
                            className="p-1.5 rounded-lg border border-rose-300 dark:border-rose-800/60 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-500">
                Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} đề)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchExams(pagination.page - 1)}
                  className="px-3 py-1.5 rounded-xl border border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Trước</span>
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchExams(pagination.page + 1)}
                  className="px-3 py-1.5 rounded-xl border border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <span>Sau</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT CÂU HỎI CỦA ĐỀ THI */}
      {selectedExamDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-3xl w-full max-h-[85vh] rounded-3xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-[#f4efe4] dark:bg-[#18232c] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#d5cdbd] dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center">
                  <FileQuestion className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-950 dark:text-white">
                    {selectedExamDetail.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    ID #{selectedExamDetail.id} • {selectedExamDetail.questions?.length || 0} câu hỏi trắc nghiệm • {selectedExamDetail.duration} phút
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedExamDetail(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: List of Questions */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {selectedExamDetail.questions?.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-4 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-800 bg-white dark:bg-gray-900"
                >
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-700 dark:text-purple-400 font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-black text-gray-900 dark:text-white leading-relaxed">
                      {q.question_text}
                    </p>
                  </div>

                  {/* 4 Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {[
                      { key: "A", text: q.option_a },
                      { key: "B", text: q.option_b },
                      { key: "C", text: q.option_c },
                      { key: "D", text: q.option_d },
                    ].map((opt) => {
                      const isCorrect = q.correct_option === opt.key;
                      return (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                            isCorrect
                              ? "bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-black"
                              : "border-[#d5cdbd]/60 dark:border-gray-800 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{opt.key}.</span>
                            <span>{opt.text}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                              Đúng
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#d5cdbd] dark:border-gray-800 flex justify-end bg-white dark:bg-gray-900">
              <button
                type="button"
                onClick={() => setSelectedExamDetail(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-black uppercase text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA ĐỀ THI */}
      {examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-[#f4efe4] dark:bg-[#18232c] p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-gray-950 dark:text-white">
                Xác nhận xóa đề thi?
              </h3>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
              Bạn có chắc chắn muốn xóa vĩnh viễn đề thi{" "}
              <strong className="text-gray-900 dark:text-white">
                "{examToDelete.title}" (ID #{examToDelete.id})
              </strong>
              ? Toàn bộ các câu hỏi trắc nghiệm và phiên làm bài liên quan của học viên sẽ bị xóa.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setExamToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#d5cdbd] dark:border-gray-700 text-xs font-black uppercase text-gray-700 dark:text-gray-300 hover:bg-black/5 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteExam}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
