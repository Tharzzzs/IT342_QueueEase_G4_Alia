package edu.alia.queueease.network.models

data class AuthResponse(
    val success: Boolean,
    val message: String?,
    val accessToken: String?,
    val userId: String?,
    val role: String?
)
