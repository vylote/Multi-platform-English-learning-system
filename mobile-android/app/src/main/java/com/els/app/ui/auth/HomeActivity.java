package com.els.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.els.app.R;
import com.google.android.material.bottomnavigation.BottomNavigationView;

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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_home);

        // Chỉ áp padding top/left/right cho root — KHÔNG áp bottom,
        // vì BottomNavigationView tự động xử lý inset đáy của riêng nó.
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, 0);
            return insets;
        });

        initViews();
        bindData();
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
        String userName = "Học viên";
        int completedLessons = 34;
        int totalLessons = 50;
        int percent = (completedLessons * 100) / totalLessons;

        tvUserName.setText(userName);
        tvProgressPercent.setText(percent + "%");
        tvProgressSub.setText(completedLessons + "/" + totalLessons + " bài học đã hoàn thành");
        progressBarLearning.setProgress(percent);

        int streakDays = 7;
        if (streakDays > 0) {
            tvStreakCount.setText(streakDays + " ngày");
            tvStreakSub.setText("Chuỗi ngày học liên tiếp");
        } else {
            tvStreakCount.setText("0 ngày");
            tvStreakSub.setText("Học hôm nay để bắt đầu chuỗi");
        }
    }

    private void setupClickListeners() {
        cardVocabulary.setOnClickListener(v -> {
            navigateTo(VocabularyActivity.class);
        });

        cardGrammar.setOnClickListener(v -> {
            navigateTo(GrammarActivity.class);
        });

        cardDictionary.setOnClickListener(v -> {
            navigateTo(DictionaryActivity.class);
        });

        cardQuiz.setOnClickListener(v -> {
            navigateTo(QuizActivity.class);
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