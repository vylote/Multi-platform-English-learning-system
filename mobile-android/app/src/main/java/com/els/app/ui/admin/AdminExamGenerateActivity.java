package com.els.app.ui.admin;

import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.RadioGroup;
import android.widget.Spinner;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.els.app.R;
import com.els.app.data.remote.api.AdminApiService;
import com.els.app.data.remote.dto.ApiModels;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;

import java.util.ArrayList;
import java.util.List;

/**
 * Tương đương AdminExamGeneratePage.jsx.
 * GET /admin/topics , POST /admin/exams/generate
 */
public class AdminExamGenerateActivity extends AppCompatActivity {

    private static final String[] METHOD_VALUE = {"AUTO", "AI", "DATABASE"};
    private static final String[] METHOD_LABEL = {
            "Tự động (AI nếu có, không thì ngân hàng câu hỏi)",
            "Chỉ dùng AI",
            "Chỉ dùng ngân hàng câu hỏi"};

    private AdminApiService api;
    private final List<ApiModels.TopicDto> topics = new ArrayList<>();
    private Spinner spinnerTopic, spinnerMethod;
    private EditText edtTitle, edtCount, edtDuration;
    private RadioGroup rgType;
    private View btnGenerate, progress, hint, tvTopicLabel;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_admin_generate);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });

        api = RetrofitClient.create(this, AdminApiService.class);

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        spinnerTopic = findViewById(R.id.spinnerTopic);
        spinnerMethod = findViewById(R.id.spinnerMethod);
        edtTitle = findViewById(R.id.edtTitle);
        edtCount = findViewById(R.id.edtCount);
        edtDuration = findViewById(R.id.edtDuration);
        rgType = findViewById(R.id.rgType);
        btnGenerate = findViewById(R.id.btnGenerate);
        progress = findViewById(R.id.progressGenerating);
        hint = findViewById(R.id.tvGenerateHint);
        tvTopicLabel = findViewById(R.id.tvTopicLabel);

        spinnerMethod.setAdapter(new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_dropdown_item, METHOD_LABEL));

        rgType.setOnCheckedChangeListener((g, checkedId) -> {
            boolean topicMode = checkedId == R.id.rbTopic;
            spinnerTopic.setVisibility(topicMode ? View.VISIBLE : View.GONE);
            tvTopicLabel.setVisibility(topicMode ? View.VISIBLE : View.GONE);
        });

        btnGenerate.setOnClickListener(v -> generate());
        loadTopics();
    }

    private void loadTopics() {
        api.getTopics().enqueue(new ApiCallback<List<ApiModels.TopicDto>>() {
            @Override
            public void onSuccess(List<ApiModels.TopicDto> list) {
                topics.clear();
                topics.addAll(list);
                List<String> names = new ArrayList<>();
                for (ApiModels.TopicDto t : list) names.add(t.getTitle());
                spinnerTopic.setAdapter(new ArrayAdapter<>(AdminExamGenerateActivity.this,
                        android.R.layout.simple_spinner_dropdown_item, names));
            }

            @Override
            public void onError(String message) {
                Toast.makeText(AdminExamGenerateActivity.this, message, Toast.LENGTH_LONG).show();
            }
        });
    }

    private int parse(EditText et, int fallback) {
        try {
            return Integer.parseInt(et.getText().toString().trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private void generate() {
        boolean topicMode = rgType.getCheckedRadioButtonId() == R.id.rbTopic;
        Long topicId = null;
        if (topicMode) {
            int pos = spinnerTopic.getSelectedItemPosition();
            if (pos < 0 || pos >= topics.size()) {
                Toast.makeText(this, "Vui lòng chọn một chủ đề", Toast.LENGTH_SHORT).show();
                return;
            }
            topicId = topics.get(pos).getId();
        }

        String title = edtTitle.getText().toString().trim();
        ApiModels.GenerateExamRequest body = new ApiModels.GenerateExamRequest(
                topicMode ? "TOPIC" : "PLACEMENT",
                topicId,
                title.isEmpty() ? null : title,
                parse(edtCount, 10),
                parse(edtDuration, 15),
                METHOD_VALUE[spinnerMethod.getSelectedItemPosition()]);

        setBusy(true);
        api.generateExam(body).enqueue(new ApiCallback<ApiModels.GeneratedExam>() {
            @Override
            public void onSuccess(ApiModels.GeneratedExam exam) {
                setBusy(false);
                edtTitle.setText("");
                new AlertDialog.Builder(AdminExamGenerateActivity.this)
                        .setTitle("Sinh đề thành công")
                        .setMessage("Đã tạo đề: " + exam.getTitle())
                        .setPositiveButton("Xem danh sách đề", (d, w) -> finish())
                        .setNegativeButton("Sinh thêm", null)
                        .show();
            }

            @Override
            public void onError(String message) {
                setBusy(false);
                Toast.makeText(AdminExamGenerateActivity.this, message, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void setBusy(boolean busy) {
        btnGenerate.setEnabled(!busy);
        progress.setVisibility(busy ? View.VISIBLE : View.GONE);
        hint.setVisibility(busy ? View.VISIBLE : View.GONE);
    }
}
