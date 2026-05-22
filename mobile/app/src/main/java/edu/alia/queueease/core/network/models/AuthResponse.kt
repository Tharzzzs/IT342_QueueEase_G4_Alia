package edu.alia.queueease.core.network.models

data class AuthResponse(
    val success: Boolean,
    val message: String?,
    val accessToken: String?,
    val userId: String?,
    val role: String?,
    val firebaseToken: String?,
    val email: String?,
    val firstname: String?,
    val lastname: String?
)
