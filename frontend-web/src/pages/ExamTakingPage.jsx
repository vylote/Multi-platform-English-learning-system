import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import ExamLayout from "../layouts/ExamLayout";
import { getBackendTimezoneOffset } from "../utils/timezone";

export default function ExamTakingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .post(`/exams/${id}/start`)
      .then((res) => {
        if (!cancelled) setSession(res.data?.result);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.response?.data?.message || "Không thể bắt đầu bài thi.");
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleSelect = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleExit = async () => {
    if (!session) return navigate(-1);
    if (!window.confirm("Thoát sẽ hủy phiên làm bài hiện tại. Bạn có chắc chắn?")) return;

    try {
      await api.post(`/exams/${id}/cancel`, { session_id: session.session_id });
    } catch (error) {
      console.log("Lỗi hủy phiên:", error);
    } finally {
      navigate(`/learn/exams/${id}`);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!session || submitting) return;
    setSubmitting(true);

    const answerList = Object.entries(answers).map(([question_id, selected_option]) => ({
      question_id: Number(question_id),
      selected_option,
    }));

    try {
      const response = await api.post(`/exams/${id}/submit`, {
        session_id: session.session_id,
        answers: answerList,
        timezone_offset: getBackendTimezoneOffset(),
      });
      setResult(response.data?.result);
    } catch (error) {
      setLoadError(error.response?.data?.message || "Không thể nộp bài, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }, [session, answers, submitting, id]);

  if (loadError && !session) {
    return (
      <ExamLayout title="Lỗi" onExit={() => navigate(-1)}>
        <p className="text-sm text-red-500 dark:text-red-400 py-10 text-center">{loadError}</p>
      </ExamLayout>
    );
  }
  if (!session && !result) {
    return (
      <ExamLayout title="Đang chuẩn bị...">
        <p className="text-sm text-gray-400 dark:text-gray-500 py-10 text-center">Đang tải câu hỏi...</p>
      </ExamLayout>
    );
  }

  if (result) {
    return (
      <ExamLayout title="Kết quả bài thi" onExit={() => navigate(`/learn/exams/${id}`)}>
        <div className="max-w-[720px] mx-auto py-8">
          <div className="text-center mb-8">
            <p className="text-5xl font-extrabold text-[#58cc02] mb-2">{result.score}/10</p>
            <p className="text-gray-500 dark:text-gray-400">
              Đúng {result.correct_count}/{result.total_questions} câu · {Math.floor(result.time_spent / 60)} phút {result.time_spent % 60} giây
            </p>
          </div>

          <div className="space-y-3">
            {result.review.map((item, index) => (
              <div
                key={item.question_id}
                className={`p-4 rounded-xl border-2 ${
                  item.is_correct ? "border-[#58cc02]/30 bg-[#58cc02]/5" : "border-red-300/50 bg-red-50 dark:bg-red-900/10"
                }`}
              >
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  Câu {index + 1}: {item.question_text}
                </p>
                <div className="text-sm space-y-1">
                  {["A", "B", "C", "D"].map((opt) => {
                    const text = item[`option_${opt.toLowerCase()}`];
                    const isCorrectOpt = opt === item.correct_option;
                    const isSelectedOpt = opt === item.selected_option;
                    return (
                      <p
                        key={opt}
                        className={
                          isCorrectOpt ? "text-[#58cc02] font-semibold" : isSelectedOpt ? "text-red-500 font-semibold" : "text-gray-500 dark:text-gray-400"
                        }
                      >
                        {opt}. {text} {isCorrectOpt && "✓"} {isSelectedOpt && !isCorrectOpt && "✗"}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ExamLayout>
    );
  }

  const { questions } = session;
  const answeredCount = Object.keys(answers).length;

  return (
    <ExamLayout title="Đang làm bài" onExit={handleExit}>
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} id={`q${q.id}`} className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
              <p className="font-semibold text-gray-900 dark:text-white mb-3">Câu {index + 1}. {q.question_text}</p>
              <div className="space-y-2">
                {["A", "B", "C", "D"].map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[q.id] === opt ? "border-[#58cc02] bg-[#58cc02]/5" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <input type="radio" name={`q${q.id}`} checked={answers[q.id] === opt} onChange={() => handleSelect(q.id, opt)} className="accent-[#58cc02]" />
                    <span>{opt}. {q[`option_${opt.toLowerCase()}`]}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-[#58cc02] hover:bg-[#4cb001] disabled:opacity-50 transition-colors"
          >
            {submitting ? "Đang nộp bài..." : `NỘP BÀI (${answeredCount}/${questions.length})`}
          </button>

          {loadError && <p className="text-sm text-red-500 dark:text-red-400 text-center">{loadError}</p>}
        </div>

        <aside className="hidden lg:block w-[220px] shrink-0 sticky top-20">
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">Danh sách câu hỏi</h3>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, index) => (
                <a
                  key={q.id}
                  href={`#q${q.id}`}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium border ${
                    answers[q.id] ? "bg-[#58cc02] border-[#58cc02] text-white" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {index + 1}
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </ExamLayout>
  );
}