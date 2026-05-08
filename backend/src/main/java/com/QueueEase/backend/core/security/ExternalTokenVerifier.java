package com.QueueEase.backend.core.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;

public interface ExternalTokenVerifier {
    GoogleIdToken.Payload verifyToken(String tokenString) throws Exception;
}
