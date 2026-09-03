package com.els.app.ui.auth;

import android.os.Bundle;
import android.text.TextUtils;
import android.util.Patterns;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.els.app.R;
import com.els.app.data.remote.api.AuthApiService;
import com.els.app.data.remote.dto.request.RegisterRequest;
import com.els.app.data.remote.dto.response.ApiResponse;
import com.els.app.data.remote.dto.response.UserResponse;
import com.els.app.network.RetrofitClient;
import com.google.android.material.textfield.TextInputEditText;

import java.util.Objects;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RegisterActivity extends AppCompatActivity {

    private TextInputEditText edtUsername;
    private TextInputEditText edtEmail;
    private TextInputEditText edtPassword;
    private TextInputEditText edtConfirmPassword;
    private View progressOverlay;

    private AuthApiService apiService;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        apiService = RetrofitClient.getClient(this).create(AuthApiService.class);

        edtUsername = findViewById(R.id.edtRegUsername);
        edtEmail = findViewById(R.id.edtRegEmail);
        edtPassword = findViewById(R.id.edtRegPassword);
        edtConfirmPassword = findViewById(R.id.edtRegConfirmPassword);
        progressOverlay = findViewById(R.id.progressOverlay);

        findViewById(R.id.btnRegister).setOnClickListener(v -> performRegister());
        findViewById(R.id.tvToLogin).setOnClickListener(v -> finish());
    }

    private void performRegister() {
        String username = text(edtUsername);
        String email = text(edtEmail);
        String password = text(edtPassword);
        String confirmPassword = text(edtConfirmPassword);

        if (!validateInput(username, email, password, confirmPassword)) {
            return;
        }

        showLoading(true);
        RegisterRequest request = new RegisterRequest(username, email, password);
        apiService.register(request).enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<ApiResponse<UserResponse>> call,
                                   @NonNull Response<ApiResponse<UserResponse>> response) {
                showLoading(false);
                handleRegisterResponse(response);
            }

            @Override
            public void onFailure(@NonNull Call<ApiResponse<UserResponse>> call, @NonNull Throwable t) {
                showLoading(false);
                Toast.makeText(RegisterActivity.this, "Kết nối Server thất bại: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private boolean validateInput(String username, String email, String password, String confirmPassword) {
        if (TextUtils.isEmpty(username) || TextUtils.isEmpty(email)
                || TextUtils.isEmpty(password) || TextUtils.isEmpty(confirmPassword)) {
            Toast.makeText(this, "Vui lòng điền đầy đủ thông tin", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(this, "Email không hợp lệ", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (password.length() < 6) {
            Toast.makeText(this, "Mật khẩu phải có ít nhất 6 ký tự", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (!password.equals(confirmPassword)) {
            Toast.makeText(this, "Mật khẩu xác nhận không khớp", Toast.LENGTH_SHORT).show();
            return false;
        }
        return true;
    }

    private void handleRegisterResponse(@NonNull Response<ApiResponse<UserResponse>> response) {
        ApiResponse<UserResponse> body = response.body();

        if (response.isSuccessful() && body != null && "1000".equals(body.getCode())) {
            Toast.makeText(this, "Đăng ký thành công! Vui lòng đăng nhập.", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // Thử đọc lỗi từ errorBody nếu status không phải 2xx
        String message = "Đăng ký thất bại. Vui lòng thử lại.";
        try {
            if (response.errorBody() != null) {
                String errorJson = response.errorBody().string();
                ApiResponse<?> errorResponse = new com.google.gson.Gson().fromJson(errorJson, ApiResponse.class);
                if (errorResponse != null && errorResponse.getMessage() != null) {
                    message = errorResponse.getMessage();
                }
            } else if (body != null && body.getMessage() != null) {
                message = body.getMessage();
            }
        } catch (Exception ignored) {
            // giữ message mặc định
        }
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }

    private void showLoading(boolean show) {
        progressOverlay.setVisibility(show ? View.VISIBLE : View.GONE);
    }

    private String text(TextInputEditText field) {
        return Objects.requireNonNull(field.getText()).toString().trim();
    }
}