package com.els.app.ui.auth;

import android.os.Bundle;
import android.os.CountDownTimer;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.widget.NestedScrollView;

import com.els.app.R;
import com.els.app.data.remote.api.AuthApiService;
import com.els.app.data.remote.api.LearningApiService;
import com.els.app.data.remote.dto.ApiModels;
import com.els.app.data.remote.dto.response.UserResponse;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;
import com.els.app.ui.NavHelper;
import com.els.app.util.Labels;
import com.els.app.util.SessionManager;
import com.els.app.util.TimeUtil;
import com.google.android.material.button.MaterialButton;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Làm bài thi - dùng cho CẢ HAI trường hợp:
 *   - Đề thi thường : Intent có EXTRA_EXAM_ID
 *   - Thi đầu vào   : Intent có EXTRA_PLACEMENT = true (tương đương PlacementTestPage.jsx)
 * Luồng API: (placement-exam) -> start -> [làm bài] -> submit   (hoặc cancel nếu thoát giữa chừng)
 * Giữ nguyên layout activity_quiz.xml đã có.
 */
public class QuizActivity extends AppCompatActivity {

    public static final String EXTRA_EXAM_ID = "exam_id";
    public static final String EXTRA_PLACEMENT = "placement";

    private static final String[] LETTERS = {"A", "B", "C", "D"};

    private LearningApiService api;
    private long examId;
    private boolean placement;
    private long sessionId;
    private boolean submitting = false;
    private boolean finished = false;

    private final List<ApiModels.QuestionDto> questions = new ArrayList<>();
    private final Map<Long, String> answers = new HashMap<>();
    private int current = 0;
    private CountDownTimer timer;

    private TextView tvQuestionCounter, tvTimer, tvQuestionType, tvQuestionText;
    private android.widget.ProgressBar progressBarQuiz;
    private NestedScrollView scrollContent, scrollResult;
    private MaterialButton btnNextQuestion;
    private final CardView[] optionCards = new CardView[4];
    private final TextView[] optionTexts = new TextView[4];

    private TextView tvResultEmoji, tvResultTitle, tvResultScore, tvResultCorrect, tvResultWrong;
    private ApiModels.ExamResult lastResult;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_quiz);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });

        api = RetrofitClient.create(this, LearningApiService.class);
        placement = getIntent().getBooleanExtra(EXTRA_PLACEMENT, false);
        examId = getIntent().getLongExtra(EXTRA_EXAM_ID, 0);

        initViews();

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                confirmExit();
            }
        });

        loadExam();
    }

    private void initViews() {
        tvQuestionCounter = findViewById(R.id.tvQuestionCounter);
        tvTimer = findViewById(R.id.tvTimer);
        progressBarQuiz = findViewById(R.id.progressBarQuiz);
        tvQuestionType = findViewById(R.id.tvQuestionType);
        tvQuestionText = findViewById(R.id.tvQuestionText);
        scrollContent = findViewById(R.id.scrollContent);
        scrollResult = findViewById(R.id.scrollResult);
        btnNextQuestion = findViewById(R.id.btnNextQuestion);

        int[] cardIds = {R.id.cardOptionA, R.id.cardOptionB, R.id.cardOptionC, R.id.cardOptionD};
        int[] textIds = {R.id.tvOptionTextA, R.id.tvOptionTextB, R.id.tvOptionTextC, R.id.tvOptionTextD};
        for (int i = 0; i < 4; i++) {
            final int index = i;
            optionCards[i] = findViewById(cardIds[i]);
            optionTexts[i] = findViewById(textIds[i]);
            optionCards[i].setOnClickListener(v -> selectOption(index));
        }

        tvResultEmoji = findViewById(R.id.tvResultEmoji);
        tvResultTitle = findViewById(R.id.tvResultTitle);
        tvResultScore = findViewById(R.id.tvResultScore);
        tvResultCorrect = findViewById(R.id.tvResultCorrect);
        tvResultWrong = findViewById(R.id.tvResultWrong);

        findViewById(R.id.btnClose).setOnClickListener(v -> confirmExit());
        btnNextQuestion.setOnClickListener(v -> onNextClicked());
        findViewById(R.id.btnReviewAnswers).setOnClickListener(v -> showReview());
        findViewById(R.id.btnFinishQuiz).setOnClickListener(v -> onFinishClicked());
    }

    // ------------------------------------------------------------------
    // 1) Tải đề + bắt đầu phiên
    // ------------------------------------------------------------------
    private void loadExam() {
        tvQuestionText.setText("Đang tải đề thi...");
        tvQuestionType.setText(placement ? "Kiểm tra đầu vào" : "Đề thi");
        btnNextQuestion.setEnabled(false);

        if (placement) {
            api.getPlacementExam().enqueue(new ApiCallback<ApiModels.ExamDto>() {
                @Override
                public void onSuccess(ApiModels.ExamDto exam) {
                    examId = exam.getId();
                    startExam();
                }

                @Override
                public void onError(String message) {
                    fail(message);
                }
            });
        } else {
            startExam();
        }
    }

    private void startExam() {
        // pageSize=100: lấy toàn bộ câu hỏi trong 1 lần (web chia trang 10 câu)
        api.startExam(examId, 1, 100).enqueue(new ApiCallback<ApiModels.ExamStartResult>() {
            @Override
            public void onSuccess(ApiModels.ExamStartResult r) {
                sessionId = r.getSessionId();
                questions.clear();
                if (r.getQuestions() != null && r.getQuestions().getData() != null) {
                    questions.addAll(r.getQuestions().getData());
                }
                if (questions.isEmpty()) {
                    fail("Đề thi chưa có câu hỏi.");
                    return;
                }
                startTimer(r.getDuration(), r.getStartedAt());
                showQuestion(0);
            }

            @Override
            public void onError(String message) {
                fail(message);
            }
        });
    }

    private void fail(String message) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        finish();
    }

    // ------------------------------------------------------------------
    // 2) Đồng hồ đếm ngược (tính theo started_at của server để tiếp tục phiên dở)
    // ------------------------------------------------------------------
    private void startTimer(int durationMinutes, String startedAt) {
        long totalSeconds = durationMinutes * 60L;
        long remaining = totalSeconds;
        try {
            long elapsed = (System.currentTimeMillis() - Instant.parse(startedAt).toEpochMilli()) / 1000;
            remaining = Math.min(totalSeconds, Math.max(5, totalSeconds - elapsed));
        } catch (Exception ignored) {
            // lệch giờ / sai định dạng -> dùng đủ thời gian
        }

        timer = new CountDownTimer(remaining * 1000, 1000) {
            @Override
            public void onTick(long ms) {
                long s = ms / 1000;
                tvTimer.setText(String.format(Locale.getDefault(), "⏱ %02d:%02d", s / 60, s % 60));
            }

            @Override
            public void onFinish() {
                tvTimer.setText("⏱ 00:00");
                Toast.makeText(QuizActivity.this, "Hết giờ! Đang nộp bài...", Toast.LENGTH_SHORT).show();
                submit();
            }
        }.start();
    }

    // ------------------------------------------------------------------
    // 3) Hiển thị câu hỏi / chọn đáp án
    // ------------------------------------------------------------------
    private void showQuestion(int index) {
        current = index;
        ApiModels.QuestionDto q = questions.get(index);

        tvQuestionCounter.setText("Câu " + (index + 1) + "/" + questions.size());
        progressBarQuiz.setProgress(((index + 1) * 100) / questions.size());
        tvQuestionText.setText(q.getQuestionText());

        String[] opts = {q.getOptionA(), q.getOptionB(), q.getOptionC(), q.getOptionD()};
        for (int i = 0; i < 4; i++) optionTexts[i].setText(opts[i]);

        highlight(answers.get(q.getId()));
        btnNextQuestion.setText(index == questions.size() - 1 ? "Nộp bài" : "Câu tiếp theo");
    }

    private void selectOption(int index) {
        if (submitting || questions.isEmpty()) return;
        answers.put(questions.get(current).getId(), LETTERS[index]);
        highlight(LETTERS[index]);
    }

    private void highlight(String selectedLetter) {
        for (int i = 0; i < 4; i++) {
            boolean selected = LETTERS[i].equals(selectedLetter);
            optionCards[i].setCardBackgroundColor(selected ? 0xFFE0E7FF : 0xFFFFFFFF);
        }
        btnNextQuestion.setEnabled(selectedLetter != null);
    }

    private void onNextClicked() {
        if (current < questions.size() - 1) {
            showQuestion(current + 1);
        } else {
            new AlertDialog.Builder(this)
                    .setTitle("Nộp bài?")
                    .setMessage("Bạn đã trả lời " + answers.size() + "/" + questions.size() + " câu.")
                    .setPositiveButton("Nộp bài", (d, w) -> submit())
                    .setNegativeButton("Xem lại", null)
                    .show();
        }
    }

    // ------------------------------------------------------------------
    // 4) Nộp bài
    // ------------------------------------------------------------------
    private void submit() {
        if (submitting || finished) return;
        submitting = true;
        btnNextQuestion.setEnabled(false);
        if (timer != null) timer.cancel();

        List<ApiModels.Answer> list = new ArrayList<>();
        for (Map.Entry<Long, String> e : answers.entrySet()) {
            list.add(new ApiModels.Answer(e.getKey(), e.getValue()));
        }

        api.submitExam(examId, new ApiModels.SubmitExamRequest(
                        sessionId, list, TimeUtil.offsetMinutes()))
                .enqueue(new ApiCallback<ApiModels.ExamResult>() {
                    @Override
                    public void onSuccess(ApiModels.ExamResult result) {
                        finished = true;
                        showResult(result);
                    }

                    @Override
                    public void onError(String message) {
                        submitting = false;
                        btnNextQuestion.setEnabled(true);
                        Toast.makeText(QuizActivity.this, message, Toast.LENGTH_LONG).show();
                    }
                });
    }

    private void showResult(ApiModels.ExamResult r) {
        lastResult = r;
        scrollContent.setVisibility(View.GONE);
        btnNextQuestion.setVisibility(View.GONE);
        scrollResult.setVisibility(View.VISIBLE);

        tvResultEmoji.setText("🎉");
        tvResultTitle.setText(placement && r.getTierAssigned() != null
                ? "Trình độ của bạn: " + Labels.tier(r.getTierAssigned())
                : "Hoàn thành bài thi!");
        tvResultScore.setText(String.format(Locale.getDefault(), "%.1f/10", r.getScore()));
        tvResultCorrect.setText("Đúng: " + r.getCorrectCount() + " câu");
        tvResultWrong.setText("Sai: " + (r.getTotalQuestions() - r.getCorrectCount()) + " câu");
    }

    private void showReview() {
        if (lastResult == null || lastResult.getReview() == null) return;
        StringBuilder sb = new StringBuilder();
        int i = 1;
        for (ApiModels.ReviewItem item : lastResult.getReview()) {
            sb.append("Câu ").append(i++).append(": ").append(item.getQuestionText()).append("\n");
            sb.append(item.isCorrect() ? "✅ " : "❌ ")
                    .append("Bạn chọn: ")
                    .append(item.getSelectedOption() == null ? "(bỏ trống)" : item.getSelectedOption())
                    .append("  ·  Đáp án: ").append(item.getCorrectOption()).append("\n\n");
        }
        new AlertDialog.Builder(this)
                .setTitle("Xem lại đáp án")
                .setMessage(sb.toString().trim())
                .setPositiveButton("Đóng", null)
                .show();
    }

    private void onFinishClicked() {
        if (!placement) {
            finish();
            return;
        }
        // Thi đầu vào xong: backend đã cập nhật tier -> lấy lại hồ sơ rồi vào Home
        RetrofitClient.create(this, AuthApiService.class).me()
                .enqueue(new ApiCallback<UserResponse>() {
                    @Override
                    public void onSuccess(UserResponse user) {
                        new SessionManager(QuizActivity.this).saveUser(user);
                        NavHelper.routeAfterAuth(QuizActivity.this);
                    }

                    @Override
                    public void onError(String message) {
                        Toast.makeText(QuizActivity.this, message, Toast.LENGTH_LONG).show();
                    }
                });
    }

    // ------------------------------------------------------------------
    // 5) Thoát giữa chừng -> huỷ phiên (giống PlacementTestPage / ExamTakingPage)
    // ------------------------------------------------------------------
    private void confirmExit() {
        if (finished || questions.isEmpty()) {
            finish();
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle("Thoát bài thi?")
                .setMessage("Tiến độ làm bài sẽ không được lưu.")
                .setPositiveButton("Thoát", (d, w) -> {
                    api.cancelExam(examId, new ApiModels.CancelExamRequest(sessionId))
                            .enqueue(new ApiCallback<Object>() {
                                @Override public void onSuccess(Object result) { }
                                @Override public void onError(String message) { }
                            });
                    finish();
                })
                .setNegativeButton("Tiếp tục làm", null)
                .show();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (timer != null) timer.cancel();
    }
}
