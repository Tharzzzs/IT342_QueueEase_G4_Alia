package com.QueueEase.backend.controller;

import com.QueueEase.backend.model.User;
import com.QueueEase.backend.service.AuthService;
import com.QueueEase.backend.config.JwtUtils;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import com.google.cloud.firestore.Firestore;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;
    private final JwtUtils jwtUtils;
    private final Firestore db;

    public AuthController(AuthService authService, JwtUtils jwtUtils, Firestore db) {
        this.authService = authService;
        this.jwtUtils = jwtUtils;
        this.db = db;
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

    // NEW: Handle Staff Registration (Restricted to Admins)
    @PostMapping("/register/staff")
    public ResponseEntity<?> registerStaff(@RequestBody Map<String, String> payload) {
        try {
            // Map the frontend fields to your User model
            User staff = User.builder()
                    .firstname(payload.get("firstname"))
                    .lastname(payload.get("lastname"))
                    .email(payload.get("email").toLowerCase().trim())
                    .build();

            // The service handles hashing and forces the role to "STAFF"
            String staffId = authService.registerUser(staff, payload.get("password"), "STAFF");

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "staffId", staffId,
                    "message", "Staff registration successful"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> payload) {
        try {
            // 1. Get the raw JWT token string from the React frontend
            String idTokenString = payload.get("token");

            // 2. Delegate everything to the AuthService (Verification + DB check/create)
            User user = authService.processGoogleLogin(idTokenString);

            // 3. Generate your app's JWT based on the verified user
            String accessToken = jwtUtils.generateToken(user.getEmail(), user.getRole());

            return ResponseEntity.ok(Map.of(
                    "accessToken", accessToken,
                    "role", user.getRole(),
                    "email", user.getEmail()
            ));

        } catch (Exception e) {
            // Print stack trace to your IntelliJ console so you can see why it's failing
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Google Authentication Failed: " + e.getMessage()));
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