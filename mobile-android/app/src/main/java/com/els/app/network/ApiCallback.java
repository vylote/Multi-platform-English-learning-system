package com.els.app.network;

import androidx.annotation.NonNull;

import com.els.app.data.remote.dto.response.ApiResponse;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Callback dùng chung: tự bóc lớp bọc { code, message, result } của backend.
 * code == "1000" là thành công (xem backend/src/common/api-response.js).
 * Các hàm onSuccess/onError luôn chạy trên UI thread.
 */
public abstract class ApiCallback<T> implements Callback<ApiResponse<T>> {

    public abstract void onSuccess(T result);

    public abstract void onError(String message);

    @Override
    public void onResponse(@NonNull Call<ApiResponse<T>> call,
                           @NonNull Response<ApiResponse<T>> response) {
        ApiResponse<T> body = response.body();
        if (response.isSuccessful() && body != null && "1000".equals(body.getCode())) {
            onSuccess(body.getResult());
            return;
        }

        String message = "Đã xảy ra lỗi (" + response.code() + ")";
        try {
            if (body != null && body.getMessage() != null) {
                message = body.getMessage();
            } else if (response.errorBody() != null) {
                JsonObject obj = new JsonParser()
                        .parse(response.errorBody().string()).getAsJsonObject();
                if (obj.has("message") && !obj.get("message").isJsonNull()) {
                    message = obj.get("message").getAsString();
                }
            }
        } catch (Exception ignored) {
            // giữ message mặc định
        }
        onError(message);
    }

    @Override
    public void onFailure(@NonNull Call<ApiResponse<T>> call, @NonNull Throwable t) {
        if (call.isCanceled()) return;
        onError("Không kết nối được máy chủ. Kiểm tra mạng và BASE_URL.");
    }
}
