package com.els.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.els.app.R;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.switchmaterial.SwitchMaterial;

public class ProfileActivity extends AppCompatActivity {

    private TextView tvUserName;
    private TextView tvUserEmail;
    private TextView tvLanguageValue;

    private SwitchMaterial switchNotification;
    private SwitchMaterial switchDarkMode;
    private SwitchMaterial switchSound;

    private LinearLayout itemChangePassword;
    private LinearLayout itemSecurity;
    private LinearLayout itemLanguage;
    private LinearLayout itemHelp;
    private LinearLayout itemAbout;

    private MaterialButton btnEditProfile;
    private MaterialButton btnLogout;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_profile);

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Không có bottomNav ở màn này — nút back hệ thống sẽ tự quay lại
        // đúng màn trước đó (Home/Learn/Progress) vì các màn đó không finish()
        // khi mở ProfileActivity.

        initViews();
        bindData();
        setupListeners();
    }

    private void initViews() {
        tvUserName = findViewById(R.id.tvUserName);
        tvUserEmail = findViewById(R.id.tvUserEmail);
        tvLanguageValue = findViewById(R.id.tvLanguageValue);

        switchNotification = findViewById(R.id.switchNotification);
        switchDarkMode = findViewById(R.id.switchDarkMode);
        switchSound = findViewById(R.id.switchSound);

        itemChangePassword = findViewById(R.id.itemChangePassword);
        itemSecurity = findViewById(R.id.itemSecurity);
        itemLanguage = findViewById(R.id.itemLanguage);
        itemHelp = findViewById(R.id.itemHelp);
        itemAbout = findViewById(R.id.itemAbout);

        btnEditProfile = findViewById(R.id.btnEditProfile);
        btnLogout = findViewById(R.id.btnLogout);
    }

    private void bindData() {
        // TODO: Lấy dữ liệu thật từ SharedPreferences / ViewModel
        tvUserName.setText("Nguyễn Văn A");
        tvUserEmail.setText("nguyenvana@gmail.com");
        tvLanguageValue.setText("Tiếng Việt");

        // TODO: đọc trạng thái đã lưu (SharedPreferences) để set switch đúng
        switchNotification.setChecked(true);
        switchDarkMode.setChecked(false);
        switchSound.setChecked(true);
    }

    private void setupListeners() {
        btnEditProfile.setOnClickListener(v -> {
            // TODO: mở màn Chỉnh sửa hồ sơ
        });

        itemChangePassword.setOnClickListener(v -> {
            // TODO: mở màn Đổi mật khẩu
        });

        itemSecurity.setOnClickListener(v -> {
            // TODO: mở màn Bảo mật tài khoản
        });

        switchNotification.setOnCheckedChangeListener((buttonView, isChecked) -> {
            // TODO: lưu trạng thái + bật/tắt thông báo
        });

        switchDarkMode.setOnCheckedChangeListener((buttonView, isChecked) -> {
            int mode = isChecked
                    ? AppCompatDelegate.MODE_NIGHT_YES
                    : AppCompatDelegate.MODE_NIGHT_NO;
            AppCompatDelegate.setDefaultNightMode(mode);
            // TODO: lưu trạng thái vào SharedPreferences
        });

        switchSound.setOnCheckedChangeListener((buttonView, isChecked) -> {
            // TODO: lưu trạng thái bật/tắt âm thanh
        });

        itemLanguage.setOnClickListener(v -> {
            // TODO: mở dialog / màn chọn ngôn ngữ
        });

        itemHelp.setOnClickListener(v -> {
            // TODO: mở màn Trợ giúp & hỗ trợ
        });

        itemAbout.setOnClickListener(v -> {
            // TODO: mở màn Về chúng tôi
        });

        btnLogout.setOnClickListener(v -> doLogout());
    }

    private void doLogout() {
        // TODO: xóa session/token đã lưu (SharedPreferences, DataStore...)
        Toast.makeText(this, "Đã đăng xuất", Toast.LENGTH_SHORT).show();

        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}