package com.els.app.ui.admin;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.els.app.R;
import com.els.app.data.remote.api.AdminApiService;
import com.els.app.data.remote.dto.ApiModels;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;
import com.els.app.util.LogoutHelper;
import com.els.app.util.SessionManager;

/** Trang chủ quản trị - thay cho thanh điều hướng AdminLayout.jsx của web. */
public class AdminHomeActivity extends AppCompatActivity {

    private TextView tvStats;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_admin_home);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return insets;
        });

        tvStats = findViewById(R.id.tvStats);
        String name = new SessionManager(this).getUsername();
        ((TextView) findViewById(R.id.tvAdminName)).setText("Xin chào, " + (name == null ? "admin" : name));

        findViewById(R.id.btnUsers).setOnClickListener(v -> open(AdminUsersActivity.class));
        findViewById(R.id.btnPermissions).setOnClickListener(v -> open(AdminPermissionsActivity.class));
        findViewById(R.id.btnExams).setOnClickListener(v -> open(AdminExamsActivity.class));
        findViewById(R.id.btnGenerate).setOnClickListener(v -> open(AdminExamGenerateActivity.class));
        findViewById(R.id.btnSettings).setOnClickListener(v -> open(AdminSettingsActivity.class));
        findViewById(R.id.btnAdminLogout).setOnClickListener(v -> LogoutHelper.logout(this));
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadStats();
    }

    private void open(Class<?> target) {
        startActivity(new Intent(this, target));
    }

    private void loadStats() {
        RetrofitClient.create(this, AdminApiService.class).getUserStats()
                .enqueue(new ApiCallback<ApiModels.UserStats>() {
                    @Override
                    public void onSuccess(ApiModels.UserStats s) {
                        tvStats.setText("Tổng người dùng: " + s.getTotalUsers()
                                + "\nHọc viên: " + s.getTotalStudents()
                                + "   ·   Quản trị: " + s.getTotalAdmins()
                                + "\nĐăng ký mới 7 ngày qua: " + s.getNewUsersWeek());
                    }

                    @Override
                    public void onError(String message) {
                        tvStats.setText(message);
                    }
                });
    }
}
