package com.els.app.data.remote.api;

import com.els.app.data.remote.dto.response.ApiResponse;
import com.els.app.data.remote.dto.response.RoleResponse;
import java.util.List;
import retrofit2.Call;
import retrofit2.http.GET;

public interface RoleApiService {
    @GET("roles")
    Call<ApiResponse<List<RoleResponse>>> getAllRoles();
}