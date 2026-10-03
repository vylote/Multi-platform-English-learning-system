import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import MainLayout from "../layouts/MainLayout";
import PronunciationPractice from "../components/PronunciationPractice";

const PHASES = [
  { key: "learn", label: "Học từ" },
  { key: "quiz", label: "Câu hỏi" },
  { key: "pronunciation", label: "Phát âm" },
];
const OPTION_KEYS = ["A", "B", "C", "D"];

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-sm font-bold text-gray-500 dark:text-gray-400
                 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6"
    >
      ← Quay lại lộ trình
    </button>
  );
}

function StepIndicator({ phase }) {
  const currentIdx = PHASES.findIndex((p) => p.key === phase);
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {PHASES.map((p, i) => (
        <div
          key={p.key}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            i === currentIdx
              ? "bg-[#58cc02] text-white"
              : i < currentIdx
                ? "bg-[#58cc02]/15 text-[#58cc02]"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400"
          }`}
        >
          {i + 1}. {p.label}
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ current, total }) {
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden mb-6">
      <div
        className="h-full bg-[#58cc02] transition-all duration-300 rounded-full"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  );
}

export default function TopicLessonPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(0); // đổi giá trị -> tải bộ từ/câu hỏi mới khi "Làm lại"
  const [lesson, setLesson] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [phase, setPhase] = useState("learn");
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({}); // { [questionId]: "A" | "B" | ... }
  const [pronIndex, setPronIndex] = useState(0);
  const [pronResults, setPronResults] = useState({}); // { [word]: boolean }

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get(`/lessons/topics/${topicId}`, { signal: controller.signal })
      .then((res) => setLesson(res.data?.result))
      .catch((error) => {
        if (error.code === "ERR_CANCELED") return;
        setLoadError(error.response?.data?.message || "Không thể tải bài học.");
      });
    return () => controller.abort();
  }, [topicId, attempt]);

  const submitLesson = useCallback(
    async (finalPronResults) => {
      setSubmitting(true);
      setSubmitError("");
      try {
        const res = await api.post(`/lessons/topics/${topicId}/complete`, {
          question_ids: lesson.questions.map((q) => q.id),
          quiz_answers: lesson.questions.map((q) => ({
            question_id: q.id,
            selected_option: quizAnswers[q.id] ?? null,
          })),
          pronunciation_results: lesson.pronunciationWords.map(({ word }) => ({
            word,
            isCorrect: !!finalPronResults[word],
          })),
        });
        setResult(res.data?.result);
      } catch (error) {
        setSubmitError(
          error.response?.data?.message ||
            "Không thể lưu kết quả, vui lòng thử lại.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [lesson, quizAnswers, topicId],
  );

  const handleRetry = () => {
    setLesson(null);
    setLoadError("");
    setPhase("learn");
    setQuizIndex(0);
    setQuizAnswers({});
    setPronIndex(0);
    setPronResults({});
    setSubmitError("");
    setResult(null);
    setAttempt((a) => a + 1);
  };

  const handleExit = () => {
    if (phase !== "learn") {
      const confirmed = window.confirm(
        "Thoát bây giờ sẽ mất tiến độ bài học này. Bạn có chắc chắn?",
      );
      if (!confirmed) return;
    }
    navigate("/learn");
  };

  const handleNextQuiz = () => {
    if (quizIndex + 1 >= lesson.questions.length) setPhase("pronunciation");
    else setQuizIndex((i) => i + 1);
  };

  const handleNextPronunciation = () => {
    const { word } = lesson.pronunciationWords[pronIndex]; // destructure .word
    const hasResult =
      word in pronResults ? pronResults : { ...pronResults, [word]: false };
    setPronResults(hasResult);

    if (pronIndex + 1 >= lesson.pronunciationWords.length)
      submitLesson(hasResult);
    else setPronIndex((i) => i + 1);
  };

  if (loadError) {
    return (
      <MainLayout>
        <div className="text-center py-16">
          <p className="text-sm text-red-500 dark:text-red-400 mb-4">
            {loadError}
          </p>
          <button
            onClick={() => navigate("/learn")}
            className="text-sm font-bold text-[#58cc02]"
          >
            ← Quay lại lộ trình
          </button>
        </div>
      </MainLayout>
    );
  }
  if (!lesson) {
    return (
      <MainLayout>
        <p className="text-sm text-gray-400 dark:text-gray-500 py-16 text-center">
          Đang tải bài học...
        </p>
      </MainLayout>
    );
  }

  if (submitting) {
    return (
      <MainLayout>
        <p className="text-sm text-gray-400 dark:text-gray-500 py-16 text-center">
          Đang chấm điểm...
        </p>
      </MainLayout>
    );
  }

  if (result) {
    const scoreCards = [
      { label: "Câu hỏi", value: result.quizScore },
      { label: "Phát âm", value: result.pronunciationScore },
      { label: "Tổng", value: result.combinedScore, highlight: true },
    ];
    return (
      <MainLayout>
        <div className="max-w-[460px] mx-auto text-center py-12">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
            Hoàn thành bài học!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Kết quả đã được ghi vào tiến độ chủ đề.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {scoreCards.map((c) => (
              <div
                key={c.label}
                className={`rounded-2xl p-4 border-2 ${
                  c.highlight
                    ? "border-[#58cc02] bg-[#58cc02]/5"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <p
                  className={`text-2xl font-extrabold ${c.highlight ? "text-[#58cc02]" : "text-gray-900 dark:text-white"}`}
                >
                  {Math.round(c.value)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {c.label}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-200 dark:border-gray-700
                         text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Làm lại
            </button>
            <button
              onClick={() => navigate("/learn")}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-[#58cc02] hover:bg-[#4cb001] transition-colors"
            >
              Về lộ trình
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[520px] mx-auto py-8">
        <BackButton onClick={handleExit} />
        <StepIndicator phase={phase} />

        {/* ============ GIAI ĐOẠN 1: HỌC TỪ ============ */}
        {phase === "learn" && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
              Xem qua {lesson.vocabulary.length} từ mới, sau đó làm câu hỏi và
              luyện phát âm.
            </p>

            <div className="space-y-3 mb-8">
              {lesson.vocabulary.map((v) => (
                <div
                  key={v.wordId}
                  className="relative p-4 pr-16 rounded-2xl border border-gray-200 dark:border-gray-700 text-center"
                >
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {v.word}
                  </p>
                  {v.pronunciation && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                      {v.pronunciation}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {v.meaningVi}
                  </p>

                  <button
                    type="button"
                    onClick={() => speak(v.word)}
                    aria-label={`Nghe phát âm từ ${v.word}`}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700
                       flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase("quiz")}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-[#58cc02] hover:bg-[#4cb001] transition-colors"
            >
              Làm câu hỏi →
            </button>
          </div>
        )}

        {/* ============ GIAI ĐOẠN 2: CÂU HỎI ============ */}
        {phase === "quiz" &&
          (() => {
            const q = lesson.questions[quizIndex];
            const selected = quizAnswers[q.id];
            return (
              <div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <span>
                    Câu {quizIndex + 1}/{lesson.questions.length}
                  </span>
                </div>
                <ProgressBar
                  current={quizIndex}
                  total={lesson.questions.length}
                />

                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
                  {q.questionText}
                </p>

                <div className="space-y-3 mb-6">
                  {OPTION_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setQuizAnswers((prev) => ({ ...prev, [q.id]: key }))
                      }
                      className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                        selected === key
                          ? "border-[#58cc02] bg-[#58cc02]/5"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <span className="font-bold mr-2">{key}.</span>
                      {q[`option${key}`]}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNextQuiz}
                  disabled={!selected}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-[#58cc02] hover:bg-[#4cb001]
                           disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  {quizIndex + 1 >= lesson.questions.length
                    ? "Sang phần phát âm →"
                    : "Tiếp tục →"}
                </button>
              </div>
            );
          })()}

        {/* ============ GIAI ĐOẠN 3: PHÁT ÂM ============ */}
        {phase === "pronunciation" &&
          (() => {
            const { word, pronunciation } =
              lesson.pronunciationWords[pronIndex];
            const hasResult = word in pronResults;
            const isLast = pronIndex + 1 >= lesson.pronunciationWords.length;
            return (
              <div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <span>
                    Từ {pronIndex + 1}/{lesson.pronunciationWords.length}
                  </span>
                </div>
                <ProgressBar
                  current={pronIndex}
                  total={lesson.pronunciationWords.length}
                />

                <PronunciationPractice
                  key={word} // đổi từ -> remount, xóa sạch transcript/kết quả của từ trước
                  targetWord={word}
                  pronunciation={pronunciation}
                  onResult={(isCorrect) =>
                    setPronResults((prev) => ({ ...prev, [word]: isCorrect }))
                  }
                />

                <button
                  onClick={handleNextPronunciation}
                  className={`w-full mt-6 py-3.5 rounded-xl font-bold transition-colors ${
                    hasResult
                      ? "text-white bg-[#58cc02] hover:bg-[#4cb001]"
                      : "border-2 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {hasResult
                    ? isLast
                      ? "Hoàn thành ✓"
                      : "Tiếp tục →"
                    : "Bỏ qua"}
                </button>

                {submitError && (
                  <p className="text-sm text-red-500 dark:text-red-400 text-center mt-3">
                    {submitError}
                  </p>
                )}
              </div>
            );
          })()}
      </div>
    </MainLayout>
  );
}
