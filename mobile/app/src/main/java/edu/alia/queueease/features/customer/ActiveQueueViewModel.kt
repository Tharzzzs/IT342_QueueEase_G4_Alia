package edu.alia.queueease.features.customer

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import edu.alia.queueease.core.data.SessionManager
import edu.alia.queueease.core.models.QueueEntry
import edu.alia.queueease.core.repository.QueueRepository

class ActiveQueueViewModel : ViewModel() {

    private val _activeEntry = MutableLiveData<QueueEntry?>()
    val activeEntry: LiveData<QueueEntry?> = _activeEntry

    private val _position = MutableLiveData<Int>()
    val position: LiveData<Int> = _position

    private val _totalActive = MutableLiveData<Int>()
    val totalActive: LiveData<Int> = _totalActive

    private val _currentlyServing = MutableLiveData<List<QueueEntry>>()
    val currentlyServing: LiveData<List<QueueEntry>> = _currentlyServing

    private val _leaveStatus = MutableLiveData<LeaveStatus>()
    val leaveStatus: LiveData<LeaveStatus> = _leaveStatus

    private var unsub: (() -> Unit)? = null

    init {
        subscribeToQueue()
    }

    private fun subscribeToQueue() {
        val userEmail = SessionManager.email ?: return
        unsub = QueueRepository.subscribeToUserQueueWithPosition(userEmail) { entry, pos, total, serving ->
            _activeEntry.value = entry
            _position.value = pos
            _totalActive.value = total
            _currentlyServing.value = serving
        }
    }

    fun leaveQueue(entryId: String) {
        _leaveStatus.value = LeaveStatus.Loading
        QueueRepository.leaveQueue(entryId,
            onSuccess = {
                _leaveStatus.value = LeaveStatus.Success
            },
            onFailure = {
                _leaveStatus.value = LeaveStatus.Error(it)
            }
        )
    }

    override fun onCleared() {
        super.onCleared()
        unsub?.invoke()
    }

    sealed class LeaveStatus {
        object Idle : LeaveStatus()
        object Loading : LeaveStatus()
        object Success : LeaveStatus()
        data class Error(val message: String) : LeaveStatus()
    }
}
