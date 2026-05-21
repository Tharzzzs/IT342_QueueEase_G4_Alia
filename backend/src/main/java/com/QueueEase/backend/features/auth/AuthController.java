package com.QueueEase.backend.features.auth;

import com.QueueEase.backend.features.auth.AuthResponse;
import com.QueueEase.backend.features.auth.AuthFacade;
import com.QueueEase.backend.features.auth.dto.RegisterRequest;
import com.QueueEase.backend.features.auth.dto.LoginRequest;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthFacade authFacade;

    public AuthController(AuthFacade authFacade) {
        this.authFacade = authFacade;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) throws Exception {
        Map<String, String> payload = new HashMap<>();
        payload.put("email", request.getEmail());
        payload.put("password", request.getPassword());
        payload.put("firstname", request.getFirstname());
        payload.put("lastname", request.getLastname());

        AuthResponse response = authFacade.register(payload);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/register/staff")
    public ResponseEntity<AuthResponse> registerStaff(@Valid @RequestBody RegisterRequest request) throws Exception {
        Map<String, String> payload = new HashMap<>();
        payload.put("email", request.getEmail());
        payload.put("password", request.getPassword());
        payload.put("firstname", request.getFirstname());
        payload.put("lastname", request.getLastname());

        AuthResponse response = authFacade.registerStaff(payload);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody Map<String, String> payload) throws Exception {
        AuthResponse response = authFacade.googleLogin(payload);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) throws Exception {
        Map<String, String> creds = new HashMap<>();
        creds.put("email", request.getEmail());
        creds.put("password", request.getPassword());

        AuthResponse response = authFacade.login(creds);
        return ResponseEntity.ok(response);
    }
}