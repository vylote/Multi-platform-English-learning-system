package com.els.app.ui.auth;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.view.View;
import android.widget.ImageButton;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.els.app.R;
import com.els.app.data.remote.api.LearningApiService;
import com.els.app.data.remote.dto.ApiModels;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;
import com.els.app.util.Speaker;
import com.els.app.util.TimeUtil;
import com.google.android.material.button.MaterialButton;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Tương đương frontend-web/src/pages/TopicLessonPage.jsx
 *   Giai đoạn 1: xem từ vựng  ->  2: Quiz  ->  3: Phát âm  ->  gửi kết quả (POST /lessons/topics/{id}/complete)
 */
public class TopicLessonActivity extends AppCompatActivity {

    public static final String EXTRA_TOPIC_ID = "topic_id";
    public static final String EXTRA_TOPIC_TITLE = "topic_title";

    private static final String[] LETTERS = {"A", "B", "C", "D"};

    private long topicId;
    private LearningApiService api;
    private Speaker speaker;

    private ApiModels.LessonDto lesson;
    private final Map<Long, String> quizAnswers = new HashMap<>();
    private final Map<String, Boolean> pronResults = new HashMap<>();
    private int quizIndex = 0;
    private int pronIndex = 0;

    private TextView tvStage, tvVocabList, tvQuizCounter, tvQuizQuestion;
    private TextView tvPronCounter, tvPronWord, tvPronPhonetic, tvPronStatus, tvLessonResult;
    private ProgressBar progressLesson, progressLoading;
    private View layoutVocab, layoutQuiz, layoutPron, layoutResult;
    private final MaterialButton[] optionButtons = new MaterialButton[4];

    // Mở màn nhận diện giọng nói của hệ thống (không cần xin quyền RECORD_AUDIO)
    private final ActivityResultLauncher<Intent> speechLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                    ArrayList<String> heard = result.getData()
                            .getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                    handleSpeech(heard);
                }
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_topic_lesson);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });

        topicId = getIntent().getLongExtra(EXTRA_TOPIC_ID, 0);
        api = RetrofitClient.create(this, LearningApiService.class);
        speaker = new Speaker(this);

        initViews();
        loadLesson();
    }

    private void initViews() {
        tvStage = findViewById(R.id.tvStage);
        progressLesson = findViewById(R.id.progressLesson);
        progressLoading = findViewById(R.id.progressLoading);
        layoutVocab = findViewById(R.id.layoutVocab);
        layoutQuiz = findViewById(R.id.layoutQuiz);
        layoutPron = findViewById(R.id.layoutPron);
        layoutResult = findViewById(R.id.layoutResult);

        tvVocabList = findViewById(R.id.tvVocabList);
        tvQuizCounter = findViewById(R.id.tvQuizCounter);
        tvQuizQuestion = findViewById(R.id.tvQuizQuestion);
        tvPronCounter = findViewById(R.id.tvPronCounter);
        tvPronWord = findViewById(R.id.tvPronWord);
        tvPronPhonetic = findViewById(R.id.tvPronPhonetic);
        tvPronStatus = findViewById(R.id.tvPronStatus);
        tvLessonResult = findViewById(R.id.tvLessonResult);

        int[] ids = {R.id.btnOpt0, R.id.btnOpt1, R.id.btnOpt2, R.id.btnOpt3};
        for (int i = 0; i < 4; i++) {
            final int index = i;
            optionButtons[i] = findViewById(ids[i]);
            optionButtons[i].setOnClickListener(v -> onOptionSelected(index));
        }

        ((ImageButton) findViewById(R.id.btnClose)).setOnClickListener(v -> finish());
        findViewById(R.id.btnStartQuiz).setOnClickListener(v -> startQuiz());
        findViewById(R.id.btnListen).setOnClickListener(v ->
                speaker.speak(lesson.getPronunciationWords().get(pronIndex).getWord()));
        findViewById(R.id.btnSpeakNow).setOnClickListener(v -> launchSpeech());
        findViewById(R.id.btnPronNext).setOnClickListener(v -> nextPronWord());
        findViewById(R.id.btnLessonDone).setOnClickListener(v -> finish());
    }

    // ------------------------------------------------------------------
    private void loadLesson() {
        progressLoading.setVisibility(View.VISIBLE);
        api.getLesson(topicId).enqueue(new ApiCallback<ApiModels.LessonDto>() {
            @Override
            public void onSuccess(ApiModels.LessonDto result) {
                progressLoading.setVisibility(View.GONE);
                lesson = result;
                showVocabulary();
            }

            @Override
            public void onError(String message) {
                progressLoading.setVisibility(View.GONE);
                Toast.makeText(TopicLessonActivity.this, message, Toast.LENGTH_LONG).show();
                finish();
            }
        });
    }

    private void showStage(View stage, String title, int progressPercent) {
        layoutVocab.setVisibility(stage == layoutVocab ? View.VISIBLE : View.GONE);
        layoutQuiz.setVisibility(stage == layoutQuiz ? View.VISIBLE : View.GONE);
        layoutPron.setVisibility(stage == layoutPron ? View.VISIBLE : View.GONE);
        layoutResult.setVisibility(stage == layoutResult ? View.VISIBLE : View.GONE);
        tvStage.setText(title);
        progressLesson.setProgress(progressPercent);
    }

    // ---------- Giai đoạn 1: Từ vựng ----------
    private void showVocabulary() {
        StringBuilder sb = new StringBuilder();
        for (ApiModels.LessonWord w : lesson.getVocabulary()) {
            sb.append(w.getWord());
            if (w.getPronunciation() != null && !w.getPronunciation().isEmpty()) {
                sb.append("   ").append(w.getPronunciation());
            }
            sb.append("\n    → ").append(w.getMeaningVi()).append("\n\n");
        }
        tvVocabList.setText(sb.toString().trim());
        showStage(layoutVocab, "Từ vựng", 0);
    }

    // ---------- Giai đoạn 2: Quiz ----------
    private void startQuiz() {
        quizIndex = 0;
        showQuestion();
    }

    private void showQuestion() {
        List<ApiModels.LessonQuestion> qs = lesson.getQuestions();
        ApiModels.LessonQuestion q = qs.get(quizIndex);
        tvQuizCounter.setText("Câu " + (quizIndex + 1) + "/" + qs.size());
        tvQuizQuestion.setText(q.getQuestionText());

        String[] opts = {q.getOptionA(), q.getOptionB(), q.getOptionC(), q.getOptionD()};
        for (int i = 0; i < 4; i++) {
            optionButtons[i].setText(LETTERS[i] + ".  " + opts[i]);
        }
        showStage(layoutQuiz, "Quiz", (quizIndex * 50) / qs.size());
    }

    private void onOptionSelected(int index) {
        List<ApiModels.LessonQuestion> qs = lesson.getQuestions();
        quizAnswers.put(qs.get(quizIndex).getId(), LETTERS[index]);

        if (quizIndex < qs.size() - 1) {
            quizIndex++;
            showQuestion();
        } else {
            startPronunciation();
        }
    }

    // ---------- Giai đoạn 3: Phát âm ----------
    private void startPronunciation() {
        pronIndex = 0;
        showPronWord();
    }

    private void showPronWord() {
        List<ApiModels.PronWord> words = lesson.getPronunciationWords();
        ApiModels.PronWord w = words.get(pronIndex);
        tvPronCounter.setText("Từ " + (pronIndex + 1) + "/" + words.size());
        tvPronWord.setText(w.getWord());
        tvPronPhonetic.setText(w.getPronunciation());
        tvPronStatus.setText("");
        showStage(layoutPron, "Phát âm", 50 + (pronIndex * 50) / words.size());
    }

    private void launchSpeech() {
        String target = lesson.getPronunciationWords().get(pronIndex).getWord();
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US");
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "Hãy đọc: " + target);
        try {
            speechLauncher.launch(intent);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this,
                    "Máy chưa có dịch vụ nhận diện giọng nói (Google). Bấm 'Từ tiếp theo' để bỏ qua.",
                    Toast.LENGTH_LONG).show();
        }
    }

    private void handleSpeech(List<String> heard) {
        String target = lesson.getPronunciationWords().get(pronIndex).getWord();
        boolean match = false;
        String first = "";
        if (heard != null && !heard.isEmpty()) {
            first = heard.get(0);
            for (String h : heard) {
                if (normalize(h).equals(normalize(target))) {
                    match = true;
                    break;
                }
            }
        }
        pronResults.put(target, match);
        tvPronStatus.setTextColor(match ? 0xFF16A34A : 0xFFDC2626);
        tvPronStatus.setText(match ? "✅ Chính xác!" : "❌ Nghe được: \"" + first + "\" - thử lại nhé");
    }

    private String normalize(String s) {
        return s == null ? "" : s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private void nextPronWord() {
        List<ApiModels.PronWord> words = lesson.getPronunciationWords();
        String current = words.get(pronIndex).getWord();
        if (!pronResults.containsKey(current)) pronResults.put(current, false);

        if (pronIndex < words.size() - 1) {
            pronIndex++;
            showPronWord();
        } else {
            submitLesson();
        }
    }

    // ---------- Gửi kết quả ----------
    private void submitLesson() {
        List<Long> questionIds = new ArrayList<>();
        List<ApiModels.Answer> answers = new ArrayList<>();
        for (ApiModels.LessonQuestion q : lesson.getQuestions()) {
            questionIds.add(q.getId());
            answers.add(new ApiModels.Answer(q.getId(), quizAnswers.get(q.getId())));
        }

        List<ApiModels.PronResult> pron = new ArrayList<>();
        for (ApiModels.PronWord w : lesson.getPronunciationWords()) {
            Boolean ok = pronResults.get(w.getWord());
            pron.add(new ApiModels.PronResult(w.getWord(), ok != null && ok));
        }

        progressLoading.setVisibility(View.VISIBLE);
        api.completeLesson(topicId, new ApiModels.LessonCompleteRequest(
                        questionIds, answers, pron, TimeUtil.offsetMinutes()))
                .enqueue(new ApiCallback<ApiModels.LessonResult>() {
                    @Override
                    public void onSuccess(ApiModels.LessonResult r) {
                        progressLoading.setVisibility(View.GONE);
                        tvLessonResult.setText(String.format(Locale.getDefault(),
                                "Quiz: %.0f%%\nPhát âm: %.0f%%\nĐiểm bài học: %.0f%%",
                                r.getQuizScore(), r.getPronunciationScore(), r.getCombinedScore()));
                        showStage(layoutResult, "Hoàn thành", 100);
                    }

                    @Override
                    public void onError(String message) {
                        progressLoading.setVisibility(View.GONE);
                        Toast.makeText(TopicLessonActivity.this, message, Toast.LENGTH_LONG).show();
                    }
                });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (speaker != null) speaker.shutdown();
    }
}
