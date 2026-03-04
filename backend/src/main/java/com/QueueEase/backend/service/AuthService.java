package com.QueueEase.backend.service;

import com.QueueEase.backend.model.User;
import com.google.cloud.firestore.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.Instant;

@Service
public class AuthService {
    private final Firestore db;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(Firestore db) { this.db = db; }

    public User authenticate(String email, String password) throws Exception {
        var query = db.collection("users").whereEqualTo("email", email.toLowerCase().trim()).get().get();
        if (query.isEmpty()) return null;

        var doc = query.getDocuments().get(0);
        User user = doc.toObject(User.class);
        user.setId(doc.getId());

        // Validates typed password against $2a$10$... hash in Firestore
        return encoder.matches(password, user.getPasswordHash()) ? user : null;
    }

    public String registerUser(User user, String password, String role) throws Exception {
        user.setPasswordHash(encoder.encode(password));
        user.setRole(role.toUpperCase());
        user.setCreatedAt(Instant.now().toString());
        return db.collection("users").add(user).get().getId();
    }
}