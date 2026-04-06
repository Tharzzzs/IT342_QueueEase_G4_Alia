package com.QueueEase.backend.adapter;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class GoogleTokenAdapter implements ExternalTokenVerifier {
    private static final String CLIENT_ID = "770395482652-o453hvr1sqlgfaqvedl5vj07tfkehf6f.apps.googleusercontent.com";

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
