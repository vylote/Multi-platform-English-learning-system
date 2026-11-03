package com.els.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
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
import com.els.app.ui.common.RowAdapter;

import java.util.ArrayList;
import java.util.List;

/**
 * Chọn chủ đề. Tương đương ExamTopicsPage.jsx (MODE_EXAM) và màn chọn chủ đề của ReviewPage.jsx (MODE_REVIEW).
 * Dữ liệu: GET /topics
 */
public class TopicPickerActivity extends AppCompatActivity {

    public static final String EXTRA_MODE = "mode";
    public static final String MODE_EXAM = "exam";
    public static final String MODE_REVIEW = "review";

    private String mode;
    private View progressLoading;
    private RowAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_list_screen);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });

        mode = getIntent().getStringExtra(EXTRA_MODE);
        if (mode == null) mode = MODE_EXAM;

        ((TextView) findViewById(R.id.tvTitle)).setText(
                MODE_REVIEW.equals(mode) ? "Chọn bộ từ để ôn tập" : "Chọn chủ đề đề thi");
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        progressLoading = findViewById(R.id.progressLoading);

        adapter = new RowAdapter(this::onRowClick);
        RecyclerView rv = findViewById(R.id.rvRows);
        rv.setLayoutManager(new LinearLayoutManager(this));
        rv.setAdapter(adapter);

        load();
    }

    private void load() {
        progressLoading.setVisibility(View.VISIBLE);
        RetrofitClient.create(this, LearningApiService.class).getTopics()
                .enqueue(new ApiCallback<List<ApiModels.TopicDto>>() {
                    @Override
                    public void onSuccess(List<ApiModels.TopicDto> topics) {
                        progressLoading.setVisibility(View.GONE);
                        List<RowAdapter.Row> rows = new ArrayList<>();
                        if (MODE_REVIEW.equals(mode)) {
                            // Giống nút "Ngẫu nhiên" của web: bộ từ ôn tập hằng ngày
                            rows.add(new RowAdapter.Row("🎲 Ôn tập hằng ngày (ngẫu nhiên)",
                                    "Hệ thống chọn bộ từ phù hợp cho hôm nay", "", null));
                        }
                        if (topics != null) {
                            for (ApiModels.TopicDto t : topics) {
                                rows.add(new RowAdapter.Row(t.getTitle(), t.getDescription(), "›", t));
                            }
                        }
                        adapter.setRows(rows);
                    }

                    @Override
                    public void onError(String message) {
                        progressLoading.setVisibility(View.GONE);
                        Toast.makeText(TopicPickerActivity.this, message, Toast.LENGTH_LONG).show();
                    }
                });
    }

    private void onRowClick(RowAdapter.Row row) {
        ApiModels.TopicDto topic = (ApiModels.TopicDto) row.payload; // null = ôn tập hằng ngày
        Intent intent;
        if (MODE_REVIEW.equals(mode)) {
            intent = new Intent(this, VocabularyActivity.class);
            if (topic != null) intent.putExtra(VocabularyActivity.EXTRA_TOPIC_ID, topic.getId());
        } else {
            if (topic == null) return;
            intent = new Intent(this, ExamListActivity.class);
            intent.putExtra(ExamListActivity.EXTRA_TOPIC_ID, topic.getId());
        }
        startActivity(intent);
    }
}
