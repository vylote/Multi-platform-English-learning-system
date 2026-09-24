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

  const resultRef = useRef(null);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const applyPageData = useCallback((pageData) => {
    setCurrentPage(pageData);
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
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        setLoadError("Không thể tải trang câu hỏi.");
      } finally {
        setPageLoading(false);
      }
    },
    [sessionInfo, examId, currentPage, pageLoading, applyPageData],
  );

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
      setLoadError("Không thể nộp bài, vui lòng thử lại.");
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
    return (
      <ExamLayout title="Hoàn thành!" onExit={() => navigate("/learn")}>
        <div className="max-w-[720px] mx-auto py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Phân loại hoàn tất</h2>
          <p className="text-5xl font-extrabold text-[#58cc02] mb-2">
            {result.score}/10
          </p>
          <p className="text-gray-500 mb-8">
            Trình độ của bạn được đánh giá ở mức:{" "}
            <span className="font-bold text-[#1cb0f6]">
              {result.tier_assigned || "Xác định từ Server"}
            </span>
          </p>
          <button
            onClick={() => {
              // 1. Cập nhật tier mới vào Redux và LocalStorage
              dispatch(updateUser({ tier: result.tier_assigned }));

              // 2. Mới bắt đầu chuyển hướng
              navigate("/learn");
            }}
            className="w-full max-w-sm mx-auto py-3 rounded-xl font-bold text-white bg-[#58cc02] hover:bg-[#4cb001] transition-colors"
          >
            Bắt đầu học ngay
          </button>
        </div>
      </ExamLayout>
    );
  }

  const pageQuestions = currentPage?.data ?? [];
  const totalElements = currentPage?.totalElements ?? 0;
  const totalAnsweredCount = Object.keys(answers).length;

  return (
    <ExamLayout title="Kiểm tra trình độ" onExit={handleExit}>
      {/* ... Phần JSX giao diện render câu hỏi giữ nguyên 100% không đổi ... */}
      <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 w-full">
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
                            : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
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

          <div className="flex items-center justify-between mt-6">
            <span className="text-sm text-gray-500">
              Trang {currentPage?.currentPage} / {currentPage?.totalPages}
            </span>
            {currentPage &&
              currentPage.currentPage < currentPage.totalPages && (
                <button
                  onClick={() => goToPage(currentPage.currentPage + 1)}
                  disabled={pageLoading}
                  className="text-sm font-bold text-[#58cc02] hover:text-[#4cb001] disabled:opacity-50"
                >
                  {pageLoading ? "Đang tải..." : "Trang tiếp →"}
                </button>
              )}
          </div>
          {loadError && (
            <p className="text-sm text-red-500 mt-4">{loadError}</p>
          )}
        </div>

        <aside className="w-full lg:w-[260px] shrink-0 lg:sticky lg:top-20">
          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <button
              onClick={handleSubmit}
              disabled={submitting || pageLoading}
              className="w-full py-3 mb-4 rounded-xl font-bold text-white bg-[#58cc02] hover:bg-[#4cb001] disabled:opacity-50 transition-colors"
            >
              {submitting
                ? "Đang xử lý..."
                : `HOÀN THÀNH (${totalAnsweredCount}/${totalElements})`}
            </button>
            <h3 className="text-xs font-semibold text-gray-500 mb-3">
              Trạng thái
            </h3>
            <p className="text-[11px] text-gray-400">
              Lưu ý: Nếu bạn thoát trang khi chưa nộp bài, quá trình kiểm tra sẽ
              bị hủy và bạn phải làm lại vào lần sau.
            </p>
          </div>
        </aside>
      </div>
    </ExamLayout>
  );
}
