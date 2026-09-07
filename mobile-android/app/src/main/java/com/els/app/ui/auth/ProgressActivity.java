package com.els.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.els.app.R;
import com.google.android.material.bottomnavigation.BottomNavigationView;

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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_progress);

        // Chỉ áp padding top/left/right cho root — KHÔNG áp bottom,
        // vì BottomNavigationView tự xử lý inset đáy của riêng nó (tránh cộng dồn 2 lần).
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, 0);
            return insets;
        });

        initViews();
        bindData();
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

        // Đảm bảo bottomNav luôn padding đúng bằng vùng gesture bar/nav bar hệ thống
        ViewCompat.setOnApplyWindowInsetsListener(bottomNav, (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(v.getPaddingLeft(), v.getPaddingTop(), v.getPaddingRight(), systemBars.bottom);
            return insets;
        });
    }

    private void bindData() {
        // TODO: Thay bằng dữ liệu thật từ ViewModel / Repository / API

        int completedLessons = 34;
        int totalLessons = 50;
        int overallPercent = (completedLessons * 100) / totalLessons;
        int streakDays = 7;
        String totalStudyTime = "12h30";

        tvOverviewPercent.setText(overallPercent + "%");
        progressBarOverview.setProgress(overallPercent);
        tvStatLessons.setText(completedLessons + "/" + totalLessons + "\nBài học");
        tvStatStreak.setText(streakDays + "\nNgày streak");
        tvStatTime.setText(totalStudyTime + "\nThời gian học");

        int vocabPercent = 80;
        int grammarPercent = 65;
        int quizPercent = 72;

        tvVocabPercent.setText(vocabPercent + "%");
        progressVocab.setProgress(vocabPercent);

        tvGrammarPercent.setText(grammarPercent + "%");
        progressGrammar.setProgress(grammarPercent);

        tvQuizPercent.setText(quizPercent + "%");
        progressQuiz.setProgress(quizPercent);
    }

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