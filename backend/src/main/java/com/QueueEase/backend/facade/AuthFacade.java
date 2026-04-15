package com.QueueEase.backend.facade;

import com.QueueEase.backend.dto.AuthResponse;
import com.QueueEase.backend.strategy.StandardAuthStrategy;
import com.QueueEase.backend.strategy.GoogleAuthStrategy;
import com.QueueEase.backend.factory.UserFactory;
import com.QueueEase.backend.model.User;
import com.QueueEase.backend.config.JwtUtils;
import com.google.cloud.firestore.Firestore;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import com.QueueEase.backend.event.UserRegisteredEvent;

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
                    .message("Google login successful")
                    .build();
    }

    public AuthResponse register(Map<String, String> payload) throws Exception {
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
