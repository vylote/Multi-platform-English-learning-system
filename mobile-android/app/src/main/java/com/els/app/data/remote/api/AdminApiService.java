package com.els.app.data.remote.api;

import com.els.app.data.remote.dto.ApiModels.*;
import com.els.app.data.remote.dto.response.ApiResponse;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import retrofit2.http.Query;

/** Endpoint /admin/* - backend yêu cầu role ADMIN (admin.routes.js). */
public interface AdminApiService {

    // ---- Người dùng ----
    @GET("admin/users")
    Call<ApiResponse<AdminUserPage>> getUsers(@Query("search") String search,
                                              @Query("role") String role,
                                              @Query("tier") String tier,
                                              @Query("page") int page,
                                              @Query("limit") int limit);

    @GET("admin/users/stats")
    Call<ApiResponse<UserStats>> getUserStats();

    @GET("admin/roles")
    Call<ApiResponse<List<RoleDto>>> getRoles();

    @PUT("admin/users/{id}/role")
    Call<ApiResponse<Object>> updateUserRole(@Path("id") long userId,
                                             @Body UpdateUserRoleRequest body);

    // ---- Phân quyền ----
    @GET("admin/role-permissions")
    Call<ApiResponse<RolePermissionData>> getRolePermissions();

    @PUT("admin/role-permissions/{roleId}")
    Call<ApiResponse<Object>> updateRolePermissions(@Path("roleId") long roleId,
                                                    @Body UpdateRolePermissionsRequest body);

    // ---- Đề thi ----
    @GET("admin/topics")
    Call<ApiResponse<List<TopicDto>>> getTopics();

    @GET("admin/exams")
    Call<ApiResponse<AdminExamPage>> getExams(@Query("search") String search,
                                              @Query("topicId") String topicId,
                                              @Query("examType") String examType,
                                              @Query("page") int page,
                                              @Query("limit") int limit);

    @GET("admin/exams/{id}")
    Call<ApiResponse<AdminExamDetail>> getExamDetail(@Path("id") long id);

    @POST("admin/exams/generate")
    Call<ApiResponse<GeneratedExam>> generateExam(@Body GenerateExamRequest body);

    @DELETE("admin/exams/{id}")
    Call<ApiResponse<Object>> deleteExam(@Path("id") long id);

    // ---- Cấu hình hệ thống ----
    @GET("admin/settings")
    Call<ApiResponse<SettingsData>> getSettings();

    @PUT("admin/settings")
    Call<ApiResponse<SettingsData>> updateSettings(@Body UpdateSettingsRequest body);

    @POST("admin/settings/reset")
    Call<ApiResponse<SettingsData>> resetSettings();
}
