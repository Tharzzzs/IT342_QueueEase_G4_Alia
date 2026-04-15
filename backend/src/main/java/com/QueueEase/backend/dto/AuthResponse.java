package com.QueueEase.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String role;
    private String email;
    private String userId;
    private String message;
    private boolean success;
    private String firebaseToken;
}
