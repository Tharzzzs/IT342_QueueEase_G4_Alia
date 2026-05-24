package edu.alia.queueease.features.auth

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.google.firebase.auth.FirebaseAuth
import edu.alia.queueease.core.data.SessionManager
import edu.alia.queueease.core.network.ApiClient
import edu.alia.queueease.core.network.models.AuthResponse
import edu.alia.queueease.core.network.models.LoginRequest
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class LoginViewModel : ViewModel() {

    private val _loginState = MutableLiveData<LoginState>()
    val loginState: LiveData<LoginState> = _loginState

    fun login(email: String, pass: String) {
        if (email.isBlank() || pass.isBlank()) {
            _loginState.value = LoginState.Error("Please fill in all fields")
            return
        }

        _loginState.value = LoginState.Loading
        ApiClient.apiService.login(LoginRequest(email, pass)).enqueue(object : Callback<AuthResponse> {
            override fun onResponse(call: Call<AuthResponse>, response: Response<AuthResponse>) {
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body?.success == true && body.accessToken != null) {
                        SessionManager.accessToken = body.accessToken
                        SessionManager.role = body.role
                        SessionManager.email = body.email
                        SessionManager.firebaseToken = body.firebaseToken
                        SessionManager.userId = body.userId
                        SessionManager.userName = "${body.firstname} ${body.lastname}".trim()
                        SessionManager.avatarUrl = body.avatarUrl
                        
                        // Sign in to Firebase Auth using custom token if available
                        body.firebaseToken?.let { token ->
                            FirebaseAuth.getInstance().signInWithCustomToken(token)
                        }
                        
                        _loginState.value = LoginState.Success(body.role ?: "USER")
                    } else {
                        _loginState.value = LoginState.Error(body?.message ?: "Invalid login credentials")
                    }
                } else {
                    _loginState.value = LoginState.Error("Login failed")
                }
            }

            override fun onFailure(call: Call<AuthResponse>, t: Throwable) {
                _loginState.value = LoginState.Error("Network error: ${t.message}")
            }
        })
    }

    sealed class LoginState {
        object Loading : LoginState()
        data class Success(val role: String) : LoginState()
        data class Error(val message: String) : LoginState()
    }
}
