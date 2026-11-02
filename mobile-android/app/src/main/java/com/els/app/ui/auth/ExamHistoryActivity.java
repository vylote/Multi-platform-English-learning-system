package com.els.app.ui.auth;

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
import java.util.Locale;

/** Lịch sử làm bài - tương đương phần "Lịch sử thi" trong ProfilePage.jsx. GET /exams/history */
public class ExamHistoryActivity extends AppCompatActivity {

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

        ((TextView) findViewById(R.id.tvTitle)).setText("Lịch sử làm bài");
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        View progress = findViewById(R.id.progressLoading);
        View empty = findViewById(R.id.tvEmpty);

        RowAdapter adapter = new RowAdapter(null);
        RecyclerView rv = findViewById(R.id.rvRows);
        rv.setLayoutManager(new LinearLayoutManager(this));
        rv.setAdapter(adapter);

        progress.setVisibility(View.VISIBLE);
        RetrofitClient.create(this, LearningApiService.class).getExamHistory()
                .enqueue(new ApiCallback<List<ApiModels.ExamHistoryItem>>() {
                    @Override
                    public void onSuccess(List<ApiModels.ExamHistoryItem> list) {
                        progress.setVisibility(View.GONE);
                        List<RowAdapter.Row> rows = new ArrayList<>();
                        for (ApiModels.ExamHistoryItem h : list) {
                            String when = h.getSubmittedAt() == null ? ""
                                    : h.getSubmittedAt().replace('T', ' ').substring(0,
                                    Math.min(16, h.getSubmittedAt().length()));
                            rows.add(new RowAdapter.Row(
                                    h.getExamTitle(),
                                    when + " · " + (h.getTimeSpent() / 60) + " phút",
                                    String.format(Locale.getDefault(), "%.1f/10", h.getScore()),
                                    h));
                        }
                        adapter.setRows(rows);
                        empty.setVisibility(rows.isEmpty() ? View.VISIBLE : View.GONE);
                    }

                    @Override
                    public void onError(String message) {
                        progress.setVisibility(View.GONE);
                        Toast.makeText(ExamHistoryActivity.this, message, Toast.LENGTH_LONG).show();
                    }
                });
    }
}
