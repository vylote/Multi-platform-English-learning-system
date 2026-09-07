package com.els.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.widget.EditText;
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
import com.google.android.material.button.MaterialButton;

public class LearnActivity extends AppCompatActivity {

    private EditText etSearch;
    private BottomNavigationView bottomNav;

    private TextView chipAll;
    private TextView chipVocab;
    private TextView chipGrammar;
    private TextView chipQuiz;

    private TextView tvContinueLabel;
    private TextView tvContinueSub;
    private ProgressBar progressContinue;
    private MaterialButton btnContinue;

    private CardView cardLesson1;
    private TextView tvLesson1Title;
    private TextView tvLesson1Sub;
    private ProgressBar progressLesson1;

    private CardView cardLesson2;
    private TextView tvLesson2Title;
    private TextView tvLesson2Sub;
    private ProgressBar progressLesson2;

    private CardView cardLesson3;
    private TextView tvLesson3Title;
    private TextView tvLesson3Sub;
    private ProgressBar progressLesson3;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_learn);

        // Chỉ áp padding top/left/right cho root — KHÔNG áp bottom,
        // vì BottomNavigationView tự xử lý inset đáy của riêng nó (tránh cộng dồn 2 lần).
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, 0);
            return insets;
        });

        initViews();
        bindData();
        setupClickListeners();
        setupFilterChips();
        setupBottomNav();
    }

    private void initViews() {
        etSearch = findViewById(R.id.etSearch);
        bottomNav = findViewById(R.id.bottomNav);

        // Đảm bảo bottomNav luôn padding đúng bằng vùng gesture bar/nav bar hệ thống
        ViewCompat.setOnApplyWindowInsetsListener(bottomNav, (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(v.getPaddingLeft(), v.getPaddingTop(), v.getPaddingRight(), systemBars.bottom);
            return insets;
        });

        chipAll = findViewById(R.id.chipAll);
        chipVocab = findViewById(R.id.chipVocab);
        chipGrammar = findViewById(R.id.chipGrammar);
        chipQuiz = findViewById(R.id.chipQuiz);

        tvContinueLabel = findViewById(R.id.tvContinueLabel);
        tvContinueSub = findViewById(R.id.tvContinueSub);
        progressContinue = findViewById(R.id.progressContinue);
        btnContinue = findViewById(R.id.btnContinue);

        cardLesson1 = findViewById(R.id.cardLesson1);
        tvLesson1Title = findViewById(R.id.tvLesson1Title);
        tvLesson1Sub = findViewById(R.id.tvLesson1Sub);
        progressLesson1 = findViewById(R.id.progressLesson1);

        cardLesson2 = findViewById(R.id.cardLesson2);
        tvLesson2Title = findViewById(R.id.tvLesson2Title);
        tvLesson2Sub = findViewById(R.id.tvLesson2Sub);
        progressLesson2 = findViewById(R.id.progressLesson2);

        cardLesson3 = findViewById(R.id.cardLesson3);
        tvLesson3Title = findViewById(R.id.tvLesson3Title);
        tvLesson3Sub = findViewById(R.id.tvLesson3Sub);
        progressLesson3 = findViewById(R.id.progressLesson3);
    }

    private void bindData() {
        // TODO: Thay bằng dữ liệu thật từ ViewModel / Repository

        String continueTitle = "Bài 12: Thì hiện tại hoàn thành";
        String continueCategory = "Ngữ pháp";
        int continueRemaining = 6;
        int continuePercent = 60;

        tvContinueLabel.setText(continueTitle);
        tvContinueSub.setText(continueCategory + " · Còn " + continueRemaining + " câu");
        progressContinue.setProgress(continuePercent);

        int vocabDone = 14, vocabTotal = 20;
        tvLesson1Title.setText("Từ vựng chủ đề Du lịch");
        tvLesson1Sub.setText(vocabTotal + " từ · Đã học " + vocabDone + "/" + vocabTotal);
        progressLesson1.setProgress((vocabDone * 100) / vocabTotal);

        int grammarDone = 5, grammarTotal = 12;
        tvLesson2Title.setText("Ngữ pháp: Câu điều kiện");
        tvLesson2Sub.setText(grammarTotal + " bài tập · Đã học " + grammarDone + "/" + grammarTotal);
        progressLesson2.setProgress((grammarDone * 100) / grammarTotal);

        int quizDone = 0, quizTotal = 30;
        tvLesson3Title.setText("Kiểm tra giữa khóa");
        tvLesson3Sub.setText(quizTotal + " câu hỏi · " + (quizDone == 0 ? "Chưa làm" : "Đã làm " + quizDone + "/" + quizTotal));
        progressLesson3.setProgress((quizDone * 100) / quizTotal);
    }

    private void setupClickListeners() {
        btnContinue.setOnClickListener(v -> {
            // TODO: mở tiếp bài học đang dở
        });

        cardLesson1.setOnClickListener(v -> {
            // TODO: mở chi tiết bài học Từ vựng
        });

        cardLesson2.setOnClickListener(v -> {
            // TODO: mở chi tiết bài học Ngữ pháp
        });

        cardLesson3.setOnClickListener(v -> {
            // TODO: mở màn Kiểm tra
        });
    }

    private void setupFilterChips() {
        chipAll.setOnClickListener(v -> selectChip(chipAll));
        chipVocab.setOnClickListener(v -> selectChip(chipVocab));
        chipGrammar.setOnClickListener(v -> selectChip(chipGrammar));
        chipQuiz.setOnClickListener(v -> selectChip(chipQuiz));
    }

    private void selectChip(TextView selected) {
        TextView[] chips = { chipAll, chipVocab, chipGrammar, chipQuiz };
        for (TextView chip : chips) {
            boolean isSelected = chip == selected;
            chip.setBackgroundResource(isSelected ? R.drawable.bg_chip_selected : R.drawable.bg_chip_unselected);
            chip.setTextColor(isSelected ? 0xFFFFFFFF : 0xFF4F46E5);
        }
        // TODO: lọc danh sách bài học theo danh mục được chọn
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
        // Không finish() để bấm back quay lại đúng màn trước đó
    }
}