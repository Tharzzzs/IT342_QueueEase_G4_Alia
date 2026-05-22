package edu.alia.queueease.core.network.models

data class StaffRegisterRequest(
    val firstname: String,
    val lastname: String,
    val email: String,
    val password: String
)
