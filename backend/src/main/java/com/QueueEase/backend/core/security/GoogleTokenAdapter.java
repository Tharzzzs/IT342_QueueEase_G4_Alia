package com.QueueEase.backend.core.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class GoogleTokenAdapter implements ExternalTokenVerifier {
    private static final String CLIENT_ID = "623398128884-sf3jpkoq155roh7d6br8nd3f61p8gi0i.apps.googleusercontent.com";


    @Override
    public GoogleIdToken.Payload verifyToken(String tokenString) throws Exception {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(CLIENT_ID))
                .build();

        GoogleIdToken idToken = verifier.verify(tokenString);
        if (idToken == null) throw new Exception("Invalid ID Token");

        return idToken.getPayload();
    }
}
