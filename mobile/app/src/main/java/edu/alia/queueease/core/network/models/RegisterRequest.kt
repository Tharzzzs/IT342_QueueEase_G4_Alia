package edu.alia.queueease.core.network.models

import edu.alia.queueease.R

data class RegisterRequest(
    val firstname: String,
    val lastname: String,
    val email: String,
    val password: String
)
