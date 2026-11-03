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

import com.els.app.R;
import com.els.app.util.Labels;
import com.els.app.util.LogoutHelper;
import com.els.app.util.SessionManager;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.switchmaterial.SwitchMaterial;

public class ProfileActivity extends AppCompatActivity {

    private TextView tvUserName;
    private TextView tvUserEmail;
    private TextView tvLanguageValue;

    private SwitchMaterial switchNotification;
    private SwitchMaterial switchDarkMode;
    private SwitchMaterial switchSound;

    private View btnEditProfile;
    private View itemChangePassword;
    private View itemSecurity;
    private View itemLanguage;
    private View itemHelp;
    private View itemAbout;

    private MaterialButton btnLogout;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_profile);

        initViews();
        setupWindowInsets();

        bindData();
        setupListeners();
    }

    // ------------------------------------------------
    // ÁNH XẠ VIEW
    // ------------------------------------------------

    private void initViews() {
        tvUserName = findViewById(R.id.tvUserName);
        tvUserEmail = findViewById(R.id.tvUserEmail);
        tvLanguageValue = findViewById(R.id.tvLanguageValue);

        switchNotification = findViewById(R.id.switchNotification);
        switchDarkMode = findViewById(R.id.switchDarkMode);
        switchSound = findViewById(R.id.switchSound);

        btnEditProfile = findViewById(R.id.btnEditProfile);

        itemChangePassword = findViewById(R.id.itemChangePassword);
        itemSecurity = findViewById(R.id.itemSecurity);
        itemLanguage = findViewById(R.id.itemLanguage);
        itemHelp = findViewById(R.id.itemHelp);
        itemAbout = findViewById(R.id.itemAbout);

        btnLogout = findViewById(R.id.btnLogout);
    }

    // ------------------------------------------------
    // WINDOW INSETS
    // ------------------------------------------------

    private void setupWindowInsets() {
        View main = findViewById(R.id.main);

        if (main != null) {
            ViewCompat.setOnApplyWindowInsetsListener(main, (v, insets) -> {
                Insets systemBars = insets.getInsets(
                        WindowInsetsCompat.Type.systemBars()
                );

                v.setPadding(
                        systemBars.left,
                        systemBars.top,
                        systemBars.right,
                        systemBars.bottom
                );

                return insets;
            });
        }
    }

    // ------------------------------------------------
    // HIỂN THỊ THÔNG TIN HỒ SƠ
    // ------------------------------------------------

    private void bindData() {
        SessionManager session = new SessionManager(this);

        String username = session.getUsername();
        String email = session.getEmail();
        String tier = session.getTier();

        tvUserName.setText(
                username != null ? username : "Học viên"
        );

        tvUserEmail.setText(
                (email != null ? email : "")
                        + "\nTrình độ: "
                        + Labels.tier(tier)
        );

        tvLanguageValue.setText("Tiếng Việt");

        switchNotification.setChecked(true);
        switchDarkMode.setChecked(false);
        switchSound.setChecked(true);
    }

    // ------------------------------------------------
    // CÀI ĐẶT VÀ SỰ KIỆN
    // ------------------------------------------------

    private void setupListeners() {

        // Chỉnh sửa hồ sơ: backend chưa có API.
        btnEditProfile.setOnClickListener(v ->
                showComingSoon("Chức năng chỉnh sửa hồ sơ")
        );

        // Thông báo.
        switchNotification.setOnCheckedChangeListener(
                (buttonView, isChecked) ->
                        Toast.makeText(
                                this,
                                isChecked
                                        ? "Đã bật thông báo"
                                        : "Đã tắt thông báo",
                                Toast.LENGTH_SHORT
                        ).show()
        );

        // Giao diện tối.
        switchDarkMode.setOnCheckedChangeListener(
                (buttonView, isChecked) -> {
                    androidx.appcompat.app.AppCompatDelegate.setDefaultNightMode(
                            isChecked
                                    ? androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_YES
                                    : androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_NO
                    );
                }
        );

        // Âm thanh.
        switchSound.setOnCheckedChangeListener(
                (buttonView, isChecked) ->
                        Toast.makeText(
                                this,
                                isChecked
                                        ? "Đã bật âm thanh"
                                        : "Đã tắt âm thanh",
                                Toast.LENGTH_SHORT
                        ).show()
        );

        // Đổi mật khẩu: backend chưa có API.
        itemChangePassword.setOnClickListener(v ->
                showComingSoon("Chức năng đổi mật khẩu")
        );

        // Bảo mật.
        itemSecurity.setOnClickListener(v ->
                showComingSoon("Chức năng bảo mật")
        );

        // Ngôn ngữ.
        itemLanguage.setOnClickListener(v ->
                showComingSoon("Chức năng thay đổi ngôn ngữ")
        );

        // Lịch sử làm bài thi.
        itemHelp.setOnClickListener(v ->
                startActivity(new Intent(
                        this,
                        ExamHistoryActivity.class
                ))
        );

        // Giới thiệu.
        itemAbout.setOnClickListener(v ->
                showComingSoon("Thông tin ứng dụng")
        );

        // Đăng xuất.
        btnLogout.setOnClickListener(v -> doLogout());
    }

    // ------------------------------------------------
    // ĐĂNG XUẤT
    // ------------------------------------------------

    private void doLogout() {
        btnLogout.setEnabled(false);
        LogoutHelper.logout(this);
    }

    // ------------------------------------------------
    // THÔNG BÁO CHỨC NĂNG CHƯA TRIỂN KHAI
    // ------------------------------------------------

    private void showComingSoon(String feature) {
        Toast.makeText(
                this,
                feature + " chưa được triển khai",
                Toast.LENGTH_SHORT
        ).show();
    }
}