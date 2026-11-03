package com.els.app.ui.auth;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
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
import com.els.app.data.remote.api.LearningApiService;
import com.els.app.data.remote.dto.ApiModels;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;
import com.els.app.util.Labels;
import com.els.app.util.Speaker;
import com.els.app.util.TimeUtil;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;

public class VocabularyActivity extends AppCompatActivity {

    public static final String EXTRA_TOPIC_ID = "topic_id";

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

    private static class VocabWord {
        long flashcardId;
        String word;
        String phonetic;
        String meaning;
        String example;
        String level;

        VocabWord(
                String word,
                String phonetic,
                String meaning,
                String example,
                String level
        ) {
            this.word = word;
            this.phonetic = phonetic;
            this.meaning = meaning;
            this.example = example;
            this.level = level;
        }
    }

    private LearningApiService api;
    private Speaker speaker;

    private final List<VocabWord> vocabList = new ArrayList<>();

    private int currentIndex = 0;
    private boolean isShowingBack = false;
    private boolean isAnimating = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_vocabulary);

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

        api = RetrofitClient.create(
                this,
                LearningApiService.class
        );

        speaker = new Speaker(this);

        loadFlashcards();

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

    private void loadFlashcards() {
        long topicId = getIntent().getLongExtra(EXTRA_TOPIC_ID, 0);

        Call<com.els.app.data.remote.dto.response.ApiResponse<
                List<ApiModels.FlashcardDto>>> call;

        if (topicId > 0) {
            call = api.getPracticeFlashcards(topicId);
        } else {
            call = api.getDailyFlashcards();
        }

        call.enqueue(new ApiCallback<List<ApiModels.FlashcardDto>>() {
            @Override
            public void onSuccess(List<ApiModels.FlashcardDto> result) {
                vocabList.clear();

                if (result != null) {
                    for (ApiModels.FlashcardDto flashcard : result) {
                        ApiModels.WordDto word = flashcard.getWord();

                        if (word == null) {
                            continue;
                        }

                        VocabWord item = new VocabWord(
                                word.getWord(),
                                word.getPronunciation(),
                                word.getMeaningVi(),
                                word.getPartOfSpeech(),
                                Labels.flashcardStatus(flashcard.getStatus())
                        );

                        item.flashcardId = flashcard.getId();
                        vocabList.add(item);
                    }
                }

                if (vocabList.isEmpty()) {
                    tvCardCounter.setText("0/0");
                    progressBarSession.setProgress(0);

                    Toast.makeText(
                            VocabularyActivity.this,
                            "Hiện chưa có từ nào cần ôn.",
                            Toast.LENGTH_LONG
                    ).show();

                    return;
                }

                currentIndex = 0;
                showCard(currentIndex);
            }

            @Override
            public void onError(String message) {
                Toast.makeText(
                        VocabularyActivity.this,
                        message,
                        Toast.LENGTH_LONG
                ).show();
            }
        });
    }

    private void showCard(int index) {
        if (vocabList.isEmpty()
                || index < 0
                || index >= vocabList.size()) {
            return;
        }

        VocabWord word = vocabList.get(index);

        tvLevelBadge.setText(
                word.level != null ? word.level : "Mới"
        );

        tvWordFront.setText(
                word.word != null ? word.word : ""
        );

        tvPhonetic.setText(
                word.phonetic != null ? word.phonetic : ""
        );

        tvWordBack.setText(
                word.word != null ? word.word : ""
        );

        tvMeaning.setText(
                word.meaning != null
                        ? word.meaning
                        : "Chưa có nghĩa tiếng Việt"
        );

        tvExample.setText(
                word.example != null ? word.example : ""
        );

        tvCardCounter.setText(
                (index + 1) + "/" + vocabList.size()
        );

        int percent = (int) (
                ((index + 1) * 100f) / vocabList.size()
        );

        progressBarSession.setProgress(percent);

        isShowingBack = false;
        isAnimating = false;

        cardFront.setVisibility(View.VISIBLE);
        cardBack.setVisibility(View.GONE);

        cardFront.setRotationY(0f);
        cardBack.setRotationY(0f);
    }

    private void submitAnswer(String status) {
        if (vocabList.isEmpty()) {
            return;
        }

        VocabWord word = vocabList.get(currentIndex);

        api.updateFlashcard(
                word.flashcardId,
                new ApiModels.FlashcardUpdateRequest(
                        status,
                        TimeUtil.offsetMinutes()
                )
        ).enqueue(new ApiCallback<ApiModels.FlashcardUpdateResult>() {
            @Override
            public void onSuccess(ApiModels.FlashcardUpdateResult result) {
                if (result != null
                        && result.getStreak() != null
                        && result.getStreak().isCompletedToday()) {

                    Toast.makeText(
                            VocabularyActivity.this,
                            "🔥 Chuỗi "
                                    + result.getStreak().getCurrentStreak()
                                    + " ngày!",
                            Toast.LENGTH_LONG
                    ).show();
                }
            }

            @Override
            public void onError(String message) {
                Toast.makeText(
                        VocabularyActivity.this,
                        message,
                        Toast.LENGTH_SHORT
                ).show();
            }
        });

        goToNextCard();
    }

    private void setupListeners() {
        btnBack.setOnClickListener(v -> finish());

        cardFront.setOnClickListener(v -> flipCard());
        cardBack.setOnClickListener(v -> flipCard());

        btnSpeak.setOnClickListener(v -> {
            if (!vocabList.isEmpty()) {
                speaker.speak(vocabList.get(currentIndex).word);
            }
        });

        btnDontKnow.setOnClickListener(v ->
                submitAnswer("LEARNING")
        );

        btnKnow.setOnClickListener(v ->
                submitAnswer("MASTERED")
        );

        btnPrevious.setOnClickListener(v ->
                goToPreviousCard()
        );

        btnNext.setOnClickListener(v ->
                goToNextCard()
        );
    }

    private void flipCard() {
        if (isAnimating || vocabList.isEmpty()) {
            return;
        }

        isAnimating = true;

        CardView visibleCard = isShowingBack
                ? cardBack
                : cardFront;

        CardView hiddenCard = isShowingBack
                ? cardFront
                : cardBack;

        ObjectAnimator flipOut = ObjectAnimator.ofFloat(
                visibleCard,
                "rotationY",
                0f,
                90f
        );

        flipOut.setDuration(150);
        flipOut.setInterpolator(
                new AccelerateDecelerateInterpolator()
        );

        flipOut.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                visibleCard.setVisibility(View.GONE);

                hiddenCard.setVisibility(View.VISIBLE);
                hiddenCard.setRotationY(-90f);

                ObjectAnimator flipIn = ObjectAnimator.ofFloat(
                        hiddenCard,
                        "rotationY",
                        -90f,
                        0f
                );

                flipIn.setDuration(150);
                flipIn.setInterpolator(
                        new AccelerateDecelerateInterpolator()
                );

                flipIn.addListener(new AnimatorListenerAdapter() {
                    @Override
                    public void onAnimationEnd(Animator animation) {
                        isAnimating = false;
                    }
                });

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
            Toast.makeText(
                    this,
                    "Bạn đã hoàn thành bộ từ vựng này!",
                    Toast.LENGTH_SHORT
            ).show();

            finish();
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
        Intent intent = new Intent(
                VocabularyActivity.this,
                targetActivity
        );

        startActivity(intent);
        overridePendingTransition(0, 0);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        if (speaker != null) {
            speaker.shutdown();
        }
    }
}