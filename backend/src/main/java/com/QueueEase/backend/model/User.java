package com.QueueEase.backend.model;

import lombok.*;

@Data
@Builder
@NoArgsConstructor // REQUIRED for Firebase toObject()
@AllArgsConstructor
public class User {
    private String id;
    private String email;
    private String firstname; // Lowercase 'f' to match Firestore
    private String lastname;
    private String passwordHash;
    private String role; // "ADMIN", "STAFF", or "USER"
    private String createdAt;
}