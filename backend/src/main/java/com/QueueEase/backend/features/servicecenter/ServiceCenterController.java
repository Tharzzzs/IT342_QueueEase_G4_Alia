package com.QueueEase.backend.features.servicecenter;

import com.QueueEase.backend.features.servicecenter.dto.CreateServiceCenterRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/service-centers")
public class ServiceCenterController {

    private final ServiceCenterService serviceCenterService;

    public ServiceCenterController(ServiceCenterService serviceCenterService) {
        this.serviceCenterService = serviceCenterService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createServiceCenter(
            @Valid @RequestBody CreateServiceCenterRequest request,
            Authentication authentication) throws Exception {
        
        String ownerEmail = authentication.getName();
        String centerId = serviceCenterService.createServiceCenter(request, ownerEmail);

        Map<String, Object> data = new HashMap<>();
        data.put("centerId", centerId);
        data.put("status", "ACTIVE");

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        response.put("timestamp", java.time.Instant.now().toString());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
