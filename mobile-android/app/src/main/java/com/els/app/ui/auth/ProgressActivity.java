package com.els.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.els.app.R;
import com.els.app.data.remote.api.LearningApiService;
import com.els.app.data.remote.dto.ApiModels;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;
import com.els.app.util.Labels;
import com.els.app.util.TimeUtil;
import com.google.android.material.bottomnavigation.BottomNavigationView;

import java.time.LocalDate;
import java.util.List;

public class ProgressActivity extends AppCompatActivity {

    private TextView tvOverviewPercent;
    private ProgressBar progressBarOverview;
    private TextView tvStatLessons;
    private TextView tvStatStreak;
    private TextView tvStatTime;

    private TextView tvVocabPercent;
    private TextView tvGrammarPercent;
    private TextView tvQuizPercent;

    private ProgressBar progressVocab;
    private ProgressBar progressGrammar;
    private ProgressBar progressQuiz;

    private BottomNavigationView bottomNav;

    private LearningApiService api;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_progress);

        // Chỉ áp padding top/left/right cho root
        ViewCompat.setOnApplyWindowInsetsListener(
                findViewById(R.id.main),
                (v, insets) -> {
                    Insets systemBars = insets.getInsets(
                            WindowInsetsCompat.Type.systemBars()
                    );

                    v.setPadding(
                            systemBars.left,
                            systemBars.top,
                            systemBars.right,
                            0
                    );

                    return insets;
                }
        );

        initViews();

        api = RetrofitClient.create(this, LearningApiService.class);

        setupBottomNav();
    }

    private void initViews() {

        tvOverviewPercent = findViewById(R.id.tvOverviewPercent);
        progressBarOverview = findViewById(R.id.progressBarOverview);

        tvStatLessons = findViewById(R.id.tvStatLessons);
        tvStatStreak = findViewById(R.id.tvStatStreak);
        tvStatTime = findViewById(R.id.tvStatTime);

        tvVocabPercent = findViewById(R.id.tvVocabPercent);
        tvGrammarPercent = findViewById(R.id.tvGrammarPercent);
        tvQuizPercent = findViewById(R.id.tvQuizPercent);

        progressVocab = findViewById(R.id.progressVocab);
        progressGrammar = findViewById(R.id.progressGrammar);
        progressQuiz = findViewById(R.id.progressQuiz);

        bottomNav = findViewById(R.id.bottomNav);

        // Đảm bảo bottomNav có padding đúng theo vùng system bar
        ViewCompat.setOnApplyWindowInsetsListener(
                bottomNav,
                (v, insets) -> {
                    Insets systemBars = insets.getInsets(
                            WindowInsetsCompat.Type.systemBars()
                    );

                    v.setPadding(
                            v.getPaddingLeft(),
                            v.getPaddingTop(),
                            v.getPaddingRight(),
                            systemBars.bottom
                    );

                    return insets;
                }
        );
    }

    // =========================
    // LẤY DỮ LIỆU TIẾN ĐỘ TỪ API
    // =========================

    private void bindData() {

        int tz = TimeUtil.offsetMinutes();

        // 1. Tổng quan và tiến độ theo kỹ năng
        // Dữ liệu được tính từ lộ trình học tập
        api.getLearningPath().enqueue(
                new ApiCallback<ApiModels.LearningPath>() {

                    @Override
                    public void onSuccess(ApiModels.LearningPath lp) {

                        if (lp == null) {
                            return;
                        }

                        List<ApiModels.PathTopic> path = lp.getPath();

                        int total = path == null ? 0 : path.size();

                        int sumMastery = 0;
                        int passed = 0;

                        int words = 0;
                        int mastered = 0;

                        double lessonSum = 0;
                        int lessonCount = 0;

                        for (int i = 0; i < total; i++) {

                            ApiModels.PathTopic topic = path.get(i);

                            sumMastery += topic.getMasteryPercent();

                            if (topic.getMasteryPercent() >= 60) {
                                passed++;
                            }

                            words += topic.getTotalWords();
                            mastered += topic.getMasteredWords();

                            if (topic.getBestLessonScore() != null) {
                                lessonSum += topic.getBestLessonScore();
                                lessonCount++;
                            }
                        }

                        // Tiến độ tổng = trung bình Mastery các chủ đề
                        int overall = total == 0
                                ? 0
                                : sumMastery / total;

                        tvOverviewPercent.setText(overall + "%");
                        progressBarOverview.setProgress(overall);

                        // Số chủ đề đạt từ 60%
                        tvStatLessons.setText(
                                passed + "/" + total + "\nChủ đề đạt"
                        );

                        // Hiển thị trình độ hiện tại
                        tvStatTime.setText(
                                Labels.difficulty(lp.getTier()) + "\nTrình độ"
                        );

                        // Tiến độ từ vựng
                        int vocabPercent = words == 0
                                ? 0
                                : (mastered * 100) / words;

                        tvVocabPercent.setText(vocabPercent + "%");
                        progressVocab.setProgress(vocabPercent);

                        // Tiến độ bài luyện tập
                        // Trung bình điểm tốt nhất của các bài học
                        int lessonPercent = lessonCount == 0
                                ? 0
                                : (int) Math.round(
                                lessonSum / lessonCount
                        );

                        tvGrammarPercent.setText(lessonPercent + "%");
                        progressGrammar.setProgress(lessonPercent);
                    }

                    @Override
                    public void onError(String message) {

                        Toast.makeText(
                                ProgressActivity.this,
                                message,
                                Toast.LENGTH_SHORT
                        ).show();
                    }
                }
        );

        // 2. Chuỗi ngày học hiện tại
        api.getStreakStatus(tz).enqueue(
                new ApiCallback<ApiModels.StreakStatus>() {

                    @Override
                    public void onSuccess(ApiModels.StreakStatus streak) {

                        if (streak == null) {
                            return;
                        }

                        tvStatStreak.setText(
                                streak.getCurrentStreak() + "\nNgày streak"
                        );
                    }

                    @Override
                    public void onError(String message) {
                        // Không làm gián đoạn màn hình tiến độ
                    }
                }
        );

        // 3. Biểu đồ hoạt động 7 ngày gần nhất
        api.getStreakWeek(tz).enqueue(
                new ApiCallback<List<ApiModels.StreakDay>>() {

                    @Override
                    public void onSuccess(List<ApiModels.StreakDay> days) {

                        if (days == null) {
                            return;
                        }

                        View[] bars = {
                                findViewById(R.id.barMon),
                                findViewById(R.id.barTue),
                                findViewById(R.id.barWed),
                                findViewById(R.id.barThu),
                                findViewById(R.id.barFri),
                                findViewById(R.id.barSat),
                                findViewById(R.id.barSun)
                        };

                        float density = getResources()
                                .getDisplayMetrics()
                                .density;

                        // Đặt chiều cao mặc định cho 7 cột
                        for (View bar : bars) {
                            if (bar != null) {
                                bar.getLayoutParams().height =
                                        (int) (16 * density);
                                bar.setBackgroundColor(0xFFC7D2FE);
                                bar.requestLayout();
                            }
                        }

                        // Cập nhật theo ngày thực tế
                        for (ApiModels.StreakDay day : days) {

                            if (day.getDate() == null) {
                                continue;
                            }

                            int index = LocalDate.parse(day.getDate())
                                    .getDayOfWeek()
                                    .getValue() - 1;

                            if (index < 0 || index >= bars.length) {
                                continue;
                            }

                            View bar = bars[index];

                            if (bar == null) {
                                continue;
                            }

                            boolean completed = day.isCompleted();

                            bar.getLayoutParams().height = (int) (
                                    (completed ? 80 : 16) * density
                            );

                            bar.setBackgroundColor(
                                    completed
                                            ? 0xFF4F46E5
                                            : 0xFFC7D2FE
                            );

                            bar.requestLayout();
                        }
                    }

                    @Override
                    public void onError(String message) {
                        // Không làm gián đoạn màn hình tiến độ
                    }
                }
        );

        // 4. Điểm bài thi trung bình
        // Điểm bài thi thang 10 được chuyển sang phần trăm
        api.getExamHistory().enqueue(
                new ApiCallback<List<ApiModels.ExamHistoryItem>>() {

                    @Override
                    public void onSuccess(
                            List<ApiModels.ExamHistoryItem> history
                    ) {

                        if (history == null || history.isEmpty()) {

                            tvQuizPercent.setText("0%");
                            progressQuiz.setProgress(0);

                            return;
                        }

                        double sum = 0;

                        for (ApiModels.ExamHistoryItem item : history) {
                            sum += item.getScore();
                        }

                        int percent = (int) Math.round(
                                sum / history.size() * 10
                        );

                        tvQuizPercent.setText(percent + "%");
                        progressQuiz.setProgress(percent);
                    }

                    @Override
                    public void onError(String message) {
                        // Không làm gián đoạn màn hình tiến độ
                    }
                }
        );
    }

    // =========================
    // TỰ ĐỘNG CẬP NHẬT KHI QUAY LẠI MÀN HÌNH
    // =========================

    @Override
    protected void onResume() {
        super.onResume();
        bindData();
    }

    // =========================
    // BOTTOM NAVIGATION
    // =========================

    private void setupBottomNav() {

        bottomNav.setSelectedItemId(R.id.nav_progress);

        bottomNav.setOnItemSelectedListener(item -> {

            int id = item.getItemId();

            if (id == R.id.nav_home) {

                navigateTo(HomeActivity.class);
                return true;

            } else if (id == R.id.nav_learn) {

                navigateTo(LearnActivity.class);
                return true;

            } else if (id == R.id.nav_progress) {

                return true;

            } else if (id == R.id.nav_profile) {

                navigateTo(ProfileActivity.class);
                return true;
            }

            return false;
        });
    }

    private void navigateTo(Class<?> targetActivity) {

        Intent intent = new Intent(this, targetActivity);

        startActivity(intent);
        overridePendingTransition(0, 0);

        // Không finish() để bấm back quay lại đúng màn trước đó
    }
}