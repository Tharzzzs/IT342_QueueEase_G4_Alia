package edu.alia.queueease.core.network

import edu.alia.queueease.core.network.models.AuthResponse
import edu.alia.queueease.core.network.models.LoginRequest
import edu.alia.queueease.core.network.models.RegisterRequest
import edu.alia.queueease.core.network.models.StaffRegisterRequest
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {
    @POST("api/v1/auth/login")
    fun login(@Body request: LoginRequest): Call<AuthResponse>

    @POST("api/v1/auth/register")
    fun register(@Body request: RegisterRequest): Call<AuthResponse>

    @POST("api/v1/auth/register/staff")
    fun registerStaff(@Body request: StaffRegisterRequest): Call<AuthResponse>

    @retrofit2.http.PUT("api/v1/users/profile")
    fun updateProfile(@Body request: edu.alia.queueease.core.network.models.UpdateProfileRequest): Call<Map<String, Any>>

    @retrofit2.http.Multipart
    @POST("api/v1/files/upload")
    fun uploadFile(
        @retrofit2.http.Part file: okhttp3.MultipartBody.Part,
        @retrofit2.http.Part("folder") folder: okhttp3.RequestBody
    ): Call<Map<String, String>>
}
