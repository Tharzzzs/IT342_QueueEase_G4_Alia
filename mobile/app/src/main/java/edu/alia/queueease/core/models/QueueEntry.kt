package edu.alia.queueease.core.models

data class QueueEntry(
    val id: String = "",
    val serviceCenterId: String = "",
    val serviceCenterName: String = "",
    val userId: String = "",
    val userEmail: String = "",
    val userName: String = "",
    val status: String = "WAITING",
    val queueNumber: Int = 0,
    val joinedAt: String? = null,
    val servedAt: String? = null,
    val completedAt: String? = null
)
