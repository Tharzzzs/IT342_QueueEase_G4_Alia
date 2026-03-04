package com.QueueEase.backend.controller;

import com.QueueEase.backend.model.User;
import com.QueueEase.backend.service.AuthService;
import com.QueueEase.backend.config.JwtUtils;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;
    private final JwtUtils jwtUtils;

    public AuthController(AuthService authService, JwtUtils jwtUtils) {
        this.authService = authService;
        this.jwtUtils = jwtUtils;
    }

    // NEW: Handle user registration
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        try {
            // Map the frontend fields to your User model
            User user = User.builder()
                    .firstname(payload.get("firstname"))
                    .lastname(payload.get("lastname"))
                    .email(payload.get("email"))
                    .build();

            // The service handles hashing and adding to Firestore
            String userId = authService.registerUser(user, payload.get("password"), "USER");

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "userId", userId,
                    "message", "Registration successful"
            ));
        } catch (Exception e) {
            // SDD Error: Log the specific error (e.g., Duplicate Email DB-002)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> creds) {
        try {
            User user = authService.authenticate(creds.get("email"), creds.get("password"));
            if (user != null) {
                // Generates token with the role from Firestore
                String token = jwtUtils.generateToken(user.getEmail(), user.getRole());
                return ResponseEntity.ok(Map.of(
                        "accessToken", token,
                        "role", user.getRole(),
                        "email", user.getEmail()
                ));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid credentials"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "SYSTEM-001: Internal Error"));
        }
    }
}