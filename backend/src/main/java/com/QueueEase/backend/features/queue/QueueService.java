package com.QueueEase.backend.features.queue;

import com.QueueEase.backend.features.auth.User;
import com.QueueEase.backend.features.queue.dto.JoinQueueRequest;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class QueueService {

    private final Firestore db;

    public QueueService(Firestore db) {
        this.db = db;
    }

    public Map<String, Object> joinQueue(String centerId, JoinQueueRequest request, String userEmail) throws Exception {
        // 1. Fetch user to get ID and Name
        Query userQuery = db.collection("users").whereEqualTo("email", userEmail);
        List<QueryDocumentSnapshot> users = userQuery.get().get().getDocuments();
        if (users.isEmpty()) {
            throw new Exception("User not found");
        }
        DocumentSnapshot userDoc = users.get(0);
        String userId = userDoc.getId();
        String firstname = userDoc.getString("firstname");
        String lastname = userDoc.getString("lastname");
        String userName = (firstname != null ? firstname : "") + " " + (lastname != null ? lastname : "");

        // 2. Check if user is already in a queue (WAITING or SERVING)
        Query activeQueueQuery = db.collection("queue_entries")
                .whereEqualTo("userEmail", userEmail)
                .whereIn("status", List.of("WAITING", "SERVING"));
        if (!activeQueueQuery.get().get().isEmpty()) {
            throw new Exception("You are already in a queue. Please leave your current queue first.");
        }

        // 3. Get next queue number for today
        int nextQueueNumber = getNextQueueNumber(centerId);

        // 4. Save to queue_entries
        Map<String, Object> queueEntry = new HashMap<>();
        queueEntry.put("serviceCenterId", centerId);
        queueEntry.put("serviceCenterName", request.getServiceCenterName() != null ? request.getServiceCenterName() : "Unknown Center");
        queueEntry.put("userId", userId);
        queueEntry.put("userEmail", userEmail);
        queueEntry.put("userName", userName.trim());
        queueEntry.put("status", "WAITING");
        queueEntry.put("queueNumber", nextQueueNumber);
        queueEntry.put("joinedAt", Instant.now().toString());
        
        if (request.getNotes() != null) queueEntry.put("notes", request.getNotes());
        if (request.getAttachmentUrl() != null) queueEntry.put("attachmentUrl", request.getAttachmentUrl());

        ApiFuture<DocumentReference> result = db.collection("queue_entries").add(queueEntry);
        String queueId = result.get().getId();

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("queueId", queueId);
        responseData.put("position", nextQueueNumber); // Actually, position in UI is computed by sorting active entries, but we return queueNumber as position for simplicity based on contract.
        responseData.put("estimatedWait", "N/A"); // COULD HAVE feature, returning default

        return responseData;
    }

    private int getNextQueueNumber(String centerId) throws ExecutionException, InterruptedException {
        Query q = db.collection("queue_entries")
                .whereEqualTo("serviceCenterId", centerId);
        
        List<QueryDocumentSnapshot> snapshots = q.get().get().getDocuments();
        
        // Filter today's entries
        ZonedDateTime todayStart = ZonedDateTime.now(ZoneId.systemDefault()).toLocalDate().atStartOfDay(ZoneId.systemDefault());
        
        long todayCount = snapshots.stream().filter(doc -> {
            String joinedAtStr = doc.getString("joinedAt");
            if (joinedAtStr == null) return false;
            try {
                ZonedDateTime joinedAt = Instant.parse(joinedAtStr).atZone(ZoneId.systemDefault());
                return !joinedAt.isBefore(todayStart);
            } catch (Exception e) {
                return false;
            }
        }).count();
        
        return (int) todayCount + 1;
    }
}
