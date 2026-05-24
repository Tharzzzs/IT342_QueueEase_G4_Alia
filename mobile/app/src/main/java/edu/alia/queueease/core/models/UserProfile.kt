package edu.alia.queueease.core.models

data class UserProfile(
    val id: String,
    val email: String,
    val firstname: String,
    val lastname: String,
    val avatarUrl: String?,
    val role: String
)
