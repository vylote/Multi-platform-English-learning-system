package com.els.app.data.remote.dto.request;

import com.google.gson.annotations.SerializedName;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OnboardingRequest {
    @SerializedName("experience_level")
    private String experienceLevel;

    @SerializedName("learning_purpose")
    private String learningPurpose;
}