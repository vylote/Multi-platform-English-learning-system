package com.els.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.els.app.R;
import com.els.app.data.remote.api.LearningApiService;
import com.els.app.data.remote.dto.ApiModels;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;
import com.els.app.util.Labels;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;

import java.util.ArrayList;
import java.util.List;

/**
 * Tương đương frontend-web/src/pages/LearningPathPage.jsx
 * Dữ liệu: GET /learning-path (mở khóa theo Mastery >= 60%).
 * File này THAY THẾ hoàn toàn LearnActivity cũ (dữ liệu giả 3 bài).
 */
public class LearnActivity extends AppCompatActivity {

    private RecyclerView rvPath;
    private ProgressBar progressLoading;
    private TextView tvTier;
    private TextView tvEmpty;
    private MaterialButton btnPlacement;
    private BottomNavigationView bottomNav;

    private final List<ApiModels.PathTopic> topics = new ArrayList<>();
    private PathAdapter adapter;
    private LearningApiService api;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_learn);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(bars.left, bars.top, bars.right, 0);
            return insets;
        });

        api = RetrofitClient.create(this, LearningApiService.class);

        rvPath = findViewById(R.id.rvPath);
        progressLoading = findViewById(R.id.progressLoading);
        tvTier = findViewById(R.id.tvTier);
        tvEmpty = findViewById(R.id.tvEmpty);
        btnPlacement = findViewById(R.id.btnPlacement);
        bottomNav = findViewById(R.id.bottomNav);

        ViewCompat.setOnApplyWindowInsetsListener(bottomNav, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(v.getPaddingLeft(), v.getPaddingTop(), v.getPaddingRight(), bars.bottom);
            return insets;
        });

        adapter = new PathAdapter(topics, this::onTopicClick);
        rvPath.setLayoutManager(new LinearLayoutManager(this));
        rvPath.setAdapter(adapter);

        btnPlacement.setOnClickListener(v -> {
            Intent i = new Intent(this, QuizActivity.class);
            i.putExtra(QuizActivity.EXTRA_PLACEMENT, true);
            startActivity(i);
        });

        setupBottomNav();
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadPath(); // tải lại mỗi lần quay về để cập nhật Mastery sau khi học xong
    }

    private void loadPath() {
        progressLoading.setVisibility(View.VISIBLE);
        tvEmpty.setVisibility(View.GONE);

        api.getLearningPath().enqueue(new ApiCallback<ApiModels.LearningPath>() {
            @Override
            public void onSuccess(ApiModels.LearningPath result) {
                progressLoading.setVisibility(View.GONE);
                tvTier.setText("Trình độ: " + Labels.tier(result.getTier()));
                btnPlacement.setVisibility(result.isNeedsPlacement() ? View.VISIBLE : View.GONE);

                topics.clear();
                if (result.getPath() != null) topics.addAll(result.getPath());
                adapter.notifyDataSetChanged();
                tvEmpty.setVisibility(topics.isEmpty() ? View.VISIBLE : View.GONE);
            }

            @Override
            public void onError(String message) {
                progressLoading.setVisibility(View.GONE);
                Toast.makeText(LearnActivity.this, message, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void onTopicClick(ApiModels.PathTopic topic) {
        if (!topic.isUnlocked()) {
            Toast.makeText(this,
                    "Đạt tối thiểu 60% Mastery ở chủ đề trước để mở khóa", Toast.LENGTH_LONG).show();
            return;
        }

        String[] options = {"Học bài (Quiz + Phát âm)", "Ôn flashcard", "Làm đề thi chủ đề"};
        new AlertDialog.Builder(this)
                .setTitle(topic.getTitle())
                .setItems(options, (dialog, which) -> {
                    Intent intent;
                    if (which == 0) {
                        intent = new Intent(this, TopicLessonActivity.class);
                        intent.putExtra(TopicLessonActivity.EXTRA_TOPIC_ID, topic.getId());
                        intent.putExtra(TopicLessonActivity.EXTRA_TOPIC_TITLE, topic.getTitle());
                    } else if (which == 1) {
                        intent = new Intent(this, VocabularyActivity.class);
                        intent.putExtra(VocabularyActivity.EXTRA_TOPIC_ID, topic.getId());
                    } else {
                        intent = new Intent(this, ExamListActivity.class);
                        intent.putExtra(ExamListActivity.EXTRA_TOPIC_ID, topic.getId());
                    }
                    startActivity(intent);
                })
                .show();
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

    private void navigateTo(Class<?> target) {
        startActivity(new Intent(this, target));
        overridePendingTransition(0, 0);
    }

    // =====================================================================
    // Adapter
    // =====================================================================
    private static class PathAdapter extends RecyclerView.Adapter<PathAdapter.VH> {

        interface Listener {
            void onClick(ApiModels.PathTopic topic);
        }

        private final List<ApiModels.PathTopic> data;
        private final Listener listener;

        PathAdapter(List<ApiModels.PathTopic> data, Listener listener) {
            this.data = data;
            this.listener = listener;
        }

        @NonNull
        @Override
        public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_topic_path, parent, false);
            return new VH(v);
        }

        @Override
        public void onBindViewHolder(@NonNull VH h, int position) {
            ApiModels.PathTopic t = data.get(position);
            h.tvTitle.setText((position + 1) + ". " + t.getTitle());
            h.tvMeta.setText(Labels.difficulty(t.getDifficulty())
                    + " · Thành thạo " + t.getMasteryPercent() + "%"
                    + " · " + t.getMasteredWords() + "/" + t.getTotalWords() + " từ");
            h.progress.setProgress(t.getMasteryPercent());

            String status;
            if (!t.isUnlocked()) status = "🔒";
            else if (t.getMasteryPercent() >= 100) status = "✅";
            else if (t.isCurrent()) status = "▶";
            else status = "›";
            h.tvStatus.setText(status);

            h.itemView.setAlpha(t.isUnlocked() ? 1f : 0.5f);
            h.itemView.setOnClickListener(v -> listener.onClick(t));
        }

        @Override
        public int getItemCount() {
            return data.size();
        }

        static class VH extends RecyclerView.ViewHolder {
            final TextView tvTitle;
            final TextView tvMeta;
            final TextView tvStatus;
            final ProgressBar progress;

            VH(@NonNull View itemView) {
                super(itemView);
                tvTitle = itemView.findViewById(R.id.tvTopicTitle);
                tvMeta = itemView.findViewById(R.id.tvTopicMeta);
                tvStatus = itemView.findViewById(R.id.tvTopicStatus);
                progress = itemView.findViewById(R.id.progressTopic);
            }
        }
    }
}
