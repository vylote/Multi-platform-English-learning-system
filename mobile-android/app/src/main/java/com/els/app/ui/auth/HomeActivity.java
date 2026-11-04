package com.els.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.els.app.R;
import com.els.app.data.remote.api.LearningApiService;
import com.els.app.data.remote.dto.ApiModels;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;
import com.els.app.util.Labels;
import com.els.app.util.SessionManager;
import com.els.app.util.TimeUtil;
import com.google.android.material.bottomnavigation.BottomNavigationView;

import java.util.List;

public class HomeActivity extends AppCompatActivity {

    private TextView tvUserName;
    private TextView tvProgressPercent;
    private TextView tvProgressSub;
    private ProgressBar progressBarLearning;
    private BottomNavigationView bottomNav;

    private TextView tvStreakCount;
    private TextView tvStreakSub;

    private CardView cardVocabulary;
    private CardView cardGrammar;
    private CardView cardDictionary;
    private CardView cardQuiz;

    private LearningApiService learningApi;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_home);
        ViewCompat.setOnApplyWindowInsetsListener(
                findViewById(R.id.main), (v, insets) -> {
                    Insets bars = insets.getInsets(
                            WindowInsetsCompat.Type.systemBars()
                    );

                    v.setPadding(
                            bars.left,
                            bars.top,
                            bars.right,
                            0
                    );

                    return insets;
                }
        );

        initViews();

        sessionManager = new SessionManager(this);

        learningApi = RetrofitClient.create(
                this,
                LearningApiService.class
        );

        setupClickListeners();
        setupBottomNav();
    }

    private void initViews() {
        tvUserName = findViewById(R.id.tvUserName);

        tvProgressPercent = findViewById(R.id.tvProgressPercent);
        tvProgressSub = findViewById(R.id.tvProgressSub);
        progressBarLearning = findViewById(R.id.progressBarLearning);

        bottomNav = findViewById(R.id.bottomNav);

        tvStreakCount = findViewById(R.id.tvStreakCount);
        tvStreakSub = findViewById(R.id.tvStreakSub);

        cardVocabulary = findViewById(R.id.cardVocabulary);
        cardGrammar = findViewById(R.id.cardGrammar);
        cardDictionary = findViewById(R.id.cardDictionary);
        cardQuiz = findViewById(R.id.cardQuiz);
    }

    private void bindData() {
        String name = sessionManager.getUsername();
        tvUserName.setText(
                name != null && !name.trim().isEmpty()
                        ? name
                        : "Học viên"
        );

        tvProgressPercent.setText("--");
        tvProgressSub.setText("Đang tải tiến độ học tập...");
        progressBarLearning.setProgress(0);

        tvStreakCount.setText("--");
        tvStreakSub.setText("Đang tải dữ liệu...");

        int tz = TimeUtil.offsetMinutes();

        learningApi.getLearningPath().enqueue(
                new ApiCallback<ApiModels.LearningPath>() {
                    @Override
                    public void onSuccess(ApiModels.LearningPath lp) {
                        List<ApiModels.PathTopic> path =
                                lp != null ? lp.getPath() : null;

                        int total = path == null ? 0 : path.size();
                        int sumMastery = 0;

                        for (ApiModels.PathTopic topic : path != null
                                ? path
                                : java.util.Collections.<ApiModels.PathTopic>emptyList()) {
                            sumMastery += topic.getMasteryPercent();
                        }

                        int overall = total == 0
                                ? 0
                                : sumMastery / total;

                        tvProgressPercent.setText(overall + "%");
                        tvProgressSub.setText(
                                total == 0
                                        ? "Chưa có dữ liệu tiến độ"
                                        : "Tiến độ lộ trình học tập"
                        );
                        progressBarLearning.setProgress(overall);
                    }

                    @Override
                    public void onError(String message) {
                        tvProgressPercent.setText("--");
                        tvProgressSub.setText("Không thể tải tiến độ");
                        progressBarLearning.setProgress(0);
                    }
                }
        );

        learningApi.getStreakStatus(tz).enqueue(
                new ApiCallback<ApiModels.StreakStatus>() {
                    @Override
                    public void onSuccess(ApiModels.StreakStatus streak) {
                        if (streak != null) {
                            tvStreakCount.setText(
                                    streak.getCurrentStreak() + " ngày"
                            );

                            tvStreakSub.setText(
                                    streak.isCompletedToday()
                                            ? "Đã hoàn thành hôm nay ✓"
                                            : "Học hôm nay để duy trì chuỗi!"
                            );
                        } else {
                            tvStreakCount.setText("--");
                            tvStreakSub.setText("Không có dữ liệu");
                        }
                    }

                    @Override
                    public void onError(String message) {
                        tvStreakCount.setText("--");
                        tvStreakSub.setText("Không thể tải dữ liệu");
                    }
                }
        );
    }

    @Override
    protected void onResume() {
        super.onResume();
        bindData();
    }

    private void setupClickListeners() {
        cardVocabulary.setOnClickListener(v ->
                navigateTo(VocabularyActivity.class)
        );

        cardGrammar.setOnClickListener(v ->
                navigateTo(AchievementsActivity.class)
        );

        cardDictionary.setOnClickListener(v ->
                navigateTo(DictionaryActivity.class)
        );

        cardQuiz.setOnClickListener(v -> {
            Intent i = new Intent(this, TopicPickerActivity.class);
            i.putExtra(TopicPickerActivity.EXTRA_MODE, TopicPickerActivity.MODE_EXAM);
            startActivity(i);
        });
    }

    private void setupBottomNav() {
        bottomNav.setSelectedItemId(R.id.nav_home);

        bottomNav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();

            if (id == R.id.nav_home) {
                return true;
            } else if (id == R.id.nav_learn) {
                navigateTo(LearnActivity.class);
                return true;
            } else if (id == R.id.nav_progress) {
                navigateTo(ProgressActivity.class);
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
    }
}