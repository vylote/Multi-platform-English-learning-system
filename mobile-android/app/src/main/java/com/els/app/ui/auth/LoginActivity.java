package com.els.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.els.app.R;
import com.els.app.data.local.database.AppDatabase;
import com.els.app.data.local.entity.UserEntity;
import com.els.app.data.local.mapper.UserMapper;
import com.els.app.data.remote.api.AuthApiService;
import com.els.app.data.remote.dto.request.LoginRequest;
import com.els.app.data.remote.dto.response.ApiResponse;
import com.els.app.data.remote.dto.response.LoginResponse;
import com.els.app.data.remote.dto.response.UserResponse;
import com.els.app.network.RetrofitClient;
import com.google.android.material.textfield.TextInputEditText;

import java.util.Objects;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private TextInputEditText edtUsername;
    private TextInputEditText edtPassword;
    private View progressOverlay; // ProgressBar/overlay trong layout, thay cho ProgressDialog

    private AuthApiService apiService;
    private AppDatabase database;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        database = AppDatabase.getDatabase(this);
        apiService = RetrofitClient.getClient(this).create(AuthApiService.class);

        edtUsername = findViewById(R.id.edtUsername);
        edtPassword = findViewById(R.id.edtPassword);
        progressOverlay = findViewById(R.id.progressOverlay);

        findViewById(R.id.btnLogin).setOnClickListener(v -> performLogin());
        findViewById(R.id.tvToRegister).setOnClickListener(v ->
                startActivity(new Intent(LoginActivity.this, RegisterActivity.class)));
    }

    private void performLogin() {
        String username = Objects.requireNonNull(edtUsername.getText()).toString().trim();
        String password = Objects.requireNonNull(edtPassword.getText()).toString().trim();

        if (username.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Vui lòng nhập đầy đủ tài khoản và mật khẩu", Toast.LENGTH_SHORT).show();
            return;
        }

        showLoading(true);
        apiService.login(new LoginRequest(username, password)).enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<ApiResponse<LoginResponse>> call,
                                   @NonNull Response<ApiResponse<LoginResponse>> response) {
                showLoading(false);
                handleLoginResponse(response);
            }

            @Override
            public void onFailure(@NonNull Call<ApiResponse<LoginResponse>> call, @NonNull Throwable t) {
                showLoading(false);
                Toast.makeText(LoginActivity.this, "Kết nối Server thất bại: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void handleLoginResponse(@NonNull Response<ApiResponse<LoginResponse>> response) {
        if (!response.isSuccessful() || response.body() == null) {
            Toast.makeText(this, "Mật khẩu hoặc tên đăng nhập chưa chính xác.", Toast.LENGTH_SHORT).show();
            return;
        }

        ApiResponse<LoginResponse> apiResponse = response.body();
        if (!"1000".equals(apiResponse.getCode())) {
            Toast.makeText(this, apiResponse.getMessage(), Toast.LENGTH_LONG).show();
            return;
        }

        UserResponse dto = apiResponse.getResult().getUser();
        persistUserLocally(dto);
    }

    private void persistUserLocally(UserResponse dto) {
        new Thread(() -> {
            try {
                UserEntity user = UserMapper.toEntity(dto, database.roleDao());
                database.userDao().insertUser(user);
                runOnUiThread(() -> Toast.makeText(this, "Đăng nhập thành công!", Toast.LENGTH_SHORT).show());
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(this, "Lỗi lưu dữ liệu local: " + e.getMessage(), Toast.LENGTH_LONG).show());
            }
        }).start();
    }

    private void showLoading(boolean show) {
        progressOverlay.setVisibility(show ? View.VISIBLE : View.GONE);
    }
}