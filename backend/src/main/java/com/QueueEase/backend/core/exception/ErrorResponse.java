package com.QueueEase.backend.core.exception;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
public class ErrorResponse {
    private boolean success;
    private Object data;
    private ErrorDetails error;
    private String timestamp;

    @Data
    @Builder
    public static class ErrorDetails {
        private String code;
        private String message;
        private Map<String, String> details;
    }

    public static ErrorResponse buildError(String code, String message, Map<String, String> details) {
        return ErrorResponse.builder()
                .success(false)
                .data(null)
                .timestamp(Instant.now().toString())
                .error(ErrorDetails.builder()
                        .code(code)
                        .message(message)
                        .details(details)
                        .build())
                .build();
    }
}
