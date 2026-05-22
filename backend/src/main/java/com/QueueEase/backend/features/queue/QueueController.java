package com.QueueEase.backend.features.queue;

import com.QueueEase.backend.features.queue.dto.JoinQueueRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/queues")
public class QueueController {

    private final QueueService queueService;

    public QueueController(QueueService queueService) {
        this.queueService = queueService;
    }

    @PostMapping("/join/{centerId}")
    public ResponseEntity<Map<String, Object>> joinQueue(
            @PathVariable String centerId,
            @RequestBody JoinQueueRequest request,
            Authentication authentication) throws Exception {

        String userEmail = authentication.getName();
        Map<String, Object> data = queueService.joinQueue(centerId, request, userEmail);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        response.put("timestamp", Instant.now().toString());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
