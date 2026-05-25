package com.QueueEase.backend.core.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class GoogleTokenAdapter implements ExternalTokenVerifier {
    private static final java.util.List<String> CLIENT_IDS = java.util.Arrays.asList(
        "770395482652-o453hvr1sqlgfaqvedl5vj07tfkehf6f.apps.googleusercontent.com", // Web
        "623398128884-sf3jpkoq155roh7d6br8nd3f61p8gi0i.apps.googleusercontent.com", // Mobile aud
        "623398128884-ah61tdvieomehgvmldnidarfuoaedv.apps.googleusercontent.com"  // Mobile azp
    );

    @Override
    public GoogleIdToken.Payload verifyToken(String tokenString) throws Exception {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(CLIENT_IDS)
                .build();

        GoogleIdToken idToken = verifier.verify(tokenString);
        if (idToken == null) throw new Exception("Invalid ID Token");

        return idToken.getPayload();
    }
}
