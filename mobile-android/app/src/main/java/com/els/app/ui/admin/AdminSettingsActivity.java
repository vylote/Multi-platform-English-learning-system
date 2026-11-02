package com.els.app.ui.admin;

import android.os.Bundle;
import android.text.InputType;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
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
import androidx.appcompat.widget.SwitchCompat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Tương đương AdminSettingsPage.jsx. Form được dựng động theo dataType của từng cấu hình:
 *   boolean -> công tắc | number -> ô số | string/json -> ô chữ.
 * GET /admin/settings , PUT /admin/settings {settings:{key:value}} , POST /admin/settings/reset
 */
public class AdminSettingsActivity extends AppCompatActivity {

    private AdminApiService api;
    private LinearLayout layoutRows;
    private View progress;

    private final Map<String, String> original = new HashMap<>();   // key -> rawValue lấy từ server
    private final Map<String, View> inputs = new HashMap<>();       // key -> view nhập
    private final Map<String, String> types = new HashMap<>();      // key -> dataType

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_admin_form);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });

        api = RetrofitClient.create(this, AdminApiService.class);
        ((TextView) findViewById(R.id.tvTitle)).setText("Cấu hình hệ thống");
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        layoutRows = findViewById(R.id.layoutRows);
        progress = findViewById(R.id.progressLoading);

        TextView btnReset = findViewById(R.id.btnSecondary);
        btnReset.setText("Về mặc định");
        btnReset.setOnClickListener(v -> new AlertDialog.Builder(this)
                .setTitle("Khôi phục mặc định?")
                .setMessage("Toàn bộ cấu hình sẽ về giá trị ban đầu của hệ thống.")
                .setPositiveButton("Khôi phục", (d, w) -> resetDefaults())
                .setNegativeButton("Hủy", null)
                .show());
        findViewById(R.id.btnPrimary).setOnClickListener(v -> save());

        load();
    }

    private void load() {
        progress.setVisibility(View.VISIBLE);
        api.getSettings().enqueue(new ApiCallback<ApiModels.SettingsData>() {
            @Override
            public void onSuccess(ApiModels.SettingsData data) {
                progress.setVisibility(View.GONE);
                render(data.getSettings());
            }

            @Override
            public void onError(String message) {
                progress.setVisibility(View.GONE);
                Toast.makeText(AdminSettingsActivity.this, message, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void render(List<ApiModels.SettingItem> list) {
        layoutRows.removeAllViews();
        original.clear();
        inputs.clear();
        types.clear();
        float d = getResources().getDisplayMetrics().density;

        String lastGroup = null;
        for (ApiModels.SettingItem s : list) {
            if (!s.getGroupName().equals(lastGroup)) {
                lastGroup = s.getGroupName();
                TextView header = new TextView(this);
                header.setText(groupTitle(lastGroup));
                header.setTextSize(15);
                header.setTextColor(0xFF4F46E5);
                header.setPadding(0, (int) (18 * d), 0, (int) (4 * d));
                layoutRows.addView(header);
            }

            TextView label = new TextView(this);
            label.setText(s.getLabel());
            label.setTextColor(0xFF0F172A);
            label.setTextSize(14);
            label.setPadding(0, (int) (10 * d), 0, 0);
            layoutRows.addView(label);

            if (s.getDescription() != null) {
                TextView desc = new TextView(this);
                desc.setText(s.getDescription());
                desc.setTextColor(0xFF64748B);
                desc.setTextSize(12);
                layoutRows.addView(desc);
            }

            View input;
            if ("boolean".equals(s.getDataType())) {
                SwitchCompat sw = new SwitchCompat(this);
                sw.setChecked("true".equalsIgnoreCase(s.getRawValue()));
                input = sw;
            } else {
                EditText et = new EditText(this);
                et.setText(s.getRawValue());
                et.setSingleLine(true);
                if ("number".equals(s.getDataType())) {
                    et.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL);
                }
                input = et;
            }
            layoutRows.addView(input);

            original.put(s.getKey(), s.getRawValue());
            inputs.put(s.getKey(), input);
            types.put(s.getKey(), s.getDataType());
        }
    }

    private String groupTitle(String key) {
        switch (key) {
            case "LEARNING": return "Học tập & Lộ trình";
            case "EXAM": return "Thi cử";
            case "PLACEMENT": return "Thi đầu vào";
            case "AI": return "Trí tuệ nhân tạo";
            case "SYSTEM": return "Hệ thống";
            default: return key;
        }
    }

    private String currentValue(String key) {
        View v = inputs.get(key);
        if (v instanceof SwitchCompat) return ((SwitchCompat) v).isChecked() ? "true" : "false";
        return ((EditText) v).getText().toString().trim();
    }

    private boolean sameValue(String key, String now, String before) {
        if ("number".equals(types.get(key))) {
            try {
                return Double.parseDouble(now) == Double.parseDouble(before);
            } catch (NumberFormatException e) {
                return false;
            }
        }
        return now.equals(before);
    }

    /** Chỉ gửi những cấu hình thực sự thay đổi (giống changedKeys ở web). */
    private void save() {
        Map<String, String> changed = new HashMap<>();
        for (String key : inputs.keySet()) {
            String now = currentValue(key);
            if ("number".equals(types.get(key)) && now.isEmpty()) {
                Toast.makeText(this, "Giá trị số không được để trống", Toast.LENGTH_SHORT).show();
                return;
            }
            if (!sameValue(key, now, original.get(key))) changed.put(key, now);
        }
        if (changed.isEmpty()) {
            Toast.makeText(this, "Chưa có thay đổi nào", Toast.LENGTH_SHORT).show();
            return;
        }

        api.updateSettings(new ApiModels.UpdateSettingsRequest(changed))
                .enqueue(new ApiCallback<ApiModels.SettingsData>() {
                    @Override
                    public void onSuccess(ApiModels.SettingsData data) {
                        Toast.makeText(AdminSettingsActivity.this,
                                "Đã lưu " + changed.size() + " cấu hình", Toast.LENGTH_SHORT).show();
                        render(data.getSettings());
                    }

                    @Override
                    public void onError(String message) {
                        Toast.makeText(AdminSettingsActivity.this, message, Toast.LENGTH_LONG).show();
                    }
                });
    }

    private void resetDefaults() {
        api.resetSettings().enqueue(new ApiCallback<ApiModels.SettingsData>() {
            @Override
            public void onSuccess(ApiModels.SettingsData data) {
                Toast.makeText(AdminSettingsActivity.this, "Đã khôi phục mặc định", Toast.LENGTH_SHORT).show();
                render(data.getSettings());
            }

            @Override
            public void onError(String message) {
                Toast.makeText(AdminSettingsActivity.this, message, Toast.LENGTH_LONG).show();
            }
        });
    }
}
