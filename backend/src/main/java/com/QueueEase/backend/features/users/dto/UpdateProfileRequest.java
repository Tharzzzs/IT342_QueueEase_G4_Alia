package com.QueueEase.backend.features.users.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String firstname;
    private String lastname;
    private String avatarUrl;
}
