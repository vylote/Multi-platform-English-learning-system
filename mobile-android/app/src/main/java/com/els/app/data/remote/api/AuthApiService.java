package com.els.app.data.remote.api;

import com.els.app.data.remote.dto.response.ApiResponse;
import com.els.app.data.remote.dto.request.LoginRequest;
import com.els.app.data.remote.dto.request.RegisterRequest;
import com.els.app.data.remote.dto.response.LoginResponse;
import com.els.app.data.remote.dto.response.UserResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;

public interface AuthApiService {
    @POST("auth/login")
    Call<ApiResponse<LoginResponse>> login(@Body LoginRequest request);

    @POST("auth/register")
    Call<ApiResponse<UserResponse>> register(@Body RegisterRequest request);

    // MỚI: khôi phục phiên từ cookie (giống App.jsx gọi api.get("/auth/me"))
    @GET("auth/me")
    Call<ApiResponse<UserResponse>> me();

    // MỚI: đăng xuất - server xóa session trong Redis + clear cookie
    @POST("auth/logout")
    Call<ApiResponse<Object>> logout();
}
