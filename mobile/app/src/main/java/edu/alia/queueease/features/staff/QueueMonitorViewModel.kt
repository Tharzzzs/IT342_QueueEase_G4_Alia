package edu.alia.queueease.features.staff

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.google.firebase.firestore.ListenerRegistration
import edu.alia.queueease.core.data.SessionManager
import edu.alia.queueease.core.models.QueueEntry
import edu.alia.queueease.core.repository.QueueRepository
import edu.alia.queueease.core.repository.ServiceCenterRepository

class QueueMonitorViewModel : ViewModel() {

    private val _queue = MutableLiveData<List<QueueEntry>>()
    val queue: LiveData<List<QueueEntry>> = _queue

    private val _currentServing = MutableLiveData<QueueEntry?>()
    val currentServing: LiveData<QueueEntry?> = _currentServing

    private val _actionStatus = MutableLiveData<ActionStatus>()
    val actionStatus: LiveData<ActionStatus> = _actionStatus

    private var centerId: String? = null
    private var queueUnsub: ListenerRegistration? = null

    init {
        loadAssignedCenter()
    }

    private fun loadAssignedCenter() {
        val email = SessionManager.email ?: return
        ServiceCenterRepository.getStaffAssignedCenter(email) { center ->
            if (center != null) {
                centerId = center.id
                subscribeToQueue()
            }
        }
    }

    private fun subscribeToQueue() {
        val id = centerId ?: return
        queueUnsub = QueueRepository.subscribeToQueue(id) { entries, _ ->
            // Update queue list, filtering out CANCELLED
            // Sort so COMPLETED is at bottom, and newest joinedAt is at top
            val sortedEntries = entries
                .filter { it.status != "CANCELLED" }
                .sortedWith(Comparator { a, b ->
                    val aDone = a.status == "COMPLETED" || a.status == "MISSED"
                    val bDone = b.status == "COMPLETED" || b.status == "MISSED"
                    if (aDone && !bDone) 1
                    else if (!aDone && bDone) -1
                    else {
                        val aTime = a.joinedAt ?: ""
                        val bTime = b.joinedAt ?: ""
                        bTime.compareTo(aTime) // Descending order
                    }
                })
                
            _queue.value = sortedEntries
            
            // Find current serving
            val serving = entries.find { it.status == "SERVING" }
            _currentServing.value = serving
        }
    }

    fun callNext() {
        val id = centerId ?: return
        _actionStatus.value = ActionStatus.Loading
        QueueRepository.callNext(id,
            onSuccess = { entry ->
                if (entry != null) {
                    _actionStatus.value = ActionStatus.Success("Called #${entry.queueNumber}")
                } else {
                    _actionStatus.value = ActionStatus.Success("No waiting customers")
                }
            },
            onFailure = {
                _actionStatus.value = ActionStatus.Error(it)
            }
        )
    }

    fun markServed() {
        val servingId = _currentServing.value?.id ?: return
        _actionStatus.value = ActionStatus.Loading
        QueueRepository.markServed(servingId,
            onSuccess = {
                _actionStatus.value = ActionStatus.Success("Marked as served")
            },
            onFailure = {
                _actionStatus.value = ActionStatus.Error(it)
            }
        )
    }

    fun markMissed() {
        val servingId = _currentServing.value?.id ?: return
        _actionStatus.value = ActionStatus.Loading
        QueueRepository.markMissed(servingId,
            onSuccess = {
                _actionStatus.value = ActionStatus.Success("Marked as No Show")
            },
            onFailure = {
                _actionStatus.value = ActionStatus.Error(it)
            }
        )
    }

    override fun onCleared() {
        super.onCleared()
        queueUnsub?.remove()
    }

    sealed class ActionStatus {
        object Idle : ActionStatus()
        object Loading : ActionStatus()
        data class Success(val message: String) : ActionStatus()
        data class Error(val message: String) : ActionStatus()
    }

    fun resetStatus() {
        _actionStatus.value = ActionStatus.Idle
    }
}
