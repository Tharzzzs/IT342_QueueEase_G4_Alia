package com.QueueEase.backend.features.servicecenter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateServiceCenterRequest {
    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Address is required")
    private String address;

    private String operatingHours;

    @NotNull(message = "Max capacity is required")
    private Integer maxCapacity;

    private Boolean isActive;

    private String createdBy;
    private String assignedStaffEmail;
    private String assignedStaffName;
}
