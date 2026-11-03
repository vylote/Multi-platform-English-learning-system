package com.els.app.data.remote.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FlashcardUpdateRequest {
    /** "NEW" | "LEARNING" | "MASTERED" */
    private String status;
}