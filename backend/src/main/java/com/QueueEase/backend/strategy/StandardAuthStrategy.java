package com.QueueEase.backend.strategy;

import com.QueueEase.backend.model.User;
import com.google.cloud.firestore.Firestore;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class StandardAuthStrategy implements AuthenticationStrategy {
    private final Firestore db;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public StandardAuthStrategy(Firestore db) {
        this.db = db;
    }

    @Override
    public User authenticate(Map<String, String> credentials) throws Exception {
        String email = credentials.get("email");
        String password = credentials.get("password");

        var query = db.collection("users")
                .whereEqualTo("email", email.toLowerCase().trim())
                .get().get();

        if (query.isEmpty()) return null;

        var doc = query.getDocuments().get(0);
        User user = doc.toObject(User.class);
        user.setId(doc.getId());

        if (user.getPasswordHash() != null && encoder.matches(password, user.getPasswordHash())) {
            return user;
        }
        return null;
    }
}
