package com.els.app.data.remote.dto.response;

import com.google.gson.annotations.SerializedName;
import lombok.Data;

@Data
public class UserResponse {
    private long id;

    private String username;

    private String email;

    private String role;

    // ===== MỚI: khớp User.toJSON() ở backend/src/models/user.model.js =====
    private String tier; // BEGINNER | INTERMEDIATE | ADVANCED | null (chưa xếp trình độ)

    @SerializedName("experience_level")
    private String experienceLevel; // BEGINNER | EXPERIENCED | null

    @SerializedName("learning_purpose")
    private String learningPurpose; // COMMUNICATION | CAREER | TRAVEL | HOBBY | null

    @SerializedName("created_at")
    private String createdAt;
}
