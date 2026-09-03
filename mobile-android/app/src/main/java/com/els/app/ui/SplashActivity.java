package com.els.app.ui;

import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import com.els.app.R;
import com.els.app.data.local.database.AppDatabase;
import com.els.app.data.local.entity.RoleEntity;
import com.els.app.network.RetrofitClient;
import com.els.app.data.remote.api.RoleApiService;
import com.els.app.data.remote.dto.response.ApiResponse;
import com.els.app.data.remote.dto.response.RoleResponse;
import com.els.app.ui.auth.LoginActivity;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SplashActivity extends AppCompatActivity {

    private AppDatabase database;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        database = AppDatabase.getDatabase(this);
        syncRolesThenProceed();
    }

    private void syncRolesThenProceed() {
        // Nếu local đã có roles rồi thì không cần gọi lại API mỗi lần mở app
        new Thread(() -> {
            int localCount = database.roleDao().count();
            if (localCount > 0) {
                goToLogin();
                return;
            }

            RoleApiService roleApi = RetrofitClient.getClient(this).create(RoleApiService.class);
            roleApi.getAllRoles().enqueue(new Callback<>() {
                @Override
                public void onResponse(@NonNull Call<ApiResponse<List<RoleResponse>>> call,
                                       @NonNull Response<ApiResponse<List<RoleResponse>>> response) {
                    if (response.isSuccessful() && response.body() != null
                            && "1000".equals(response.body().getCode())) {
                        List<RoleResponse> dtos = response.body().getResult();

                        new Thread(() -> {
                            List<RoleEntity> entities = new ArrayList<>();
                            for (RoleResponse dto : dtos) {
                                entities.add(RoleEntity.builder()
                                        .id(dto.getId())
                                        .code(dto.getCode())
                                        .name(dto.getName())
                                        .build());
                            }
                            database.roleDao().insertAll(entities);
                            goToLogin();
                        }).start();
                    } else {
                        // Sync thất bại - vẫn cho vào Login, mapper sẽ fallback roleId = 0
                        goToLogin();
                    }
                }

                @Override
                public void onFailure(@NonNull Call<ApiResponse<List<RoleResponse>>> call, @NonNull Throwable t) {
                    goToLogin();
                }
            });
        }).start();
    }

    private void goToLogin() {
        runOnUiThread(() -> {
            startActivity(new Intent(SplashActivity.this, LoginActivity.class));
            finish();
        });
    }
}