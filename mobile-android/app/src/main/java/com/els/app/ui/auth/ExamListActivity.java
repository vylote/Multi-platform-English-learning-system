package com.els.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.annotation.NonNull;
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

import java.util.ArrayList;
import java.util.List;

/** Tương đương ExamListPage.jsx: GET /exams?topic_id=...&page=1&pageSize=50 */
public class ExamListActivity extends AppCompatActivity {

    public static final String EXTRA_TOPIC_ID = "topic_id";

    private final List<ApiModels.ExamDto> exams = new ArrayList<>();
    private ExamAdapter adapter;
    private View progressLoading;
    private View tvEmpty;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_exam_list);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });

        progressLoading = findViewById(R.id.progressLoading);
        tvEmpty = findViewById(R.id.tvEmpty);
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        RecyclerView rv = findViewById(R.id.rvExams);
        // Giống ExamDetailPage.jsx: xem thông tin đề rồi mới bấm "Bắt đầu"
        adapter = new ExamAdapter(exams, exam ->
                new androidx.appcompat.app.AlertDialog.Builder(this)
                        .setTitle(exam.getTitle())
                        .setMessage("Thời gian: " + exam.getDuration() + " phút\n"
                                + "Số câu hỏi: " + exam.getQuestionCount() + "\n\n"
                                + "Đồng hồ chạy ngay khi bạn bắt đầu. Thoát giữa chừng sẽ hủy lượt làm bài.")
                        .setPositiveButton("Bắt đầu", (d, w) -> {
                            Intent i = new Intent(this, QuizActivity.class);
                            i.putExtra(QuizActivity.EXTRA_EXAM_ID, exam.getId());
                            startActivity(i);
                        })
                        .setNegativeButton("Để sau", null)
                        .show());
        rv.setLayoutManager(new LinearLayoutManager(this));
        rv.setAdapter(adapter);

        loadExams();
    }

    private void loadExams() {
        long topicId = getIntent().getLongExtra(EXTRA_TOPIC_ID, 0);
        Long topicFilter = topicId > 0 ? topicId : null; // null -> Retrofit bỏ qua tham số

        progressLoading.setVisibility(View.VISIBLE);
        RetrofitClient.create(this, LearningApiService.class)
                .getExams(topicFilter, 1, 50)
                .enqueue(new ApiCallback<ApiModels.PageDto<ApiModels.ExamDto>>() {
                    @Override
                    public void onSuccess(ApiModels.PageDto<ApiModels.ExamDto> page) {
                        progressLoading.setVisibility(View.GONE);
                        exams.clear();
                        if (page != null && page.getData() != null) exams.addAll(page.getData());
                        adapter.notifyDataSetChanged();
                        tvEmpty.setVisibility(exams.isEmpty() ? View.VISIBLE : View.GONE);
                    }

                    @Override
                    public void onError(String message) {
                        progressLoading.setVisibility(View.GONE);
                        Toast.makeText(ExamListActivity.this, message, Toast.LENGTH_LONG).show();
                    }
                });
    }

    private static class ExamAdapter extends RecyclerView.Adapter<ExamAdapter.VH> {

        interface Listener {
            void onClick(ApiModels.ExamDto exam);
        }

        private final List<ApiModels.ExamDto> data;
        private final Listener listener;

        ExamAdapter(List<ApiModels.ExamDto> data, Listener listener) {
            this.data = data;
            this.listener = listener;
        }

        @NonNull
        @Override
        public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            return new VH(LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_exam, parent, false));
        }

        @Override
        public void onBindViewHolder(@NonNull VH h, int position) {
            ApiModels.ExamDto e = data.get(position);
            h.tvTitle.setText(e.getTitle());
            h.tvMeta.setText(e.getDuration() + " phút · " + e.getQuestionCount() + " câu");
            h.itemView.setOnClickListener(v -> listener.onClick(e));
        }

        @Override
        public int getItemCount() {
            return data.size();
        }

        static class VH extends RecyclerView.ViewHolder {
            final TextView tvTitle;
            final TextView tvMeta;

            VH(@NonNull View itemView) {
                super(itemView);
                tvTitle = itemView.findViewById(R.id.tvExamTitle);
                tvMeta = itemView.findViewById(R.id.tvExamMeta);
            }
        }
    }
}
