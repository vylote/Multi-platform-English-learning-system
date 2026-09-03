package com.els.app.data.remote.dto.response;

import lombok.Data;

@Data
public class ApiResponse<T> {
    private String code;
    private String message;
    private T result;
}