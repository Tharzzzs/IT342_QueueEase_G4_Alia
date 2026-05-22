package edu.alia.queueease.features.staff

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.google.firebase.firestore.ListenerRegistration
import edu.alia.queueease.core.data.SessionManager
import edu.alia.queueease.core.models.ServiceCenter
import edu.alia.queueease.core.repository.QueueRepository
import edu.alia.queueease.core.repository.ServiceCenterRepository

class StaffDashboardViewModel : ViewModel() {

    private val _assignedCenter = MutableLiveData<ServiceCenter?>()
    val assignedCenter: LiveData<ServiceCenter?> = _assignedCenter

    private val _waitingCount = MutableLiveData<Int>(0)
    val waitingCount: LiveData<Int> = _waitingCount

    private val _todayServedCount = MutableLiveData<Int>(0)
    val todayServedCount: LiveData<Int> = _todayServedCount

    private var centerUnsub: ListenerRegistration? = null

    init {
        loadData()
    }

    private fun loadData() {
        val email = SessionManager.email ?: return

        centerUnsub = ServiceCenterRepository.subscribeToStaffCenter(email) { center ->
            _assignedCenter.value = center
            if (center != null) {
                // Fetch stats for this center
                QueueRepository.getWaitingCount(center.id) { count ->
                    _waitingCount.value = count
                }
                QueueRepository.getCenterQueueHistory(center.id) { entries ->
                    val servedToday = entries.count { it.status == "COMPLETED" }
                    _todayServedCount.value = servedToday
                }
            } else {
                _waitingCount.value = 0
                _todayServedCount.value = 0
            }
        }
    }

    fun toggleCenterStatus(isActive: Boolean) {
        val centerId = _assignedCenter.value?.id ?: return
        ServiceCenterRepository.updateServiceCenter(centerId, mapOf("isActive" to isActive),
            onSuccess = {},
            onFailure = {}
        )
    }

    override fun onCleared() {
        super.onCleared()
        centerUnsub?.remove()
    }
}
