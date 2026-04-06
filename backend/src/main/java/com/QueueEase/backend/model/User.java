package com.QueueEase.backend.model;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @DocumentId
    private String id;

    private String email;

    private String firstname;

    private String lastname;

    @PropertyName("password_hash")
    private String passwordHash;

    @PropertyName("google_id")
    private String googleId;

    private String role; // "ADMIN", "STAFF", or "USER"

    @PropertyName("created_at")
    private String createdAt;

    // By putting @PropertyName on the fields, Lombok's generated
    // getters/setters will inherit the behavior for Firestore.
    // No manual getters/setters needed unless you have custom logic!
}