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
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [visitedQuestionIds, setVisitedQuestionIds] = useState({});
  const [loadError, setLoadError] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(() => readCachedResult(id));
  const [reviewFilter, setReviewFilter] = useState("ALL"); // ALL, CORRECT, WRONG

  const [timeLeft, setTimeLeft] = useState(null);
  const timerIntervalRef = useRef(null);
  const resultRef = useRef(null);
  const handleSubmitRef = useRef(null);
  const pendingScrollQuestionRef = useRef(null);
  const [highlightedQuestionNum, setHighlightedQuestionNum] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToPanel = useCallback(() => {
    const panel = document.getElementById("exam-sidebar-panel");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "center" });
      panel.classList.add("ring-4", "ring-[#58cc02]", "shadow-2xl");
      setTimeout(() => {
        panel.classList.remove("ring-4", "ring-[#58cc02]", "shadow-2xl");
      }, 1500);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const highlightQuestion = useCallback((questionNum) => {
    setHighlightedQuestionNum(questionNum);
    setTimeout(() => {
      setHighlightedQuestionNum((prev) => (prev === questionNum ? null : prev));
    }, 1500);
  }, []);

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

  const handleSelect = (questionId, option, questionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    if (typeof questionIndex === "number") {
      setActiveQuestionIndex(questionIndex);
    }
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
      if (pageLoading) return;
      if (currentPage && pageNumber === currentPage.currentPage) return;

      setPageLoading(true);
      setLoadError("");

      try {
        const res = await api.get(`/exams/${id}/questions`, {
          params: {
            session_id: sessionInfo?.session_id,
            page: pageNumber,
            pageSize: PAGE_SIZE,
          },
        });
        applyPageData(res.data?.result);
        if (!pendingScrollQuestionRef.current) {
          setActiveQuestionIndex((pageNumber - 1) * PAGE_SIZE);
          const mainEl = document.getElementById("exam-main-scroll");
          if (mainEl) mainEl.scrollTo({ top: 0, behavior: "smooth" });
          else window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (error) {
        // Tự động khôi phục nếu phiên cũ không còn hợp lệ (code 2006 hoặc 400 Bad Request)
        const errorCode = error.response?.data?.code;
        const statusCode = error.response?.status;
        if (errorCode === 2006 || statusCode === 400) {
          try {
            const startRes = await api.post(`/exams/${id}/start`, null, {
              params: { page: pageNumber, pageSize: PAGE_SIZE },
            });
            const data = startRes.data?.result;
            if (data?.session_id) {
              setSessionInfo({
                session_id: data.session_id,
                started_at: data.started_at,
                duration: data.duration,
              });
              applyPageData(data.questions);
              setLoadError("");
              return;
            }
          } catch (retryError) {
            console.error("Lỗi khi khôi phục phiên thi:", retryError);
          }
        }

        setLoadError(
          error.response?.data?.message || "Không thể tải trang câu hỏi.",
        );
      } finally {
        setPageLoading(false);
      }
    },
    [sessionInfo, currentPage, pageLoading, id, applyPageData],
  );

  const jumpToQuestion = useCallback(
    async (targetIndex) => {
      setActiveQuestionIndex(targetIndex);
      const pageOfIndex = Math.floor(targetIndex / PAGE_SIZE) + 1;
      const questionNumber = targetIndex + 1;

      if (currentPage?.currentPage === pageOfIndex) {
        const el = document.getElementById(`question-${questionNumber}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          highlightQuestion(questionNumber);
        }
      } else {
        pendingScrollQuestionRef.current = questionNumber;
        await goToPage(pageOfIndex);
      }
    },
    [currentPage, goToPage, highlightQuestion],
  );

  useEffect(() => {
    if (pendingScrollQuestionRef.current && currentPage) {
      const targetNum = pendingScrollQuestionRef.current;
      pendingScrollQuestionRef.current = null;
      const timer = setTimeout(() => {
        const el = document.getElementById(`question-${targetNum}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          highlightQuestion(targetNum);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentPage, highlightQuestion]);

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
    const totalQuestions = result.total_questions || result.review?.length || 10;
    const correctCount = result.correct_count ?? 0;
    const wrongCount = totalQuestions - correctCount;
    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    const scoreVal = Number(result.score || 0);

    const filteredReview = (result.review || []).filter((item) => {
      if (reviewFilter === "CORRECT") return item.is_correct;
      if (reviewFilter === "WRONG") return !item.is_correct;
      return true;
    });

    const getGradeInfo = (score) => {
      if (score >= 8.5) {
        return {
          title: "Xuất sắc! 🎉",
          desc: "Bạn có nền tảng từ vựng và ngữ pháp rất vững vàng.",
          badge: "bg-emerald-500 text-white shadow-emerald-500/20",
          gradient: "from-emerald-500 to-teal-600",
        };
      }
      if (score >= 7.0) {
        return {
          title: "Rất tốt! 👏",
          desc: "Kết quả bài làm đạt mức khá tốt, hãy tiếp tục phát huy.",
          badge: "bg-teal-500 text-white shadow-teal-500/20",
          gradient: "from-teal-500 to-cyan-600",
        };
      }
      if (score >= 5.0) {
        return {
          title: "Đạt yêu cầu 👍",
          desc: "Bạn đã vượt qua bài kiểm tra nhưng cần củng cố thêm một số lỗi sai.",
          badge: "bg-amber-500 text-white shadow-amber-500/20",
          gradient: "from-amber-500 to-orange-500",
        };
      }
      return {
        title: "Cần cải thiện thêm 💪",
        desc: "Đừng nản lòng! Hãy ôn lại các từ vựng chủ đề này và thử sức lại nhé.",
        badge: "bg-rose-500 text-white shadow-rose-500/20",
        gradient: "from-rose-500 to-red-600",
      };
    };

    const grade = getGradeInfo(scoreVal);

    return (
      <ExamLayout
        title="Báo cáo kết quả bài thi"
        onExit={() => {
          clearCachedResult(id);
          navigate(returnTo || `/exams/${id}`);
        }}
      >
        <div className="max-w-[840px] mx-auto py-6 sm:py-10 text-left">
          {/* CELEBRATORY HERO BANNER */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 mb-8 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm text-gray-900 dark:text-white">
            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
              <div className="max-w-md">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-2xs mb-3 ${grade.badge}`}>
                  {grade.title}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                  Tổng kết bài làm của bạn
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
                  {grade.desc}
                </p>
              </div>

              {/* Score Circular / Large Badge */}
              <div className="shrink-0 flex flex-col items-center justify-center w-36 h-36 sm:w-40 sm:h-40 rounded-3xl bg-[#58cc02]/10 border-2 border-[#58cc02]/30 p-4 shadow-xs">
                <div className="text-4xl sm:text-5xl font-black text-[#58cc02] tracking-tight">
                  {result.score}
                </div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">
                  Thang điểm 10
                </div>
              </div>
            </div>
          </div>

          {/* 4 METRICS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
              <span className="text-2xl block mb-1">✅</span>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Số câu đúng</div>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {correctCount} / {totalQuestions}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
              <span className="text-2xl block mb-1">❌</span>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Số câu sai</div>
              <div className="text-lg sm:text-xl font-extrabold text-rose-500 dark:text-rose-400">
                {wrongCount} câu
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
              <span className="text-2xl block mb-1">⏱</span>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Thời gian hoàn thành</div>
              <div className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                {Math.floor(result.time_spent / 60)}p {result.time_spent % 60}s
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
              <span className="text-2xl block mb-1">🎯</span>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Độ chính xác</div>
              <div className="text-lg sm:text-xl font-extrabold text-cyan-600 dark:text-cyan-400">
                {accuracy}%
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap gap-3.5 mb-10">
            <button
              onClick={() => {
                clearCachedResult(id);
                navigate(returnTo || `/exams/${id}`);
              }}
              className="flex-1 min-w-[200px] py-3.5 px-6 rounded-2xl font-extrabold text-sm sm:text-base text-white bg-[#58cc02] hover:bg-[#4cb001] shadow-md shadow-[#58cc02]/20 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{returnTo ? "Về lộ trình học" : "Danh sách đề thi"}</span>
              <span>→</span>
            </button>
            <button
              onClick={() => {
                clearCachedResult(id);
                window.location.reload();
              }}
              className="py-3.5 px-6 rounded-2xl font-bold text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <span>Làm lại đề này</span>
            </button>
          </div>

          {/* REVIEW SECTION HEADER & TABS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Chi tiết lời giải từng câu
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Đối chiếu câu trả lời của bạn với đáp án chính xác
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 text-xs font-bold">
              <button
                onClick={() => setReviewFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${reviewFilter === "ALL"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs"
                  : "text-gray-500 dark:text-gray-400"
                  }`}
              >
                Tất cả ({totalQuestions})
              </button>
              <button
                onClick={() => setReviewFilter("CORRECT")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${reviewFilter === "CORRECT"
                  ? "bg-emerald-500 text-white shadow-2xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-emerald-600"
                  }`}
              >
                Đúng ({correctCount})
              </button>
              <button
                onClick={() => setReviewFilter("WRONG")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${reviewFilter === "WRONG"
                  ? "bg-rose-500 text-white shadow-2xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-rose-500"
                  }`}
              >
                Sai ({wrongCount})
              </button>
            </div>
          </div>

          {/* QUESTION REVIEW CARDS */}
          <div className="space-y-4">
            {filteredReview.map((item, index) => {
              const originalIndex = result.review.findIndex((r) => r.question_id === item.question_id);

              return (
                <div
                  key={item.question_id}
                  className={`p-5 sm:p-6 rounded-3xl border-2 transition-all ${item.is_correct
                    ? "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs"
                    : "border-rose-400/40 bg-rose-50/25 dark:bg-rose-950/10 shadow-xs"
                    }`}
                >
                  {/* Question Title & Result Chip */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center justify-center">
                        {originalIndex + 1}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {item.is_correct ? "Đã trả lời đúng" : "Câu trả lời sai"}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${item.is_correct
                        ? "bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                        : "bg-rose-100/70 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                        }`}
                    >
                      {item.is_correct ? "✓ Đúng" : "✗ Sai"}
                    </span>
                  </div>

                  <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-4 leading-relaxed">
                    {item.question_text}
                  </p>

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {["A", "B", "C", "D"].map((opt) => {
                      const text = item[`option_${opt.toLowerCase()}`];
                      const isCorrectOpt = opt === item.correct_option;
                      const isSelectedOpt = opt === item.selected_option;

                      let cardStyle = "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300";
                      let badgeStyle = "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";

                      if (isCorrectOpt) {
                        cardStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500/30";
                        badgeStyle = "bg-emerald-500 text-white";
                      } else if (isSelectedOpt && !isCorrectOpt) {
                        cardStyle = "border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-200 font-semibold ring-1 ring-rose-500/30 line-through opacity-80";
                        badgeStyle = "bg-rose-500 text-white";
                      }

                      return (
                        <div
                          key={opt}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-sm transition-all ${cardStyle}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${badgeStyle}`}>
                              {opt}
                            </span>
                            <span className="truncate">{text}</span>
                          </div>

                          <div className="shrink-0 text-xs font-bold">
                            {isCorrectOpt && <span className="text-emerald-600 dark:text-emerald-400">✓ Đáp án đúng</span>}
                            {isSelectedOpt && !isCorrectOpt && <span className="text-rose-500">✗ Bạn chọn</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ExamLayout>
    );
  }

  // --- MÀN HÌNH LÀM BÀI (EXAM TAKING) ---
  const pageQuestions = currentPage?.data ?? [];
  const totalElements = currentPage?.totalElements ?? 0;
  const answeredCountThisPage = pageQuestions.filter((q) => answers[q.id]).length;
  const totalAnsweredCount = Object.keys(answers).length;
  const progressPercent = totalElements > 0 ? Math.round((totalAnsweredCount / totalElements) * 100) : 0;

  const examRightSidebar = (
    <div className="h-full flex flex-col justify-between p-4 sm:p-5 space-y-4">
      {/* TOP & MIDDLE: TIMER & QUESTION PALETTE */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-thin space-y-4 pr-0.5">
        {/* 1. COUNTDOWN TIMER */}
        <div
          className={`px-4 py-3 rounded-2xl border-2 transition-all shadow-sm ${timeLeft !== null && timeLeft <= 60
            ? "bg-rose-50/90 dark:bg-rose-950/50 border-rose-400 dark:border-rose-600 shadow-rose-500/10"
            : timeLeft !== null && timeLeft <= 300
              ? "bg-amber-50/90 dark:bg-amber-950/50 border-amber-300 dark:border-amber-600 shadow-amber-500/10"
              : "bg-gray-50/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700"
            }`}
        >
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">⏱</span>
              <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Thời gian còn lại
              </span>
            </div>
            {timeLeft !== null && timeLeft <= 300 && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500 text-white animate-pulse">
                Sắp hết
              </span>
            )}
          </div>
          <div className="text-center py-1">
            <span
              className={`text-3xl sm:text-4xl font-black tabular-nums tracking-wider ${timeLeft !== null && timeLeft <= 60
                ? "text-rose-600 dark:text-rose-400 animate-pulse"
                : timeLeft !== null && timeLeft <= 300
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-900 dark:text-white"
                }`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* 2. QUESTION PALETTE MATRIX */}
        <div className="flex-1 flex flex-col">
          {/* Questions Mini Matrix */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {Array.from({ length: totalElements }, (_, index) => {
              const pageOfIndex = Math.floor(index / PAGE_SIZE) + 1;
              const indexWithinPage = index % PAGE_SIZE;
              const questionId = visitedQuestionIds[pageOfIndex]?.[indexWithinPage];
              const isAnswered = questionId != null && !!answers[questionId];
              const isCurrent = activeQuestionIndex === index;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => jumpToQuestion(index)}
                  disabled={pageLoading}
                  title={`Nhảy tới câu ${index + 1}: ${isAnswered ? "Đã trả lời" : "Chưa làm"}`}
                  className={`h-10 sm:h-11 flex items-center justify-center rounded-xl text-sm sm:text-base font-black transition-all disabled:opacity-50 cursor-pointer relative ${isCurrent && isAnswered
                      ? "bg-[#58cc02] text-white ring-4 ring-[#1cb0f6] ring-offset-2 dark:ring-offset-gray-900 font-black shadow-md scale-105 z-10"
                      : isCurrent
                        ? "border-2 border-[#1cb0f6] text-[#0284c7] dark:text-[#38bdf8] bg-[#1cb0f6]/20 ring-4 ring-[#1cb0f6]/30 font-black shadow-md scale-105 z-10"
                        : isAnswered
                          ? "bg-[#58cc02] hover:bg-[#4cb001] text-white shadow-sm border-b-2 border-[#3b8702]"
                          : "border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-gray-400 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750"
                    }`}
                >
                  <span>{index + 1}</span>
                  {isAnswered && (
                    <span className="text-[10px] ml-0.5 opacity-90 font-black">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400 space-y-2 leading-relaxed mt-auto">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md bg-[#58cc02] inline-flex items-center justify-center text-[9px] text-white font-black shadow-2xs">✓</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">Đã trả lời ({totalAnsweredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md border-2 border-[#1cb0f6] bg-[#1cb0f6]/25 ring-2 ring-[#1cb0f6]/40" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">Đang chọn (Câu {activeQuestionIndex + 1})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-md border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">Chưa làm ({totalElements - totalAnsweredCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM: SUBMIT BUTTON DOCKED AT THE BOTTOM */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => handleSubmit()}
          disabled={submitting || pageLoading}
          className="w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base text-white bg-[#58cc02] hover:bg-[#4cb001] border-b-4 border-[#3b8702] active:border-b-0 active:translate-y-1 shadow-lg shadow-[#58cc02]/25 hover:shadow-xl disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide"
        >
          <span>{submitting ? "Đang nộp bài..." : "NỘP BÀI THI"}</span>
          {!submitting && <span className="text-lg">➔</span>}
        </button>
      </div>
    </div>
  );

  return (
    <ExamLayout
      title=""
      onExit={handleExit}
      rightSidebar={examRightSidebar}
      headerCenter={
        <div className="w-full flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 shrink-0">
            <span>Tiến độ:</span>
            <span className="text-[#58cc02] font-black">{totalAnsweredCount}/{totalElements}</span>
            <span className="text-gray-400 font-normal">({progressPercent}%)</span>
          </div>

          <div className="flex-1 max-w-xs sm:max-w-sm h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200/60 dark:border-gray-700">
            <div
              className="h-full bg-[#58cc02] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold shrink-0 hidden sm:inline">
            Trang {currentPage?.currentPage || 1}/{currentPage?.totalPages || 1}
          </span>
        </div>
      }
      headerRight={
        <div className="lg:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-black tabular-nums shadow-2xs">
          <span className="text-xs">⏱</span>
          <span
            className={
              timeLeft !== null && timeLeft <= 60
                ? "text-rose-500 animate-pulse"
                : timeLeft !== null && timeLeft <= 300
                  ? "text-amber-500"
                  : "text-gray-900 dark:text-white"
            }
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      }
    >
      <div className="w-full text-left">
        {/* QUESTIONS LIST */}
        <div className="w-full space-y-4">
          {pageQuestions.map((q, index) => {
            const globalIndex = (currentPage.currentPage - 1) * PAGE_SIZE + index;
            const questionNumber = globalIndex + 1;
            const isAnswered = !!answers[q.id];
            const isHighlighted = highlightedQuestionNum === questionNumber;

            return (
              <div
                key={q.id}
                id={`question-${questionNumber}`}
                className={`scroll-mt-6 bg-white dark:bg-gray-800/95 border rounded-3xl p-5 sm:p-7 transition-all duration-300 ${isHighlighted
                  ? "ring-4 ring-[#58cc02] shadow-xl border-[#58cc02] dark:ring-[#58cc02]"
                  : isAnswered
                    ? "border-emerald-200/90 dark:border-emerald-900/60 shadow-xs"
                    : "border-gray-200/90 dark:border-gray-700/80 shadow-xs hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
              >
                {/* Question header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    CÂU HỎI {questionNumber}
                  </span>
                  {isAnswered && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span>✓</span> Đã chọn đáp án
                    </span>
                  )}
                </div>

                <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-5 leading-relaxed">
                  {q.question_text}
                </p>

                {/* 4 Interactive Option Cards */}
                <div className="space-y-3">
                  {["A", "B", "C", "D"].map((opt) => {
                    const isSelected = answers[q.id] === opt;
                    const optionText = q[`option_${opt.toLowerCase()}`];

                    return (
                      <div
                        key={opt}
                        onClick={() => handleSelect(q.id, opt, globalIndex)}
                        className={`group flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150 ${isSelected
                          ? "border-[#58cc02] bg-[#58cc02]/10 dark:bg-[#58cc02]/15 shadow-xs ring-2 ring-[#58cc02]/20"
                          : "border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100/70 dark:hover:bg-gray-700"
                          }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isSelected
                            ? "bg-[#58cc02] text-white shadow-xs"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600"
                            }`}
                        >
                          {opt}
                        </div>
                        <span
                          className={`text-sm sm:text-base font-medium flex-1 ${isSelected
                            ? "text-gray-900 dark:text-white font-semibold"
                            : "text-gray-700 dark:text-gray-300"
                            }`}
                        >
                          {optionText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
              Đã trả lời {answeredCountThisPage}/{pageQuestions.length} câu ở trang này
            </span>

            {currentPage && currentPage.currentPage < currentPage.totalPages && (
              <button
                onClick={() => goToPage(currentPage.currentPage + 1)}
                disabled={pageLoading}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 hover:bg-[#58cc02] hover:text-white text-gray-800 dark:text-gray-200 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {pageLoading ? "Đang tải..." : "Trang kế tiếp →"}
              </button>
            )}
          </div>

          {loadError && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-center space-y-2 mt-4">
              <p className="text-sm font-bold text-red-600 dark:text-red-400">
                ⚠️ {loadError}
              </p>
              <button
                type="button"
                onClick={() => goToPage(currentPage?.currentPage || 1)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                Thử lại
              </button>
            </div>
          )}
        </div>
      </div>
    </ExamLayout>
  );
}

