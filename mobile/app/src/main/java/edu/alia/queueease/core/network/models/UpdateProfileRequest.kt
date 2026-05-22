package edu.alia.queueease.core.network.models

data class UpdateProfileRequest(
    val firstname: String? = null,
    val lastname: String? = null,
    val avatarUrl: String? = null
)
