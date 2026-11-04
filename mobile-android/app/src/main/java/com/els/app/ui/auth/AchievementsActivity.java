package com.els.app.ui.auth;

import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
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
import com.els.app.util.TimeUtil;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;


public class AchievementsActivity extends AppCompatActivity {

    private static final String[] DAY_LABELS = {"T2", "T3", "T4", "T5", "T6", "T7", "CN"};

    private LearningApiService api;
    private TextView tvStatStreak, tvStatStreakSub, tvStatTopics, tvStatWords, tvStatExams, tvHistoryEmpty;
    private LinearLayout layoutWeek, layoutHistory;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_achievements);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });

        api = RetrofitClient.create(this, LearningApiService.class);

        tvStatStreak = findViewById(R.id.tvStatStreak);
        tvStatStreakSub = findViewById(R.id.tvStatStreakSub);
        tvStatTopics = findViewById(R.id.tvStatTopics);
        tvStatWords = findViewById(R.id.tvStatWords);
        tvStatExams = findViewById(R.id.tvStatExams);
        tvHistoryEmpty = findViewById(R.id.tvHistoryEmpty);
        layoutWeek = findViewById(R.id.layoutWeek);
        layoutHistory = findViewById(R.id.layoutHistory);

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadAll();
    }

    private void loadAll() {
        int tz = TimeUtil.offsetMinutes();

        // 1) Chuỗi hiện tại
        api.getStreakStatus(tz).enqueue(new ApiCallback<ApiModels.StreakStatus>() {
            @Override
            public void onSuccess(ApiModels.StreakStatus s) {
                tvStatStreak.setText("🔥 " + s.getCurrentStreak() + " ngày");
                tvStatStreakSub.setText(s.isCompletedToday()
                        ? "Đã hoàn thành hôm nay" : "Học hôm nay để giữ chuỗi");
            }

            @Override
            public void onError(String message) {
                tvStatStreak.setText("🔥 --");
            }
        });

        // 2) Streak 7 ngày
        api.getStreakWeek(tz).enqueue(new ApiCallback<List<ApiModels.StreakDay>>() {
            @Override
            public void onSuccess(List<ApiModels.StreakDay> days) {
                renderWeek(days);
            }

            @Override
            public void onError(String message) {
                Toast.makeText(AchievementsActivity.this, message, Toast.LENGTH_SHORT).show();
            }
        });

        // 3) Chủ đề thành thạo + từ đã nhớ (từ Lộ trình)
        api.getLearningPath().enqueue(new ApiCallback<ApiModels.LearningPath>() {
            @Override
            public void onSuccess(ApiModels.LearningPath lp) {
                List<ApiModels.PathTopic> path = lp.getPath();
                int total = path == null ? 0 : path.size();
                int doneTopics = 0;
                int words = 0;
                for (int i = 0; i < total; i++) {
                    ApiModels.PathTopic t = path.get(i);
                    if (t.getMasteryPercent() >= 100) doneTopics++;
                    words += t.getMasteredWords();
                }
                tvStatTopics.setText(doneTopics + "/" + total);
                tvStatWords.setText(String.valueOf(words));
            }

            @Override
            public void onError(String message) { }
        });

        // 4) Số bài thi + lịch sử
        api.getExamHistory().enqueue(new ApiCallback<List<ApiModels.ExamHistoryItem>>() {
            @Override
            public void onSuccess(List<ApiModels.ExamHistoryItem> history) {
                tvStatExams.setText(String.valueOf(history.size()));
                renderHistory(history);
            }

            @Override
            public void onError(String message) { }
        });
    }

    /** Mỗi ngày một cột: 🔥 nếu có học, ○ nếu không; nhãn là thứ trong tuần. */
    private void renderWeek(List<ApiModels.StreakDay> days) {
        layoutWeek.removeAllViews();
        for (ApiModels.StreakDay d : days) {
            int dow = LocalDate.parse(d.getDate()).getDayOfWeek().getValue() - 1; // Thứ 2 = 0

            LinearLayout col = new LinearLayout(this);
            col.setOrientation(LinearLayout.VERTICAL);
            col.setGravity(Gravity.CENTER_HORIZONTAL);
            col.setLayoutParams(new LinearLayout.LayoutParams(0,
                    LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

            TextView icon = new TextView(this);
            icon.setText(d.isCompleted() ? "🔥" : "○");
            icon.setTextSize(22);
            icon.setTextColor(d.isCompleted() ? 0xFFEA580C : 0xFFCBD5E1);

            TextView label = new TextView(this);
            label.setText(DAY_LABELS[dow]);
            label.setTextSize(12);
            label.setTextColor(0xFF64748B);

            col.addView(icon);
            col.addView(label);
            layoutWeek.addView(col);
        }
    }

    private void renderHistory(List<ApiModels.ExamHistoryItem> history) {
        layoutHistory.removeAllViews();
        tvHistoryEmpty.setVisibility(history.isEmpty() ? View.VISIBLE : View.GONE);
        float d = getResources().getDisplayMetrics().density;

        for (ApiModels.ExamHistoryItem h : history) {
            CardView card = new CardView(this);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            lp.topMargin = (int) (10 * d);
            card.setLayoutParams(lp);
            card.setRadius(14 * d);
            card.setCardElevation(2 * d);
            card.setCardBackgroundColor(0xFFFFFFFF);

            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding((int) (16 * d), (int) (14 * d), (int) (16 * d), (int) (14 * d));

            LinearLayout left = new LinearLayout(this);
            left.setOrientation(LinearLayout.VERTICAL);
            left.setLayoutParams(new LinearLayout.LayoutParams(0,
                    LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

            TextView title = new TextView(this);
            title.setText(h.getExamTitle());
            title.setTextColor(0xFF0F172A);
            title.setTextSize(15);

            String when = h.getSubmittedAt() == null ? ""
                    : h.getSubmittedAt().replace('T', ' ')
                    .substring(0, Math.min(16, h.getSubmittedAt().length()));
            TextView sub = new TextView(this);
            sub.setText(when + " · " + (h.getTimeSpent() / 60) + " phút");
            sub.setTextColor(0xFF64748B);
            sub.setTextSize(12);

            left.addView(title);
            left.addView(sub);

            TextView score = new TextView(this);
            score.setText(String.format(Locale.getDefault(), "%.1f/10", h.getScore()));
            score.setTextColor(h.getScore() >= 5 ? 0xFF16A34A : 0xFFDC2626);
            score.setTextSize(16);

            row.addView(left);
            row.addView(score);
            card.addView(row);
            layoutHistory.addView(card);
        }
    }
}