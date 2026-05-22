package edu.alia.queueease.features.customer

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.google.firebase.firestore.ListenerRegistration
import edu.alia.queueease.core.data.SessionManager
import edu.alia.queueease.core.models.ServiceCenter
import edu.alia.queueease.core.repository.QueueRepository
import edu.alia.queueease.core.repository.ServiceCenterRepository

class CustomerHomeViewModel : ViewModel() {

    private val _centers = MutableLiveData<List<ServiceCenterItem>>()
    val centers: LiveData<List<ServiceCenterItem>> = _centers

    private val _error = MutableLiveData<String>()
    val error: LiveData<String> = _error

    private val _joinStatus = MutableLiveData<JoinStatus>()
    val joinStatus: LiveData<JoinStatus> = _joinStatus

    private var centersUnsub: ListenerRegistration? = null
    private var favsUnsub: ListenerRegistration? = null

    private var currentCenters = listOf<ServiceCenter>()
    private var currentFavorites = listOf<String>()
    private var currentWaitingCounts = mutableMapOf<String, Int>()

    init {
        val userEmail = SessionManager.email ?: ""
        if (userEmail.isNotEmpty()) {
            subscribeToData(userEmail)
        }
    }

    private fun subscribeToData(userEmail: String) {
        centersUnsub = ServiceCenterRepository.subscribeToServiceCenters { list ->
            currentCenters = list
            fetchWaitingCountsAndCombine()
        }

        favsUnsub = ServiceCenterRepository.subscribeToFavorites(userEmail) { favs ->
            currentFavorites = favs
            combineData()
        }
    }

    private fun fetchWaitingCountsAndCombine() {
        if (currentCenters.isEmpty()) {
            combineData()
            return
        }
        var fetched = 0
        currentCenters.forEach { center ->
            QueueRepository.getWaitingCount(center.id) { count ->
                currentWaitingCounts[center.id] = count
                fetched++
                if (fetched == currentCenters.size) {
                    combineData()
                }
            }
        }
    }

    private fun combineData() {
        val items = currentCenters.map { center ->
            ServiceCenterItem(
                center = center,
                isFavorite = currentFavorites.contains(center.id),
                waitingCount = currentWaitingCounts[center.id] ?: 0
            )
        }
        _centers.value = items
    }

    fun toggleFavorite(centerId: String, isFavorite: Boolean) {
        val userEmail = SessionManager.email ?: return
        ServiceCenterRepository.toggleFavorite(userEmail, centerId, !isFavorite,
            onSuccess = { /* Snapshot listener handles update */ },
            onFailure = { _error.value = it }
        )
    }

    fun joinQueue(center: ServiceCenter) {
        val userId = SessionManager.userId ?: return
        val userEmail = SessionManager.email ?: return
        val userName = SessionManager.userName ?: return

        _joinStatus.value = JoinStatus.Loading
        QueueRepository.joinQueue(
            serviceCenterId = center.id,
            serviceCenterName = center.name,
            userId = userId,
            userEmail = userEmail,
            userName = userName,
            onSuccess = { _, _ ->
                _joinStatus.value = JoinStatus.Success
            },
            onFailure = {
                _joinStatus.value = JoinStatus.Error(it)
            }
        )
    }

    override fun onCleared() {
        super.onCleared()
        centersUnsub?.remove()
        favsUnsub?.remove()
    }

    sealed class JoinStatus {
        object Idle : JoinStatus()
        object Loading : JoinStatus()
        object Success : JoinStatus()
        data class Error(val message: String) : JoinStatus()
    }
}
