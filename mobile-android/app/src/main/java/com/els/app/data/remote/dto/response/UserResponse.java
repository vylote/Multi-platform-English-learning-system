package com.els.app.data.remote.dto.response;

import com.google.gson.annotations.SerializedName;
import lombok.Data;

@Data
public class UserResponse {
    private long id;

    private String username;

    private String email;

    private String role;

    @SerializedName("created_at")
    private String createdAt;
}
