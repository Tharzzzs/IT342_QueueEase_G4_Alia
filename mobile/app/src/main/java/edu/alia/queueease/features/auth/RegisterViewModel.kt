package edu.alia.queueease.features.auth

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import edu.alia.queueease.core.network.ApiClient
import edu.alia.queueease.core.network.models.AuthResponse
import edu.alia.queueease.core.network.models.RegisterRequest
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class RegisterViewModel : ViewModel() {

    private val _registerState = MutableLiveData<RegisterState>()
    val registerState: LiveData<RegisterState> = _registerState

    fun register(firstName: String, lastName: String, email: String, pass: String) {
        if (firstName.isBlank() || lastName.isBlank() || email.isBlank() || pass.isBlank()) {
            _registerState.value = RegisterState.Error("Please fill in all fields")
            return
        }

        _registerState.value = RegisterState.Loading
        val request = RegisterRequest(firstName, lastName, email, pass)
        ApiClient.apiService.register(request).enqueue(object : Callback<AuthResponse> {
            override fun onResponse(call: Call<AuthResponse>, response: Response<AuthResponse>) {
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body?.success == true) {
                        _registerState.value = RegisterState.Success
                    } else {
                        _registerState.value = RegisterState.Error(body?.message ?: "Registration failed")
                    }
                } else {
                    _registerState.value = RegisterState.Error("Registration failed")
                }
            }

            override fun onFailure(call: Call<AuthResponse>, t: Throwable) {
                _registerState.value = RegisterState.Error("Network error: ${t.message}")
            }
        })
    }

    sealed class RegisterState {
        object Loading : RegisterState()
        object Success : RegisterState()
        data class Error(val message: String) : RegisterState()
    }
}
