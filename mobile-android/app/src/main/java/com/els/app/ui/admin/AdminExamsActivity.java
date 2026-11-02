package com.els.app.ui.admin;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.els.app.R;
import com.els.app.data.remote.api.AdminApiService;
import com.els.app.data.remote.dto.ApiModels;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;
import com.els.app.ui.common.RowAdapter;

import java.util.ArrayList;
import java.util.List;

/**
 * Tương đương AdminExamsPage.jsx: danh sách đề, tìm kiếm, lọc loại đề, xem chi tiết câu hỏi, xóa.
 * GET /admin/exams , GET /admin/exams/{id} , DELETE /admin/exams/{id}
 */
public class AdminExamsActivity extends AppCompatActivity {

    private static final int PAGE_SIZE = 10;
    private static final String[] TYPE_FILTER = {"ALL", "TOPIC", "PLACEMENT"};
    private static final String[] TYPE_LABEL = {"Mọi loại đề", "Theo chủ đề", "Đầu vào"};

    private AdminApiService api;
    private RowAdapter adapter;
    private EditText edtSearch;
    private Spinner spinnerType;
    private View progress, tvEmpty;
    private TextView btnLoadMore;
    private int page = 1, totalPages = 1;
    private boolean loading = false, ignoreSpinner = true;

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

        api = RetrofitClient.create(this, AdminApiService.class);

        ((TextView) findViewById(R.id.tvTitle)).setText("Quản lý đề thi");
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        View btnAction = findViewById(R.id.btnAction);
        ((TextView) btnAction).setText("✨ Sinh đề");
        btnAction.setVisibility(View.VISIBLE);
        btnAction.setOnClickListener(v -> startActivity(new Intent(this, AdminExamGenerateActivity.class)));

        findViewById(R.id.layoutFilters).setVisibility(View.VISIBLE);
        edtSearch = findViewById(R.id.edtSearch);
        edtSearch.setHint("Tìm theo tên đề hoặc chủ đề");
        spinnerType = findViewById(R.id.spinnerA);
        spinnerType.setVisibility(View.VISIBLE);
        spinnerType.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, TYPE_LABEL));

        progress = findViewById(R.id.progressLoading);
        tvEmpty = findViewById(R.id.tvEmpty);
        btnLoadMore = findViewById(R.id.btnLoadMore);

        adapter = new RowAdapter(row -> showDetail((ApiModels.AdminExamItem) row.payload));
        RecyclerView rv = findViewById(R.id.rvRows);
        rv.setLayoutManager(new LinearLayoutManager(this));
        rv.setAdapter(adapter);

        spinnerType.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> p, View v, int pos, long id) {
                if (!ignoreSpinner) reload();
            }

            @Override
            public void onNothingSelected(AdapterView<?> p) { }
        });
        edtSearch.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                reload();
                return true;
            }
            return false;
        });
        btnLoadMore.setOnClickListener(v -> load(page + 1));

        spinnerType.post(() -> ignoreSpinner = false);
    }

    @Override
    protected void onResume() {
        super.onResume();
        reload();   // quay lại từ màn "Sinh đề" thì danh sách tự cập nhật
    }

    private void reload() {
        adapter.setRows(new ArrayList<>());
        load(1);
    }

    private void load(int pageToLoad) {
        if (loading) return;
        loading = true;
        progress.setVisibility(View.VISIBLE);
        btnLoadMore.setVisibility(View.GONE);

        String search = edtSearch.getText().toString().trim();
        String type = TYPE_FILTER[spinnerType.getSelectedItemPosition()];

        api.getExams(search.isEmpty() ? null : search, null,
                        "ALL".equals(type) ? null : type, pageToLoad, PAGE_SIZE)
                .enqueue(new ApiCallback<ApiModels.AdminExamPage>() {
                    @Override
                    public void onSuccess(ApiModels.AdminExamPage result) {
                        loading = false;
                        progress.setVisibility(View.GONE);
                        page = pageToLoad;
                        totalPages = result.getPagination().getTotalPages();

                        List<RowAdapter.Row> rows = new ArrayList<>();
                        for (ApiModels.AdminExamItem e : result.getExams()) {
                            String topic = e.getTopicTitle() != null ? e.getTopicTitle() : "Bài thi đầu vào";
                            rows.add(new RowAdapter.Row(e.getTitle(),
                                    topic + "\n" + e.getDuration() + " phút · " + e.getQuestionCount() + " câu",
                                    "PLACEMENT".equals(e.getExamType()) ? "Đầu vào" : "Chủ đề", e));
                        }
                        if (pageToLoad == 1) adapter.setRows(rows); else adapter.addRows(rows);

                        tvEmpty.setVisibility(adapter.size() == 0 ? View.VISIBLE : View.GONE);
                        btnLoadMore.setText("Tải thêm (trang " + page + "/" + totalPages + ")");
                        btnLoadMore.setVisibility(page < totalPages ? View.VISIBLE : View.GONE);
                    }

                    @Override
                    public void onError(String message) {
                        loading = false;
                        progress.setVisibility(View.GONE);
                        Toast.makeText(AdminExamsActivity.this, message, Toast.LENGTH_LONG).show();
                    }
                });
    }

    // ---------- Chi tiết + xóa ----------
    private void showDetail(ApiModels.AdminExamItem item) {
        api.getExamDetail(item.getId()).enqueue(new ApiCallback<ApiModels.AdminExamDetail>() {
            @Override
            public void onSuccess(ApiModels.AdminExamDetail d) {
                StringBuilder sb = new StringBuilder();
                int i = 1;
                for (ApiModels.AdminQuestion q : d.getQuestions()) {
                    sb.append(i++).append(". ").append(q.getQuestionText()).append("\n")
                            .append("   A. ").append(q.getOptionA()).append("\n")
                            .append("   B. ").append(q.getOptionB()).append("\n")
                            .append("   C. ").append(q.getOptionC()).append("\n")
                            .append("   D. ").append(q.getOptionD()).append("\n")
                            .append("   ✅ Đáp án: ").append(q.getCorrectOption()).append("\n\n");
                }
                new AlertDialog.Builder(AdminExamsActivity.this)
                        .setTitle(d.getTitle())
                        .setMessage(sb.toString().trim())
                        .setPositiveButton("Đóng", null)
                        .setNegativeButton("Xóa đề", (dlg, w) -> confirmDelete(item))
                        .show();
            }

            @Override
            public void onError(String message) {
                Toast.makeText(AdminExamsActivity.this, message, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void confirmDelete(ApiModels.AdminExamItem item) {
        new AlertDialog.Builder(this)
                .setTitle("Xóa đề thi?")
                .setMessage("Xóa \"" + item.getTitle() + "\" cùng toàn bộ câu hỏi và kết quả làm bài liên quan. Không thể hoàn tác.")
                .setPositiveButton("Xóa", (d, w) ->
                        api.deleteExam(item.getId()).enqueue(new ApiCallback<Object>() {
                            @Override
                            public void onSuccess(Object r) {
                                Toast.makeText(AdminExamsActivity.this, "Đã xóa đề thi", Toast.LENGTH_SHORT).show();
                                reload();
                            }

                            @Override
                            public void onError(String message) {
                                Toast.makeText(AdminExamsActivity.this, message, Toast.LENGTH_LONG).show();
                            }
                        }))
                .setNegativeButton("Hủy", null)
                .show();
    }
}
