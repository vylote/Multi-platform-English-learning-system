import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";
import ExamLayout from "../layouts/ExamLayout";
import { getBackendTimezoneOffset } from "../utils/timezone";
import { getReturnTo } from "../utils/navigation";

const PAGE_SIZE = 10;
const resultCacheKey = (examId) => `exam_result_${examId}`;

const readCachedResult = (examId) => {
  try {
    const raw = sessionStorage.getItem(resultCacheKey(examId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCachedResult = (examId, result) => {
  try {
    sessionStorage.setItem(resultCacheKey(examId), JSON.stringify(result));
  } catch {
    // sessionStorage đầy hoặc bị chặn -> bỏ qua, không critical
  }
};

const clearCachedResult = (examId) => {
  sessionStorage.removeItem(resultCacheKey(examId));
};

export default function ExamTakingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = getReturnTo(searchParams);

  const [sessionInfo, setSessionInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [answers, setAnswers] = useState({});
  const [visitedQuestionIds, setVisitedQuestionIds] = useState({});
  const [loadError, setLoadError] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(() => readCachedResult(id));

  const [timeLeft, setTimeLeft] = useState(null);
  const timerIntervalRef = useRef(null);
  const resultRef = useRef(null);
  const handleSubmitRef = useRef(null);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const applyPageData = useCallback((pageData) => {
    setCurrentPage(pageData);
    if (pageData?.data) {
      setVisitedQuestionIds((prev) => ({
        ...prev,
        [pageData.currentPage]: pageData.data.map((q) => q.id),
      }));
    }
  }, []);

  useEffect(() => {
    if (result) return;
    let cancelled = false;

    api
      .post(`/exams/${id}/start`, null, {
        params: { page: 1, pageSize: PAGE_SIZE },
      })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.result;
        setSessionInfo({
          session_id: data.session_id,
          started_at: data.started_at,
          duration: data.duration,
        });
        applyPageData(data.questions);
      })
      .catch((error) => {
        if (!cancelled)
          setLoadError(
            error.response?.data?.message || "Không thể bắt đầu bài thi.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [id, applyPageData, result]);

  useEffect(() => {
    if (!sessionInfo) return;

    const deadline =
      new Date(sessionInfo.started_at).getTime() +
      sessionInfo.duration * 60 * 1000;

    const tick = () => {
      if (resultRef.current) {
        clearInterval(timerIntervalRef.current);
        return;
      }

      const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerIntervalRef.current);
        handleSubmitRef.current(true);
      }
    };

    tick();
    timerIntervalRef.current = setInterval(tick, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [sessionInfo]);

  function formatTime(totalSeconds) {
    if (totalSeconds == null) return "--:--";
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  useEffect(() => {
    if (!sessionInfo) return;

    const cancelViaBeacon = () => {
      const url = `${api.defaults.baseURL}/exams/${id}/cancel`;
      const payload = new Blob(
        [JSON.stringify({ session_id: sessionInfo.session_id })],
        { type: "application/json" },
      );
      navigator.sendBeacon(url, payload);
    };

    const handlePageHide = () => {
      if (!result) cancelViaBeacon();
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [sessionInfo, result, id]);

  useEffect(() => {
    return () => {
      if (sessionInfo && !result) {
        api
          .post(`/exams/${id}/cancel`, { session_id: sessionInfo.session_id })
          .catch(() => {});
      }
    };
  }, [sessionInfo, result, id]);

  const handleSelect = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleExit = async () => {
    if (!sessionInfo) return navigate(-1);
    if (
      !window.confirm("Thoát sẽ hủy phiên làm bài hiện tại. Bạn có chắc chắn?")
    )
      return;

    try {
      await api.post(`/exams/${id}/cancel`, {
        session_id: sessionInfo.session_id,
      });
    } catch (error) {
      console.log("Lỗi hủy phiên:", error);
    } finally {
      // Khi hủy thi ngang, ưu tiên quay lại LearningPath hoặc trang trước đó
      navigate(returnTo || `/exams/${id}`);
    }
  };

  const goToPage = useCallback(
    async (pageNumber) => {
      if (!sessionInfo || pageLoading) return;
      if (currentPage && pageNumber === currentPage.currentPage) return;

      setPageLoading(true);
      setLoadError("");

      try {
        const res = await api.get(`/exams/${id}/questions`, {
          params: {
            session_id: sessionInfo.session_id,
            page: pageNumber,
            pageSize: PAGE_SIZE,
          },
        });
        applyPageData(res.data?.result);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        setLoadError(
          error.response?.data?.message || "Không thể tải trang câu hỏi.",
        );
      } finally {
        setPageLoading(false);
      }
    },
    [sessionInfo, currentPage, pageLoading, id, applyPageData],
  );

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (!sessionInfo || submitting) return;

      const totalElements = currentPage?.totalElements ?? 0;
      const answeredCount = Object.keys(answers).length;

      if (!auto && answeredCount < totalElements) {
        const confirmed = window.confirm(
          `Bạn đã trả lời ${answeredCount}/${totalElements} câu.\n\nBạn có chắc muốn nộp bài?`,
        );
        if (!confirmed) return;
      }

      setSubmitting(true);
      const answerList = Object.entries(answers).map(
        ([question_id, selected_option]) => ({
          question_id: Number(question_id),
          selected_option,
        }),
      );

      try {
        const response = await api.post(`/exams/${id}/submit`, {
          session_id: sessionInfo.session_id,
          answers: answerList,
          timezone_offset: getBackendTimezoneOffset(),
        });
        setResult(response.data?.result);
        writeCachedResult(id, response.data?.result);
      } catch (error) {
        setLoadError(
          error.response?.data?.message ||
            "Không thể nộp bài, vui lòng thử lại.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [sessionInfo, answers, submitting, id, currentPage],
  );

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  if (loadError && !sessionInfo) {
    return (
      <ExamLayout title="Lỗi" onExit={() => navigate(-1)}>
        <p className="text-sm text-red-500 dark:text-red-400 py-10 text-center">
          {loadError}
        </p>
      </ExamLayout>
    );
  }
  if (!sessionInfo && !result) {
    return (
      <ExamLayout title="Đang chuẩn bị...">
        <p className="text-sm text-gray-400 dark:text-gray-500 py-10 text-center">
          Đang tải câu hỏi...
        </p>
      </ExamLayout>
    );
  }

  // --- MÀN HÌNH KẾT QUẢ ---
  if (result) {
    return (
      <ExamLayout
        title="Kết quả bài thi"
        onExit={() => {
          clearCachedResult(id);
          // Nút đóng "X" trên Navbar cũng sẽ ưu tiên returnTo
          navigate(returnTo || `/exams/${id}`);
        }}
      >
        <div className="max-w-[720px] mx-auto py-8">
          <div className="text-center mb-8">
            <p className="text-5xl font-extrabold text-[#58cc02] mb-2">
              {result.score}/10
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              Đúng {result.correct_count}/{result.total_questions} câu ·{" "}
              {Math.floor(result.time_spent / 60)} phút {result.time_spent % 60}{" "}
              giây
            </p>
          </div>

          <div className="space-y-3">
            {result.review.map((item, index) => (
              <div
                key={item.question_id}
                className={`p-4 rounded-xl border-2 ${
                  item.is_correct
                    ? "border-[#58cc02]/30 bg-[#58cc02]/5"
                    : "border-red-300/50 bg-red-50 dark:bg-red-900/10"
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
                          isCorrectOpt
                            ? "text-[#58cc02] font-semibold"
                            : isSelectedOpt
                              ? "text-red-500 font-semibold"
                              : "text-gray-500 dark:text-gray-400"
                        }
                      >
                        {opt}. {text} {isCorrectOpt && "✓"}{" "}
                        {isSelectedOpt && !isCorrectOpt && "✗"}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bổ sung nút quay về lộ trình thật nổi bật phía dưới kết quả */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                clearCachedResult(id);
                navigate(returnTo || `/exams/${id}`);
              }}
              className="w-full max-w-sm py-3.5 rounded-xl font-bold text-white bg-[#58cc02] hover:bg-[#4cb001] transition-colors"
            >
              {returnTo ? "VỀ LỘ TRÌNH" : "QUAY LẠI"}
            </button>
          </div>
        </div>
      </ExamLayout>
    );
  }

  // --- MÀN HÌNH LÀM BÀI ---
  const pageQuestions = currentPage?.data ?? [];
  const totalElements = currentPage?.totalElements ?? 0;
  const answeredCountThisPage = pageQuestions.filter(
    (q) => answers[q.id],
  ).length;
  const totalAnsweredCount = Object.keys(answers).length;

  return (
    <ExamLayout title="Đang làm bài" onExit={handleExit}>
      <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Trang {currentPage?.currentPage} / {currentPage?.totalPages}
            </span>
          </div>

          <div className="space-y-6">
            {pageQuestions.map((q, index) => {
              const globalIndex =
                (currentPage.currentPage - 1) * PAGE_SIZE + index;
              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700"
                >
                  <p className="font-semibold text-gray-900 dark:text-white mb-3">
                    Câu {globalIndex + 1}. {q.question_text}
                  </p>
                  <div className="space-y-2">
                    {["A", "B", "C", "D"].map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          answers[q.id] === opt
                            ? "border-[#58cc02] bg-[#58cc02]/5"
                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q${q.id}`}
                          checked={answers[q.id] === opt}
                          onChange={() => handleSelect(q.id, opt)}
                          className="accent-[#58cc02]"
                        />
                        <span>
                          {opt}. {q[`option_${opt.toLowerCase()}`]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Trang {currentPage?.currentPage} / {currentPage?.totalPages}
            </span>

            {currentPage &&
              currentPage.currentPage < currentPage.totalPages && (
                <button
                  onClick={() => goToPage(currentPage.currentPage + 1)}
                  disabled={pageLoading}
                  className="text-sm font-bold text-[#58cc02] hover:text-[#4cb001] disabled:opacity-50 transition-colors"
                >
                  {pageLoading ? "Đang tải..." : "Trang tiếp →"}
                </button>
              )}
          </div>

          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-4">
            Đã trả lời {answeredCountThisPage}/{pageQuestions.length} câu ở
            trang này
          </p>

          {loadError && (
            <p className="text-sm text-red-500 dark:text-red-400 text-center mt-4">
              {loadError}
            </p>
          )}
        </div>

        <aside className="w-full lg:w-[260px] shrink-0 lg:sticky lg:top-20">
          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <button
              onClick={() => handleSubmit()}
              disabled={submitting || pageLoading}
              className="w-full py-3 mb-4 rounded-xl font-bold text-white bg-[#58cc02] hover:bg-[#4cb001] disabled:opacity-50 transition-colors"
            >
              {submitting
                ? "Đang nộp bài..."
                : `NỘP BÀI (${totalAnsweredCount}/${totalElements})`}
            </button>

            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
              Danh sách câu hỏi
            </h3>

            <div className="flex flex-wrap gap-2">
              {Array.from({ length: totalElements }, (_, index) => {
                const pageOfIndex = Math.floor(index / PAGE_SIZE) + 1;
                const indexWithinPage = index % PAGE_SIZE;
                const questionId =
                  visitedQuestionIds[pageOfIndex]?.[indexWithinPage];
                const isAnswered = questionId != null && !!answers[questionId];
                const isCurrentPageOfSquare =
                  pageOfIndex === currentPage?.currentPage;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goToPage(pageOfIndex)}
                    disabled={pageLoading}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                      isAnswered
                        ? "bg-[#58cc02] border-[#58cc02] text-white"
                        : isCurrentPageOfSquare
                          ? "border-[#1cb0f6] text-[#1cb0f6]"
                          : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
              Bấm vào số thứ tự để chuyển nhanh tới câu hỏi thuộc trang tương
              ứng.
            </p>
          </div>
        </aside>
      </div>

      <div className="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full px-5 py-2.5 flex items-center justify-center backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
        <span
          className={`text-lg font-bold tabular-nums tracking-wider ${
            timeLeft !== null && timeLeft <= 60
              ? "text-red-500 animate-pulse"
              : timeLeft !== null && timeLeft <= 300
                ? "text-orange-500"
                : "text-gray-800 dark:text-gray-200"
          }`}
        >
          ⏱ {formatTime(timeLeft)}
        </span>
      </div>
    </ExamLayout>
  );
}
