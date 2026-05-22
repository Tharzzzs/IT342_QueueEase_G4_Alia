package edu.alia.queueease.core.models

data class ServiceCenter(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val category: String = "",
    val address: String = "",
    val operatingHours: String = "",
    val maxCapacity: Int = 0,
    val isActive: Boolean = true,
    val createdBy: String = "",
    val createdAt: String? = null,
    val assignedStaffEmail: String? = null,
    val assignedStaffName: String? = null
)
