package edu.alia.queueease.network.models

data class RegisterRequest(
    val firstname: String,
    val lastname: String,
    val email: String,
    val password: String
)
