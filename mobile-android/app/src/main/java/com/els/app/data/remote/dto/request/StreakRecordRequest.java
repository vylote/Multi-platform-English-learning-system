package com.els.app.data.remote.dto.request;

import com.google.gson.annotations.SerializedName;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StreakRecordRequest {
    @SerializedName("timezone_offset")
    private int timezoneOffset;
}