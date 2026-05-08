package edu.alia.queueease.core.network.models

import edu.alia.queueease.R

data class AuthResponse(
    val success: Boolean,
    val message: String?,
    val accessToken: String?,
    val userId: String?,
    val role: String?
)
