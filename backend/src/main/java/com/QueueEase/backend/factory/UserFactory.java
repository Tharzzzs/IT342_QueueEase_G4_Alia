package com.QueueEase.backend.factory;

import com.QueueEase.backend.model.User;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.Map;

@Component
public class UserFactory {

    public User createRegularUser(Map<String, String> payload) {
        return User.builder()
                .firstname(payload.get("firstname"))
                .lastname(payload.get("lastname"))
                .email(payload.get("email").toLowerCase().trim())
                .role("USER")
                .createdAt(Instant.now().toString())
                .build();
    }

    public User createStaffUser(Map<String, String> payload) {
        return User.builder()
                .firstname(payload.get("firstname"))
                .lastname(payload.get("lastname"))
                .email(payload.get("email").toLowerCase().trim())
                .role("STAFF")
                .createdAt(Instant.now().toString())
                .build();
    }

    public User createGoogleUser(String email, String firstName, String lastName) {
        return User.builder()
                .email(email.toLowerCase().trim())
                .firstname(firstName)
                .lastname(lastName)
                .role("USER")
                .createdAt(Instant.now().toString())
                .build();
    }
}
