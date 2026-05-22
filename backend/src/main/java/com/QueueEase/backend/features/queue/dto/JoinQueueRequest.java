package com.QueueEase.backend.features.queue.dto;

import lombok.Data;

@Data
public class JoinQueueRequest {
    private String serviceCenterName; // Can be fetched from DB or passed by frontend
    private String notes;
    private String attachmentUrl;
}
