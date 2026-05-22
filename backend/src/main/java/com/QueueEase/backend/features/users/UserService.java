package com.QueueEase.backend.features.users;

import com.QueueEase.backend.features.users.dto.UpdateProfileRequest;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {

    private final Firestore db;

    public UserService(Firestore db) {
        this.db = db;
    }

    public void updateProfile(String email, UpdateProfileRequest request) throws Exception {
        var existingUser = db.collection("users").whereEqualTo("email", email).get().get();
        if (existingUser.isEmpty()) {
            throw new Exception("User not found");
        }
        String docId = existingUser.getDocuments().get(0).getId();
        DocumentReference docRef = db.collection("users").document(docId);
        
        Map<String, Object> updates = new HashMap<>();
        if (request.getFirstname() != null) updates.put("firstname", request.getFirstname());
        if (request.getLastname() != null) updates.put("lastname", request.getLastname());
        if (request.getAvatarUrl() != null) updates.put("avatar_url", request.getAvatarUrl());

        if (!updates.isEmpty()) {
            ApiFuture<WriteResult> result = docRef.update(updates);
            result.get(); // block until complete
        }
    }
}
