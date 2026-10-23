import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import ExamLayout from "../layouts/ExamLayout";
import { getBackendTimezoneOffset } from "../utils/timezone";
import { useDispatch } from "react-redux";
import { updateUser } from "../store/slice/authSlice";

const PAGE_SIZE = 10;

export default function PlacementTestPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [examId, setExamId] = useState(null); // <-- Thêm state lưu ID của bài Placement
  const [sessionInfo, setSessionInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loadError, setLoadError] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [visitedQuestionIds, setVisitedQuestionIds] = useState({});

  const resultRef = useRef(null);
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

  // 1. LẤY ID BÀI PLACEMENT VÀ BẮT ĐẦU THI BẰNG API DÙNG CHUNG CỦA EXAMS
  useEffect(() => {
    let cancelled = false;

    const startPlacementTest = async () => {
      try {
        const examRes = await api.get(`/exams/placement-exam`);
        if (cancelled) return;
        const fetchedExamId = examRes.data?.result?.id;
        setExamId(fetchedExamId);

        // Bước 2: Bắt đầu làm bài với ID vừa lấy được
        const startRes = await api.post(`/exams/${fetchedExamId}/start`, null, {
          params: { page: 1, pageSize: PAGE_SIZE },
        });
        if (cancelled) return;

        const data = startRes.data?.result;
        setSessionInfo({
          session_id: data.session_id,
          started_at: data.started_at,
        });
        applyPageData(data.questions);
      } catch (error) {
        if (!cancelled)
          setLoadError(
            error.response?.data?.message ||
              "Không thể bắt đầu bài kiểm tra đầu vào.",
          );
      }
    };

    startPlacementTest();

    return () => {
      cancelled = true;
    };
  }, [applyPageData]);

  // Hủy bài ngay lập tức khi người dùng đóng tab / thoát trang
  useEffect(() => {
    if (!sessionInfo || !examId) return; // Cần có thêm examId

    const cancelViaBeacon = () => {
      const url = `${api.defaults.baseURL}/exams/${examId}/cancel`; // <-- Đã sửa API
      const payload = new Blob(
        [JSON.stringify({ session_id: sessionInfo.session_id })],
        { type: "application/json" },
      );
      navigator.sendBeacon(url, payload);
    };

    const handlePageHide = () => {
      if (!resultRef.current) cancelViaBeacon(); // Dùng resultRef.current thay vì result
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);

      // Cleanup chạy khi unmount component
      if (sessionInfo && !resultRef.current) {
        api
          .post(`/exams/${examId}/cancel`, {
            session_id: sessionInfo.session_id,
          })
          .catch(() => {});
      }
    };
  }, [sessionInfo, examId]);

  const handleSelect = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleExit = async () => {
    if (!sessionInfo || !examId) return navigate("/onboarding");
    if (
      !window.confirm(
        "Thoát bây giờ bài kiểm tra sẽ bị hủy. Lần đăng nhập sau bạn sẽ phải làm lại từ đầu. Bạn có chắc chắn?",
      )
    )
      return;

    try {
      await api.post(`/exams/${examId}/cancel`, {
        // <-- Đã sửa API
        session_id: sessionInfo.session_id,
      });
    } catch (error) {
      console.log("Lỗi hủy phiên:", error);
    } finally {
      navigate("/");
    }
  };

  const goToPage = useCallback(
    async (pageNumber) => {
      if (!sessionInfo || !examId || pageLoading) return;
      if (currentPage && pageNumber === currentPage.currentPage) return;

      setPageLoading(true);
      setLoadError("");

      try {
        const res = await api.get(`/exams/${examId}/questions`, {
          // <-- Đã sửa API
          params: {
            session_id: sessionInfo.session_id,
            page: pageNumber,
            pageSize: PAGE_SIZE,
          },
        });
        applyPageData(res.data?.result);
        if (!pendingScrollQuestionRef.current) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch (error) {
        setLoadError("Không thể tải trang câu hỏi.", error);
      } finally {
        setPageLoading(false);
      }
    },
    [sessionInfo, examId, currentPage, pageLoading, applyPageData],
  );

  const jumpToQuestion = useCallback(
    async (targetIndex) => {
      const pageOfIndex = Math.floor(targetIndex / PAGE_SIZE) + 1;
      const questionNumber = targetIndex + 1;

      if (currentPage?.currentPage === pageOfIndex) {
        const el = document.getElementById(`question-${questionNumber}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
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
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          highlightQuestion(targetNum);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentPage, highlightQuestion]);

  const handleSubmit = useCallback(async () => {
    if (!sessionInfo || !examId || submitting) return;

    const totalElements = currentPage?.totalElements ?? 0;
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < totalElements) {
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
      const response = await api.post(`/exams/${examId}/submit`, {
        // <-- Đã sửa API
        session_id: sessionInfo.session_id,
        answers: answerList,
        timezone_offset: getBackendTimezoneOffset(),
      });
      setResult(response.data?.result);
    } catch (error) {
      setLoadError("Không thể nộp bài, vui lòng thử lại.", error);
    } finally {
      setSubmitting(false);
    }
  }, [sessionInfo, examId, answers, submitting, currentPage]);

  if (loadError && !sessionInfo) {
    return (
      <ExamLayout title="Lỗi" onExit={() => navigate(-1)}>
        <p className="text-sm text-red-500 py-10 text-center">{loadError}</p>
      </ExamLayout>
    );
  }

  if (!sessionInfo && !result) {
    return (
      <ExamLayout title="Chuẩn bị bài kiểm tra trình độ...">
        <p className="text-sm text-gray-400 py-10 text-center">
          Đang tải câu hỏi...
        </p>
      </ExamLayout>
    );
  }

  if (result) {
    const tierMap = {
      BEGINNER: { label: "Cơ bản (Beginner)", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" },
      INTERMEDIATE: { label: "Trung cấp (Intermediate)", color: "text-sky-500 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800" },
      ADVANCED: { label: "Nâng cao (Advanced)", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" },
    };
    const tierInfo = tierMap[result.tier_assigned] || {
      label: result.tier_assigned || "Tiêu chuẩn",
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    };

    return (
      <ExamLayout title="Hoàn thành kiểm tra trình độ!" onExit={() => navigate("/learn")}>
        <div className="max-w-[700px] mx-auto py-10 px-4 text-center">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-5xl shadow-xl shadow-amber-400/20 mx-auto animate-bounce">
              🏆
            </div>
            <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-md">
              Xong!
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Đánh giá năng lực hoàn tất!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-8">
            Dựa trên kết quả bài kiểm tra, hệ thống đã thiết lập lộ trình học tập cá nhân hóa phù hợp nhất với bạn.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xs">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">
                Điểm số đạt được
              </span>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {result.score}/10
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xs">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">
                Phân loại cấp độ
              </span>
              <span className="text-lg font-black text-[#1cb0f6] block truncate">
                {result.tier_assigned || "BEGINNER"}
              </span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border mb-8 max-w-md mx-auto text-sm font-semibold ${tierInfo.color}`}>
            🎯 Trình độ đề xuất: {tierInfo.label}
          </div>

          <button
            onClick={() => {
              dispatch(updateUser({ tier: result.tier_assigned }));
              navigate("/learn");
            }}
            className="w-full max-w-md mx-auto py-4 rounded-2xl font-black text-base text-white bg-gradient-to-r from-emerald-500 to-[#58cc02] hover:brightness-105 active:scale-[0.99] shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Bắt đầu học ngay</span>
            <span>→</span>
          </button>
        </div>
      </ExamLayout>
    );
  }

  const pageQuestions = currentPage?.data ?? [];
  const totalElements = currentPage?.totalElements ?? 0;
  const answeredCountThisPage = pageQuestions.filter((q) => answers[q.id]).length;
  const totalAnsweredCount = Object.keys(answers).length;
  const progressPercent = totalElements > 0 ? Math.round((totalAnsweredCount / totalElements) * 100) : 0;

  return (
    <ExamLayout title="Bài kiểm tra đầu vào" onExit={handleExit}>
      <div className="max-w-[1200px] mx-auto text-left">
        {/* TOP STATUS & PROGRESS BAR */}
        <div className="bg-white dark:bg-gray-800/90 border border-gray-200/90 dark:border-gray-700/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full flex-1">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
              <span className="text-gray-800 dark:text-gray-200">
                Tiến độ làm bài: <strong className="text-emerald-600 dark:text-emerald-400">{totalAnsweredCount}</strong>/{totalElements} câu ({progressPercent}%)
              </span>
              <span>Trang {currentPage?.currentPage} / {currentPage?.totalPages}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#58cc02] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* MAIN BODY: QUESTIONS + SIDEBAR */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Question List */}
          <div className="flex-1 min-w-0 w-full space-y-5">
            {pageQuestions.map((q, index) => {
              const globalIndex = (currentPage.currentPage - 1) * PAGE_SIZE + index;
              const questionNumber = globalIndex + 1;
              const isAnswered = !!answers[q.id];
              const isHighlighted = highlightedQuestionNum === questionNumber;

              return (
                <div
                  key={q.id}
                  id={`question-${questionNumber}`}
                  className={`p-6 rounded-2xl border transition-all duration-300 bg-white dark:bg-gray-800/90 ${
                    isHighlighted
                      ? "ring-4 ring-[#58cc02] shadow-xl border-[#58cc02] dark:ring-[#58cc02]"
                      : isAnswered
                        ? "border-emerald-200 dark:border-emerald-900/60 shadow-xs"
                        : "border-gray-200/80 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      Câu {questionNumber}
                    </span>
                    {isAnswered ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        ✓ Đã chọn
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        Chưa trả lời
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-5 leading-relaxed">
                    {q.question_text}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["A", "B", "C", "D"].map((opt) => {
                      const text = q[`option_${opt.toLowerCase()}`];
                      const isSelected = answers[q.id] === opt;

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelect(q.id, opt)}
                          className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/30 shadow-sm"
                              : "border-gray-200/90 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/40 text-gray-800 dark:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-200/80 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {opt}
                          </span>
                          <span className="font-medium text-sm leading-snug flex-1">
                            {text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Đã hoàn thành {answeredCountThisPage}/{pageQuestions.length} câu trên trang này
              </span>

              {currentPage && currentPage.currentPage < currentPage.totalPages && (
                <button
                  onClick={() => goToPage(currentPage.currentPage + 1)}
                  disabled={pageLoading}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#58cc02] hover:bg-[#4cb001] active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {pageLoading ? "Đang tải..." : "Trang tiếp theo →"}
                </button>
              )}
            </div>

            {loadError && (
              <p className="text-sm font-semibold text-rose-500 text-center py-2">
                {loadError}
              </p>
            )}
          </div>

          {/* Sticky Matrix Sidebar */}
          <aside id="exam-sidebar-panel" className="w-full lg:w-[280px] shrink-0 lg:sticky lg:top-24 transition-all duration-300">
            <div className="border border-gray-200/90 dark:border-gray-700/80 rounded-3xl p-5 bg-white dark:bg-gray-800/90 shadow-sm">
              <button
                onClick={() => handleSubmit()}
                disabled={submitting || pageLoading}
                className="w-full py-3.5 mb-5 rounded-2xl font-black text-sm tracking-wide text-white bg-gradient-to-r from-emerald-500 to-[#58cc02] hover:brightness-105 active:scale-[0.98] shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitting ? "Đang nộp..." : `NỘP BÀI (${totalAnsweredCount}/${totalElements})`}
              </button>

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mục lục câu hỏi
                </h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {totalAnsweredCount}/{totalElements} đã làm
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: totalElements }, (_, index) => {
                  const pageOfIndex = Math.floor(index / PAGE_SIZE) + 1;
                  const indexWithinPage = index % PAGE_SIZE;
                  const questionId = visitedQuestionIds[pageOfIndex]?.[indexWithinPage];
                  const isAnswered = questionId != null && !!answers[questionId];
                  const isCurrentPageOfSquare = pageOfIndex === currentPage?.currentPage;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => jumpToQuestion(index)}
                      disabled={pageLoading}
                      title={`Nhảy tới câu ${index + 1}`}
                      className={`h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${
                        isAnswered
                          ? "bg-emerald-500 text-white shadow-xs"
                          : isCurrentPageOfSquare
                            ? "border-2 border-[#1cb0f6] text-[#1cb0f6] bg-sky-50 dark:bg-sky-950/30"
                            : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-4 leading-normal">
                💡 Bấm vào số thứ tự để di chuyển nhanh giữa các trang.
              </p>
            </div>
          </aside>
        </div>

        {/* FLOATING ACTION BUTTON / POPUP TO RETURN TO SUBMIT PANEL */}
        <div
          className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ease-out ${
            showScrollTop
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-6 scale-90 pointer-events-none"
          }`}
        >
          <button
            onClick={scrollToPanel}
            type="button"
            className="group flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-[#58cc02] hover:from-emerald-600 hover:to-[#4cb001] text-white font-extrabold text-sm shadow-xl shadow-emerald-500/35 hover:shadow-2xl hover:shadow-emerald-500/50 border border-white/20 active:scale-95 transition-all cursor-pointer"
            title="Quay về ô nộp bài & bảng câu hỏi"
          >
            <span className="w-7 h-7 rounded-xl bg-white/25 flex items-center justify-center text-base group-hover:-translate-y-1 transition-transform shadow-xs">
              ↑
            </span>
            <span className="tracking-wide">Bảng nộp bài</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
              {totalAnsweredCount}/{totalElements}
            </span>
          </button>
        </div>
      </div>
    </ExamLayout>
  );
}