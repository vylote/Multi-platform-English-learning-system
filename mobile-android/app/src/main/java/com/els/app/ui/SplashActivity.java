package com.els.app.ui;

import android.content.Intent;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import com.els.app.data.remote.api.AuthApiService;
import com.els.app.data.remote.dto.response.UserResponse;
import com.els.app.network.ApiCallback;
import com.els.app.network.RetrofitClient;
import com.els.app.ui.NavHelper;
import com.els.app.ui.auth.LoginActivity;
import com.els.app.util.SessionManager;

public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        goToLogin();
    }

    // Giữ nguyên tên hàm goToLogin() để các chỗ gọi cũ không phải sửa.
    // Có phiên hợp lệ thì vào app, không có phiên hoặc cookie hết hạn thì về Login.
    private void goToLogin() {
        runOnUiThread(() -> {
            SessionManager session = new SessionManager(this);

            if (!session.isLoggedIn()) {
                openLogin();
                return;
            }

            // Kiểm tra cookie đăng nhập bằng GET /auth/me.
            RetrofitClient.create(this, AuthApiService.class)
                    .me()
                    .enqueue(new ApiCallback<UserResponse>() {

                        @Override
                        public void onSuccess(UserResponse user) {
                            session.saveUser(user);
                            NavHelper.routeAfterAuth(SplashActivity.this);
                        }

                        @Override
                        public void onError(String message) {
                            session.clear();
                            RetrofitClient.clearSession();
                            openLogin();
                        }
                    });
        });
    }

    private void openLogin() {
        startActivity(new Intent(
                SplashActivity.this,
                LoginActivity.class
        ));
        finish();
    }
}