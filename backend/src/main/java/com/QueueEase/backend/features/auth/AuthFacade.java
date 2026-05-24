package com.QueueEase.backend.features.auth;

import com.QueueEase.backend.features.auth.AuthResponse;
import com.QueueEase.backend.features.auth.StandardAuthStrategy;
import com.QueueEase.backend.features.auth.GoogleAuthStrategy;
import com.QueueEase.backend.features.auth.UserFactory;
import com.QueueEase.backend.features.auth.User;
import com.QueueEase.backend.core.security.JwtUtils;
import com.google.cloud.firestore.Firestore;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import com.QueueEase.backend.features.auth.UserRegisteredEvent;

import java.util.Map;
import com.google.firebase.auth.FirebaseAuth;

@Service
public class AuthFacade {
    private final StandardAuthStrategy standardAuthStrategy;
    private final GoogleAuthStrategy googleAuthStrategy;
    private final UserFactory userFactory;
    private final JwtUtils jwtUtils;
    private final Firestore db;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final ApplicationEventPublisher eventPublisher;

    public AuthFacade(StandardAuthStrategy standardAuthStrategy,
                      GoogleAuthStrategy googleAuthStrategy,
                      UserFactory userFactory,
                      JwtUtils jwtUtils,
                      Firestore db,
                      ApplicationEventPublisher eventPublisher) {
        this.standardAuthStrategy = standardAuthStrategy;
        this.googleAuthStrategy = googleAuthStrategy;
        this.userFactory = userFactory;
        this.jwtUtils = jwtUtils;
        this.db = db;
        this.eventPublisher = eventPublisher;
    }

    public AuthResponse login(Map<String, String> credentials) throws Exception {
        User user = standardAuthStrategy.authenticate(credentials);
        if (user != null) {
            String token = jwtUtils.generateToken(user.getEmail(), user.getRole());
            String firebaseToken = FirebaseAuth.getInstance().createCustomToken(user.getId());
            return AuthResponse.builder()
                    .success(true)
                    .accessToken(token)
                    .role(user.getRole())
                    .email(user.getEmail())
                    .userId(user.getId())
                    .firebaseToken(firebaseToken)
                    .firstname(user.getFirstname())
                    .lastname(user.getLastname())
                    .avatarUrl(user.getAvatarUrl())
                    .message("Login successful")
                    .build();
        }
        throw new Exception("Invalid credentials");
    }

    public AuthResponse googleLogin(Map<String, String> credentials) throws Exception {
        User user = googleAuthStrategy.authenticate(credentials);
        String token = jwtUtils.generateToken(user.getEmail(), user.getRole());
        String firebaseToken = FirebaseAuth.getInstance().createCustomToken(user.getId());
        return AuthResponse.builder()
                    .success(true)
                    .accessToken(token)
                    .role(user.getRole())
                    .email(user.getEmail())
                    .userId(user.getId())
                    .firebaseToken(firebaseToken)
                    .firstname(user.getFirstname())
                    .lastname(user.getLastname())
                    .avatarUrl(user.getAvatarUrl())
                    .message("Google login successful")
                    .build();
    }

    public AuthResponse register(Map<String, String> payload) throws Exception {
        String email = payload.get("email").toLowerCase().trim();
        var existingUser = db.collection("users").whereEqualTo("email", email).get().get();
        if (!existingUser.isEmpty()) {
            throw new Exception("Email is already registered");
        }

        User user = userFactory.createRegularUser(payload);
        user.setPasswordHash(encoder.encode(payload.get("password")));

        String id = db.collection("users").add(user).get().getId();
        user.setId(id);

        eventPublisher.publishEvent(new UserRegisteredEvent(this, user));

        return AuthResponse.builder()
                .success(true)
                .userId(id)
                .message("Registration successful")
                .build();
    }

    public AuthResponse registerStaff(Map<String, String> payload) throws Exception {
        String email = payload.get("email").toLowerCase().trim();
        var existingUser = db.collection("users").whereEqualTo("email", email).get().get();
        if (!existingUser.isEmpty()) {
            throw new Exception("Email is already registered");
        }

        User user = userFactory.createStaffUser(payload);
        user.setPasswordHash(encoder.encode(payload.get("password")));

        String id = db.collection("users").add(user).get().getId();
        user.setId(id);

        eventPublisher.publishEvent(new UserRegisteredEvent(this, user));

        return AuthResponse.builder()
                .success(true)
                .userId(id)
                .message("Staff registration successful")
                .build();
    }
}
