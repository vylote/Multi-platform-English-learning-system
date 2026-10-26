import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Sparkles,
  BookOpen,
  ArrowLeft,
  RotateCw,
  Eye,
  CheckCircle2,
  Cpu,
  Layers,
  FileQuestion,
  X,
  ListOrdered,
} from "lucide-react";

import api from "../api/api";
import AdminLayout from "../layouts/AdminLayout";

export default function AdminExamGeneratePage() {
  const navigate = useNavigate();

  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const [form, setForm] = useState({
    examType: "TOPIC", // 'TOPIC' | 'PLACEMENT'
    topicId: "",
    title: "",
    count: 10,
    duration: 15,
    method: "AUTO", // 'AUTO' | 'AI' | 'DATABASE'
  });

  const [generating, setGenerating] = useState(false);
  const [recentGeneratedExam, setRecentGeneratedExam] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setLoadingTopics(true);
      const res = await api.get("/admin/topics");
      const list = res.data?.result || [];
      setTopics(list);
      if (list.length > 0 && !form.topicId) {
        setForm((prev) => ({ ...prev, topicId: String(list[0].id) }));
      }
    } catch (_) {
      toast.error("Không thể tải danh mục chủ đề.");
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (form.examType === "TOPIC" && !form.topicId) {
      toast.error("Vui lòng chọn một chủ đề để sinh đề thi.");
      return;
    }

    try {
      setGenerating(true);
      setRecentGeneratedExam(null);

      const payload = {
        examType: form.examType,
        topicId: form.examType === "TOPIC" ? form.topicId : null,
        title: form.title.trim() || undefined,
        count: parseInt(form.count, 10),
        duration: parseInt(form.duration, 10),
        method: form.method,
      };

      const res = await api.post("/admin/exams/generate", payload);
      const generated = res.data?.result;

      toast.success(`Đã sinh thành công đề thi "${generated.title}"!`);
      setRecentGeneratedExam(generated);
      setShowPreviewModal(true);

      // Reset tiêu đề
      setForm((prev) => ({ ...prev, title: "" }));
    } catch (err) {
      const msg = err.response?.data?.message || "Sinh đề thi thất bại. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 pb-12 max-w-5xl mx-auto">
        {/* HEADER: TITLE + NÚT "XEM DANH SÁCH ĐỀ THI" */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>Exam Generator Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
              Khởi tạo đề thi trắc nghiệm mới
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Nhập các thông số mong muốn và chọn động cơ sinh câu hỏi (AI Groq hoặc kho từ vựng Database).
            </p>
          </div>

          {/* NÚT VỀ DANH SÁCH ĐỀ THI */}
          <Link
            to="/admin/exams"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 hover:border-purple-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <ListOrdered className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Xem danh sách đề thi</span>
          </Link>
        </div>

        {/* THÔNG BÁO VỪA SINH THÀNH CÔNG */}
        {recentGeneratedExam && (
          <div className="p-5 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-emerald-900 dark:text-emerald-300">
                  Đã sinh xong: {recentGeneratedExam.title} (ID #{recentGeneratedExam.id})
                </h3>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
                  Gồm {recentGeneratedExam.questionCount} câu hỏi • Thời gian {recentGeneratedExam.duration} phút • Nguồn: {recentGeneratedExam.generationSource}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem câu hỏi vừa tạo</span>
              </button>

              <Link
                to="/admin/exams"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-600/40 hover:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>Tới danh sách đề →</span>
              </Link>
            </div>
          </div>
        )}

        {/* FORM THÔNG SỐ SINH ĐỀ */}
        <div className="rounded-3xl border-2 border-[#d5cdbd] dark:border-gray-800 bg-[#f4efe4] dark:bg-[#18232c] p-6 sm:p-8 shadow-lg">
          <form onSubmit={handleGenerate} className="flex flex-col gap-6">
            {/* Hàng 1: Loại đề & Chọn chủ đề */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Loại đề */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  1. Loại đề thi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, examType: "TOPIC" }))}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      form.examType === "TOPIC"
                        ? "bg-purple-600 text-white border-purple-700 shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-[#d5cdbd] dark:border-gray-700 hover:border-purple-500"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Theo chủ đề</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, examType: "PLACEMENT" }))}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      form.examType === "PLACEMENT"
                        ? "bg-purple-600 text-white border-purple-700 shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-[#d5cdbd] dark:border-gray-700 hover:border-purple-500"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Placement Test</span>
                  </button>
                </div>
              </div>

              {/* Chọn chủ đề */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  2. Chủ đề bài thi {form.examType === "PLACEMENT" && "(Tự động trộn mẫu theo độ khó)"}
                </label>
                {form.examType === "TOPIC" ? (
                  <select
                    value={form.topicId}
                    onChange={(e) => setForm((p) => ({ ...p, topicId: e.target.value }))}
                    disabled={loadingTopics}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-xs outline-none focus:border-purple-600 transition-all cursor-pointer shadow-2xs"
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id}. {t.title} {t.difficulty ? `(${t.difficulty})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-3 rounded-2xl border-2 border-dashed border-[#d5cdbd] dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-xs font-bold text-gray-500 dark:text-gray-400">
                    Hệ thống sẽ tự động trộn đều câu hỏi theo 3 mức độ: BEGINNER, INTERMEDIATE và ADVANCED.
                  </div>
                )}
              </div>
            </div>

            {/* Hàng 2: Tiêu đề tùy chọn & Động cơ sinh */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Tiêu đề đề thi */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  3. Tiêu đề đề thi (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder={
                    form.examType === "TOPIC"
                      ? "VD: Đề thi thử số 1: Công nghệ thông tin..."
                      : "Bài kiểm tra đầu vào (Placement Test)"
                  }
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 font-bold text-xs outline-none focus:border-purple-600 transition-all shadow-2xs"
                />
              </div>

              {/* Động cơ sinh câu hỏi */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  4. Động cơ sinh câu hỏi (Engine)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "AUTO", label: "⚡ Tự động", desc: "AI ưu tiên, DB dự phòng" },
                    { id: "AI", label: "🤖 AI (Groq)", desc: "Ngữ cảnh đề tự nhiên" },
                    { id: "DATABASE", label: "📚 Kho từ DB", desc: "Cực nhanh, offline" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, method: m.id }))}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                        form.method === m.id
                          ? "bg-purple-600 text-white border-purple-700 shadow-sm"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-[#d5cdbd] dark:border-gray-700 hover:border-purple-500"
                      }`}
                    >
                      <span className="text-xs font-black">{m.label}</span>
                      <span className={`text-[10px] mt-0.5 ${form.method === m.id ? "text-purple-200" : "text-gray-400"}`}>
                        {m.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hàng 3: Số câu hỏi & Thời gian làm bài */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Số câu hỏi */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  5. Số lượng câu hỏi trắc nghiệm
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[5, 10, 15, 20, 30].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, count: num }))}
                      className={`py-2 rounded-xl border-2 font-black text-xs transition-all cursor-pointer ${
                        Number(form.count) === num
                          ? "bg-purple-600 text-white border-purple-700 shadow-sm"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-[#d5cdbd] dark:border-gray-700 hover:border-purple-500"
                      }`}
                    >
                      {num} câu
                    </button>
                  ))}
                </div>
              </div>

              {/* Thời gian làm bài */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  6. Thời gian làm bài (Phút)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[10, 15, 20, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, duration: mins }))}
                      className={`py-2 rounded-xl border-2 font-black text-xs transition-all cursor-pointer ${
                        Number(form.duration) === mins
                          ? "bg-purple-600 text-white border-purple-700 shadow-sm"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-[#d5cdbd] dark:border-gray-700 hover:border-purple-500"
                      }`}
                    >
                      {mins} phút
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hàng 4: Nút Submit sinh đề + Nút đi xem đề thi */}
            <div className="pt-3 border-t border-[#d5cdbd] dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
              <button
                type="submit"
                disabled={generating}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-black text-sm uppercase tracking-wider shadow-md shadow-purple-600/30 border-b-4 border-purple-900 active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Đang khởi tạo câu hỏi trắc nghiệm...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Sinh đề thi mới ngay</span>
                  </>
                )}
              </button>

              <Link
                to="/admin/exams"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <span>Xem toàn bộ đề thi hiện có →</span>
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT CÂU HỎI VỪA TẠO */}
      {showPreviewModal && recentGeneratedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-3xl w-full max-h-[85vh] rounded-3xl border-2 border-[#d5cdbd] dark:border-gray-700 bg-[#f4efe4] dark:bg-[#18232c] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#d5cdbd] dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                  <FileQuestion className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-950 dark:text-white">
                    {recentGeneratedExam.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    ID #{recentGeneratedExam.id} • {recentGeneratedExam.questions?.length || 0} câu hỏi trắc nghiệm • {recentGeneratedExam.duration} phút
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: List of Questions */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {recentGeneratedExam.questions?.map((q, idx) => (
                <div
                  key={idx}
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
            <div className="p-4 border-t border-[#d5cdbd] dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  navigate("/admin/exams");
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
              >
                Đi đến danh sách đề thi
              </button>

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-black uppercase text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
