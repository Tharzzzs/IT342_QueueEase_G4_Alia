package com.QueueEase.backend.adapter;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;

public interface ExternalTokenVerifier {
    GoogleIdToken.Payload verifyToken(String tokenString) throws Exception;
}
