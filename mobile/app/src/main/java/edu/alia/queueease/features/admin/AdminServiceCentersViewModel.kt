package edu.alia.queueease.features.admin

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.google.firebase.firestore.ListenerRegistration
import edu.alia.queueease.core.models.ServiceCenter
import edu.alia.queueease.core.repository.ServiceCenterRepository

class AdminServiceCentersViewModel : ViewModel() {

    private val _centers = MutableLiveData<List<ServiceCenter>>()
    val centers: LiveData<List<ServiceCenter>> = _centers

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val _error = MutableLiveData<String>()
    val error: LiveData<String> = _error

    private var unsub: ListenerRegistration? = null

    init {
        _isLoading.value = true
        unsub = ServiceCenterRepository.subscribeToServiceCenters { list ->
            _centers.value = list
            _isLoading.value = false
        }
    }

    override fun onCleared() {
        super.onCleared()
        unsub?.remove()
    }
}
