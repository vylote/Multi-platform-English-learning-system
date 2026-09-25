import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import MainLayout from "../layouts/MainLayout";
import PronunciationPractice from "../components/PronunciationPractice";

const EXERCISE_COUNT = 10;

function normalizeAnswer(text) {
  return text.trim().toLowerCase().replace(/[^\w\s-]/g, "");
}

export default function TopicLessonPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();

  const [exercises, setExercises] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [fillInput, setFillInput] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api
      .get(`/lessons/topics/${topicId}`, { params: { count: EXERCISE_COUNT }, signal: controller.signal })
      .then((res) => setExercises(res.data?.result || []))
      .catch((error) => {
        if (error.code === "ERR_CANCELED") return;
        setLoadError(error.response?.data?.message || "Không thể tải bài luyện tập.");
        setExercises([]);
      });
    return () => controller.abort();
  }, [topicId]);

  const currentExercise = exercises?.[currentIndex];
  const isDone = exercises !== null && currentIndex >= exercises.length;

  const goNext = useCallback(() => {
    setFeedback(null);
    setSelectedOption(null);
    setFillInput("");
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handleSelectOption = (option) => {
    if (feedback) return;
    setSelectedOption(option);
    const isCorrect = option === currentExercise.meaningVi;
    setFeedback(isCorrect ? "correct" : "incorrect");
    if (isCorrect) setScore((s) => s + 1);
  };

  const handleSubmitFillBlank = (e) => {
    e.preventDefault();
    if (feedback) return;
    const isCorrect = normalizeAnswer(fillInput) === normalizeAnswer(currentExercise.word);
    setFeedback(isCorrect ? "correct" : "incorrect");
    if (isCorrect) setScore((s) => s + 1);
  };

  const handlePronunciationResult = (isCorrect) => {
    if (feedback) return;
    setFeedback(isCorrect ? "correct" : "incorrect");
    if (isCorrect) setScore((s) => s + 1);
  };

  if (loadError) {
    return (
      <MainLayout>
        <p className="text-sm text-red-500 dark:text-red-400 py-10 text-center">{loadError}</p>
      </MainLayout>
    );
  }
  if (exercises === null) {
    return (
      <MainLayout>
        <p className="text-sm text-gray-400 dark:text-gray-500 py-10 text-center">Đang tải bài luyện tập...</p>
      </MainLayout>
    );
  }
  if (exercises.length === 0) {
    return (
      <MainLayout>
        <p className="text-sm text-gray-400 dark:text-gray-500 py-10 text-center">
          Chủ đề này chưa có đủ từ vựng để luyện tập.
        </p>
      </MainLayout>
    );
  }

  if (isDone) {
    return (
      <MainLayout>
        <div className="max-w-[420px] mx-auto text-center py-16">
          <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hoàn thành bài luyện tập!</p>
          <p className="text-4xl font-extrabold text-[#58cc02] mb-6">
            {score}/{exercises.length}
          </p>
          <button
            onClick={() => navigate("/learn")}
            className="px-6 py-3 rounded-xl font-bold text-white bg-[#58cc02] hover:bg-[#4cb001] transition-colors"
          >
            Quay lại lộ trình
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[480px] mx-auto py-8">
        <div className="flex justify-between items-center mb-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Câu {currentIndex + 1}/{exercises.length}</span>
          <span>Điểm: {score}</span>
        </div>

        <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden mb-8">
          <div
            className="h-full bg-[#58cc02] transition-all duration-300 rounded-full"
            style={{ width: `${(currentIndex / exercises.length) * 100}%` }}
          />
        </div>

        {currentExercise.exerciseType === "multiple_choice" && (
          <div>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">Chọn nghĩa đúng của từ:</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{currentExercise.word}</p>

            <div className="space-y-3 mb-6">
              {currentExercise.options.map((opt) => {
                const isSelected = selectedOption === opt;
                const isCorrectOpt = opt === currentExercise.meaningVi;
                let style = "border-gray-200 dark:border-gray-700 hover:border-gray-400";
                if (feedback && isCorrectOpt) style = "border-[#58cc02] bg-[#58cc02]/5";
                else if (feedback && isSelected && !isCorrectOpt) style = "border-red-400 bg-red-50 dark:bg-red-900/10";

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    disabled={!!feedback}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${style}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentExercise.exerciseType === "fill_blank" && (
          <form onSubmit={handleSubmitFillBlank}>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">Điền từ tiếng Anh có nghĩa là:</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{currentExercise.meaningVi}</p>

            <input
              type="text"
              value={fillInput}
              onChange={(e) => setFillInput(e.target.value)}
              disabled={!!feedback}
              autoFocus
              placeholder="Nhập từ tiếng Anh..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-transparent
                         focus:outline-none focus:border-[#58cc02] disabled:opacity-60 mb-4"
            />

            {!feedback && (
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-white bg-[#58cc02] hover:bg-[#4cb001] transition-colors"
              >
                Kiểm tra
              </button>
            )}

            {feedback === "incorrect" && (
              <p className="text-sm text-red-500 dark:text-red-400 mb-4">
                Đáp án đúng: <span className="font-semibold">{currentExercise.word}</span>
              </p>
            )}
          </form>
        )}

        {currentExercise.exerciseType === "pronunciation" && (
          <PronunciationPractice targetWord={currentExercise.word} onResult={handlePronunciationResult} />
        )}

        {feedback && (
          <button
            onClick={goNext}
            className="w-full mt-6 py-3 rounded-xl font-bold text-white bg-[#1cb0f6] hover:bg-[#189fdf] transition-colors"
          >
            Tiếp tục →
          </button>
        )}
      </div>
    </MainLayout>
  );
}