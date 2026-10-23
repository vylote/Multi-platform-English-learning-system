import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import MainLayout from "../layouts/MainLayout";
import PronunciationPractice from "../components/PronunciationPractice";

const PHASES = [
  { key: "learn", label: "Học từ vựng" },
  { key: "quiz", label: "Trắc nghiệm" },
  { key: "pronunciation", label: "Luyện phát âm" },
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
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs hover:border-[#58cc02] dark:hover:border-[#58cc02] transition-all cursor-pointer group active:scale-95 mb-6"
    >
      <span className="group-hover:-translate-x-1 transition-transform">←</span>
      <span>Quay lại lộ trình</span>
    </button>
  );
}

function StepIndicator({ phase }) {
  const currentIdx = PHASES.findIndex((p) => p.key === phase);
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
      {PHASES.map((p, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <div
            key={p.key}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              isActive
                ? "bg-[#58cc02] text-white shadow-xs shadow-[#58cc02]/30 scale-105"
                : isDone
                  ? "bg-[#58cc02]/15 text-[#58cc02] border border-[#58cc02]/30"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200/60 dark:border-gray-700/60"
            }`}
          >
            <span>{isDone ? "✓" : `${i + 1}.`}</span>
            <span>{p.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({ current, total }) {
  return (
    <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden mb-6">
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
            className="text-sm font-bold text-[#58cc02] hover:underline"
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
        <div className="text-center py-24">
          <div className="w-10 h-10 border-4 border-[#58cc02] border-t-transparent rounded-full animate-spin mb-4 inline-block" />
          <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold">
            Đang chuẩn bị nội dung bài học...
          </p>
        </div>
      </MainLayout>
    );
  }

  if (submitting) {
    return (
      <MainLayout>
        <div className="text-center py-24">
          <div className="w-10 h-10 border-4 border-[#58cc02] border-t-transparent rounded-full animate-spin mb-4 inline-block" />
          <p className="text-sm text-gray-400 dark:text-gray-500 font-semibold">
            Đang chấm điểm và ghi nhận tiến độ...
          </p>
        </div>
      </MainLayout>
    );
  }

  if (result) {
    const scoreCards = [
      { label: "Trắc nghiệm", value: result.quizScore, icon: "✏️" },
      { label: "Phát âm", value: result.pronunciationScore, icon: "🎙️" },
      { label: "Tổng kết quả", value: result.combinedScore, icon: "🏆", highlight: true },
    ];
    return (
      <MainLayout>
        <div className="max-w-[500px] mx-auto text-center py-10 px-4">
          <div className="w-16 h-16 rounded-3xl bg-[#58cc02]/10 border-2 border-[#58cc02]/30 text-3xl flex items-center justify-center mx-auto mb-4">
            🎉
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2">
            Hoàn thành bài học!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-8">
            Kết quả của bạn đã được cập nhật trực tiếp vào lộ trình học tập.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {scoreCards.map((c) => (
              <div
                key={c.label}
                className={`rounded-3xl p-4 sm:p-5 border-2 ${
                  c.highlight
                    ? "border-[#58cc02] bg-[#58cc02]/10 dark:bg-[#58cc02]/15 shadow-sm"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                }`}
              >
                <span className="text-lg block mb-1">{c.icon}</span>
                <p
                  className={`text-2xl sm:text-3xl font-black ${
                    c.highlight ? "text-[#58cc02]" : "text-gray-900 dark:text-white"
                  }`}
                >
                  {Math.round(c.value)}%
                </p>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
                  {c.label}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-[#58cc02] hover:text-[#58cc02] transition-all cursor-pointer shadow-2xs"
            >
              🔄 Học lại
            </button>
            <button
              onClick={() => navigate("/learn")}
              className="flex-1 py-3.5 rounded-2xl font-black text-sm uppercase text-white bg-[#58cc02] hover:bg-[#4cb001] transition-all shadow-md shadow-[#58cc02]/25 cursor-pointer"
            >
              Về lộ trình →
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[560px] mx-auto py-6 px-4">
        <div className="flex items-center justify-between">
          <BackButton onClick={handleExit} />
        </div>

        <StepIndicator phase={phase} />

        {/* ============ GIAI ĐOẠN 1: HỌC TỪ ============ */}
        {phase === "learn" && (
          <div>
            <div className="mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-1">
                Làm quen với {lesson.vocabulary.length} từ mới
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Bấm vào biểu tượng loa để nghe phát âm và ghi nhớ ý nghĩa trước khi làm trắc nghiệm.
              </p>
            </div>

            <div className="space-y-3.5 mb-8">
              {lesson.vocabulary.map((v) => (
                <div
                  key={v.wordId}
                  className="group bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#58cc02] dark:hover:border-[#58cc02] rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex items-start justify-between gap-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {v.word}
                      </span>
                      {v.pronunciation && (
                        <span className="text-xs font-mono text-[#58cc02] font-bold px-2.5 py-0.5 rounded-lg bg-[#58cc02]/10 border border-[#58cc02]/20">
                          {v.pronunciation}
                        </span>
                      )}
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                      {v.meaningVi}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => speak(v.word)}
                    aria-label={`Nghe phát âm từ ${v.word}`}
                    title="Nghe phát âm"
                    className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700/80 hover:bg-[#58cc02] text-gray-600 dark:text-gray-300 hover:text-white flex items-center justify-center text-xl shrink-0 transition-all active:scale-90 shadow-2xs cursor-pointer group-hover:bg-[#58cc02]/10 group-hover:text-[#58cc02]"
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase("quiz")}
              className="w-full py-4 rounded-2xl font-black text-base uppercase bg-[#58cc02] hover:bg-[#4cb001] text-white shadow-md shadow-[#58cc02]/25 hover:shadow-lg hover:-translate-y-0.5 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Bắt đầu làm câu hỏi trắc nghiệm</span>
              <span className="text-lg">→</span>
            </button>
          </div>
        )}

        {/* ============ GIAI ĐOẠN 2: CÂU HỎI ============ */}
        {phase === "quiz" &&
          (() => {
            const q = lesson.questions[quizIndex];
            const selected = quizAnswers[q.id];
            return (
              <div className="text-left">
                <div className="flex justify-between items-center text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                  <span className="uppercase tracking-wider">
                    Câu hỏi {quizIndex + 1}/{lesson.questions.length}
                  </span>
                  <span className="text-[#58cc02]">
                    {Math.round(((quizIndex + 1) / lesson.questions.length) * 100)}%
                  </span>
                </div>
                <ProgressBar
                  current={quizIndex + 1}
                  total={lesson.questions.length}
                />

                <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-3xl p-6 sm:p-7 shadow-xs mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mb-3 inline-block">
                    Chọn đáp án đúng
                  </span>
                  <p className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white leading-relaxed">
                    {q.questionText}
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {OPTION_KEYS.map((key) => {
                    const isSelected = selected === key;
                    return (
                      <div
                        key={key}
                        onClick={() =>
                          setQuizAnswers((prev) => ({ ...prev, [q.id]: key }))
                        }
                        className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer flex items-center gap-4 transition-all active:scale-[0.99] ${
                          isSelected
                            ? "border-[#58cc02] bg-[#58cc02]/10 dark:bg-[#58cc02]/15 shadow-sm"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                            isSelected
                              ? "bg-[#58cc02] text-white shadow-xs"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {key}
                        </div>
                        <span
                          className={`text-sm sm:text-base font-medium flex-1 ${
                            isSelected
                              ? "text-gray-900 dark:text-white font-bold"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {q[`option${key}`]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleNextQuiz}
                  disabled={!selected}
                  className="w-full py-4 rounded-2xl font-black text-base uppercase text-white bg-[#58cc02] hover:bg-[#4cb001] disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-[#58cc02]/25 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>
                    {quizIndex + 1 >= lesson.questions.length
                      ? "Sang phần luyện phát âm"
                      : "Tiếp tục"}
                  </span>
                  <span>→</span>
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
                <div className="flex justify-between items-center text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                  <span className="uppercase tracking-wider">
                    Từ {pronIndex + 1}/{lesson.pronunciationWords.length}
                  </span>
                  <span className="text-[#58cc02]">
                    {Math.round(((pronIndex + 1) / lesson.pronunciationWords.length) * 100)}%
                  </span>
                </div>
                <ProgressBar
                  current={pronIndex + 1}
                  total={lesson.pronunciationWords.length}
                />

                <PronunciationPractice
                  key={word}
                  targetWord={word}
                  pronunciation={pronunciation}
                  onResult={(isCorrect) =>
                    setPronResults((prev) => ({ ...prev, [word]: isCorrect }))
                  }
                />

                <button
                  onClick={handleNextPronunciation}
                  className={`w-full mt-6 py-4 rounded-2xl font-black text-base uppercase transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${
                    hasResult
                      ? "text-white bg-[#58cc02] hover:bg-[#4cb001] shadow-[#58cc02]/25"
                      : "border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-[#58cc02] hover:text-[#58cc02]"
                  }`}
                >
                  <span>
                    {hasResult
                      ? isLast
                        ? "Hoàn thành bài học"
                        : "Từ kế tiếp"
                      : "Bỏ qua từ này"}
                  </span>
                  <span>→</span>
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
