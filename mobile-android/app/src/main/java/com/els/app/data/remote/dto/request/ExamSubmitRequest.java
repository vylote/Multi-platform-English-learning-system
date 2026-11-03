package com.els.app.data.remote.dto.request;

import com.google.gson.annotations.SerializedName;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class ExamSubmitRequest {
    @SerializedName("session_id")
    private String sessionId;

    private List<Answer> answers;
    private String timezone;

    @Data
    @AllArgsConstructor
    public static class Answer {
        @SerializedName("question_id")
        private long questionId;

        @SerializedName("selected_option")
        private String selectedOption;
    }
}