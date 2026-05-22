package com.QueueEase.backend.features.servicecenter;

import com.QueueEase.backend.features.servicecenter.dto.CreateServiceCenterRequest;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class ServiceCenterService {

    private final Firestore db;

    public ServiceCenterService(Firestore db) {
        this.db = db;
    }

    public String createServiceCenter(CreateServiceCenterRequest request, String ownerEmail) throws Exception {
        Map<String, Object> data = new HashMap<>();
        data.put("name", request.getName());
        data.put("description", request.getDescription() != null ? request.getDescription() : "");
        data.put("category", request.getCategory());
        data.put("address", request.getAddress());
        data.put("operatingHours", request.getOperatingHours() != null ? request.getOperatingHours() : "");
        data.put("maxCapacity", request.getMaxCapacity());
        data.put("isActive", request.getIsActive() != null ? request.getIsActive() : true);
        data.put("createdBy", ownerEmail);
        data.put("assignedStaffEmail", request.getAssignedStaffEmail() != null ? request.getAssignedStaffEmail() : "");
        data.put("assignedStaffName", request.getAssignedStaffName() != null ? request.getAssignedStaffName() : "");
        data.put("brandLogoUrl", request.getBrandLogoUrl() != null ? request.getBrandLogoUrl() : "");
        data.put("createdAt", Instant.now().toString());
        data.put("ownerEmail", ownerEmail); // explicitly tag the owner

        ApiFuture<DocumentReference> result = db.collection("service_centers").add(data);
        return result.get().getId();
    }
}
