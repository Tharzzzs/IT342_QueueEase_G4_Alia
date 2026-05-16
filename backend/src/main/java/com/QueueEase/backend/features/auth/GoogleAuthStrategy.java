package com.QueueEase.backend.features.auth;

import com.QueueEase.backend.features.auth.User;
import com.QueueEase.backend.core.security.ExternalTokenVerifier;
import com.QueueEase.backend.features.auth.UserFactory;
import com.google.cloud.firestore.Firestore;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import org.springframework.stereotype.Component;
import org.springframework.context.ApplicationEventPublisher;
import com.QueueEase.backend.features.auth.UserRegisteredEvent;
import java.util.Map;

@Component
public class GoogleAuthStrategy implements AuthenticationStrategy {
    private final Firestore db;
    private final ExternalTokenVerifier tokenAdapter;
    private final UserFactory userFactory;
    private final ApplicationEventPublisher eventPublisher;

    public GoogleAuthStrategy(Firestore db, ExternalTokenVerifier tokenAdapter, UserFactory userFactory, ApplicationEventPublisher eventPublisher) {
        this.db = db;
        this.tokenAdapter = tokenAdapter;
        this.userFactory = userFactory;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public User authenticate(Map<String, String> credentials) throws Exception {
        String tokenString = credentials.get("token");
        GoogleIdToken.Payload payload = tokenAdapter.verifyToken(tokenString);

        String email = payload.getEmail().toLowerCase().trim();

        var query = db.collection("users").whereEqualTo("email", email).get().get();

        if (!query.isEmpty()) {
            var doc = query.getDocuments().get(0);
            User user = doc.toObject(User.class);
            user.setId(doc.getId());
            return user;
        } else {
            User newUser = userFactory.createGoogleUser(email, (String) payload.get("given_name"), (String) payload.get("family_name"));
            var docRef = db.collection("users").add(newUser).get();
            newUser.setId(docRef.getId());

            // Observer pattern: publish event
            eventPublisher.publishEvent(new UserRegisteredEvent(this, newUser));
            return newUser;
        }
    }
}
