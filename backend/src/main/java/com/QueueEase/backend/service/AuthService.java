package com.QueueEase.backend.service;

import com.QueueEase.backend.model.User;
import com.google.cloud.firestore.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.util.Collections;
@Service
public class AuthService {
    private final Firestore db;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private static final String CLIENT_ID = "770395482652-o453hvr1sqlgfaqvedl5vj07tfkehf6f.apps.googleusercontent.com";
    public AuthService(Firestore db) {
        this.db = db;
    }

    /**
     * Standard Login: Used by the /login endpoint
     */
    public User authenticate(String email, String password) throws Exception {
        var query = db.collection("users")
                .whereEqualTo("email", email.toLowerCase().trim())
                .get().get();

        if (query.isEmpty()) return null;

        var doc = query.getDocuments().get(0);
        User user = doc.toObject(User.class);
        user.setId(doc.getId());

        // Returns user if password matches, else null
        if (user.getPasswordHash() != null && encoder.matches(password, user.getPasswordHash())) {
            return user;
        }
        return null;
    }

    /**
     * Google Login: Used by the /google endpoint
     */
    public User processGoogleLogin(String idTokenString) throws Exception {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(CLIENT_ID))
                .build();

        GoogleIdToken idToken = verifier.verify(idTokenString);
        if (idToken == null) throw new Exception("Invalid ID Token");

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail().toLowerCase().trim();

        // Check Firestore
        var query = db.collection("users").whereEqualTo("email", email).get().get();

        if (!query.isEmpty()) {
            var doc = query.getDocuments().get(0);
            User user = doc.toObject(User.class);
            user.setId(doc.getId());
            return user;
        } else {
            // Create user from Google Payload
            User newUser = User.builder()
                    .email(email)
                    .firstname((String) payload.get("given_name"))
                    .lastname((String) payload.get("family_name"))
                    .role("USER")
                    .createdAt(Instant.now().toString())
                    .build();

            var docRef = db.collection("users").add(newUser).get();
            newUser.setId(docRef.getId());
            return newUser;
        }
    }

    /**
     * Registration: Used by the /register endpoint
     */
    public String registerUser(User user, String password, String role) throws Exception {
        user.setPasswordHash(encoder.encode(password));
        user.setRole(role.toUpperCase());
        user.setCreatedAt(Instant.now().toString());
        return db.collection("users").add(user).get().getId();
    }
}