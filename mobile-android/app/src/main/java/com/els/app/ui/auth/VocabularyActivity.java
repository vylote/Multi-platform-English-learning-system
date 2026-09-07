package com.els.app.ui.auth;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.content.Intent;
import android.os.Bundle;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.ImageButton;
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
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;

import java.util.ArrayList;
import java.util.List;

public class VocabularyActivity extends AppCompatActivity {

    // ===== Model tạm cho 1 từ vựng =====
    private static class VocabWord {
        String word;
        String phonetic;
        String meaning;
        String example;
        String level;

        VocabWord(String word, String phonetic, String meaning, String example, String level) {
            this.word = word;
            this.phonetic = phonetic;
            this.meaning = meaning;
            this.example = example;
            this.level = level;
        }
    }

    private ImageButton btnBack;
    private TextView tvCardCounter;
    private ProgressBar progressBarSession;

    private CardView cardFront;
    private CardView cardBack;
    private TextView tvLevelBadge;
    private TextView tvWordFront;
    private TextView tvPhonetic;
    private ImageButton btnSpeak;

    private TextView tvWordBack;
    private TextView tvMeaning;
    private TextView tvExample;

    private MaterialButton btnDontKnow;
    private MaterialButton btnKnow;
    private ImageButton btnPrevious;
    private ImageButton btnNext;

    private BottomNavigationView bottomNav;

    private List<VocabWord> vocabList = new ArrayList<>();
    private int currentIndex = 0;
    private boolean isShowingBack = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_vocabulary);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, 0);
            return insets;
        });

        initViews();
        loadSampleData(); // TODO: thay bằng dữ liệu thật từ Repository/API
        showCard(currentIndex);
        setupListeners();
        setupBottomNav();
    }

    private void initViews() {
        btnBack = findViewById(R.id.btnBack);
        tvCardCounter = findViewById(R.id.tvCardCounter);
        progressBarSession = findViewById(R.id.progressBarSession);

        cardFront = findViewById(R.id.cardFront);
        cardBack = findViewById(R.id.cardBack);
        tvLevelBadge = findViewById(R.id.tvLevelBadge);
        tvWordFront = findViewById(R.id.tvWordFront);
        tvPhonetic = findViewById(R.id.tvPhonetic);
        btnSpeak = findViewById(R.id.btnSpeak);

        tvWordBack = findViewById(R.id.tvWordBack);
        tvMeaning = findViewById(R.id.tvMeaning);
        tvExample = findViewById(R.id.tvExample);

        btnDontKnow = findViewById(R.id.btnDontKnow);
        btnKnow = findViewById(R.id.btnKnow);
        btnPrevious = findViewById(R.id.btnPrevious);
        btnNext = findViewById(R.id.btnNext);

        bottomNav = findViewById(R.id.bottomNav);
    }

    private void loadSampleData() {
        vocabList.add(new VocabWord(
                "Serendipity", "/ˌser.ənˈdɪp.ə.ti/",
                "Sự tình cờ may mắn",
                "\"Meeting you here was pure serendipity.\"",
                "Cơ bản"));
        vocabList.add(new VocabWord(
                "Ambitious", "/æmˈbɪʃ.əs/",
                "Đầy tham vọng",
                "\"She is ambitious about her career.\"",
                "Cơ bản"));
        vocabList.add(new VocabWord(
                "Resilient", "/rɪˈzɪl.i.ənt/",
                "Kiên cường, bền bỉ",
                "\"He remained resilient despite the setbacks.\"",
                "Trung cấp"));
    }

    private void showCard(int index) {
        if (vocabList.isEmpty()) return;

        VocabWord w = vocabList.get(index);

        tvLevelBadge.setText(w.level);
        tvWordFront.setText(w.word);
        tvPhonetic.setText(w.phonetic);

        tvWordBack.setText(w.word);
        tvMeaning.setText(w.meaning);
        tvExample.setText(w.example);

        tvCardCounter.setText((index + 1) + "/" + vocabList.size());
        int percent = (int) (((index + 1) * 100f) / vocabList.size());
        progressBarSession.setProgress(percent);

        // Luôn quay về mặt trước khi chuyển thẻ
        isShowingBack = false;
        cardFront.setVisibility(android.view.View.VISIBLE);
        cardBack.setVisibility(android.view.View.GONE);
        cardFront.setRotationY(0f);
        cardBack.setRotationY(0f);
    }

    private void setupListeners() {
        btnBack.setOnClickListener(v -> finish());

        cardFront.setOnClickListener(v -> flipCard());
        cardBack.setOnClickListener(v -> flipCard());

        btnSpeak.setOnClickListener(v -> {
            // TODO: tích hợp TextToSpeech để phát âm từ hiện tại
            Toast.makeText(this, "Phát âm: " + vocabList.get(currentIndex).word, Toast.LENGTH_SHORT).show();
        });

        btnDontKnow.setOnClickListener(v -> {
            // TODO: lưu trạng thái "chưa nhớ" cho từ hiện tại vào dữ liệu học tập
            goToNextCard();
        });

        btnKnow.setOnClickListener(v -> {
            // TODO: lưu trạng thái "đã nhớ" cho từ hiện tại vào dữ liệu học tập
            goToNextCard();
        });

        btnPrevious.setOnClickListener(v -> goToPreviousCard());
        btnNext.setOnClickListener(v -> goToNextCard());
    }

    /** Hiệu ứng lật thẻ bằng rotationY */
    private void flipCard() {
        CardView visibleCard = isShowingBack ? cardBack : cardFront;
        CardView hiddenCard = isShowingBack ? cardFront : cardBack;

        ObjectAnimator flipOut = ObjectAnimator.ofFloat(visibleCard, "rotationY", 0f, 90f);
        flipOut.setDuration(150);
        flipOut.setInterpolator(new AccelerateDecelerateInterpolator());

        flipOut.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                visibleCard.setVisibility(android.view.View.GONE);
                hiddenCard.setVisibility(android.view.View.VISIBLE);
                hiddenCard.setRotationY(-90f);

                ObjectAnimator flipIn = ObjectAnimator.ofFloat(hiddenCard, "rotationY", -90f, 0f);
                flipIn.setDuration(150);
                flipIn.setInterpolator(new AccelerateDecelerateInterpolator());
                flipIn.start();
            }
        });

        flipOut.start();
        isShowingBack = !isShowingBack;
    }

    private void goToNextCard() {
        if (currentIndex < vocabList.size() - 1) {
            currentIndex++;
            showCard(currentIndex);
        } else {
            Toast.makeText(this, "Bạn đã hoàn thành bộ từ vựng này!", Toast.LENGTH_SHORT).show();
            // TODO: điều hướng sang màn tổng kết kết quả học
        }
    }

    private void goToPreviousCard() {
        if (currentIndex > 0) {
            currentIndex--;
            showCard(currentIndex);
        }
    }

    private void setupBottomNav() {
        bottomNav.setSelectedItemId(R.id.nav_learn);

        bottomNav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_home) {
                navigateTo(HomeActivity.class);
                return true;
            } else if (id == R.id.nav_learn) {
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