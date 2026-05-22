package edu.alia.queueease.features.customer

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import edu.alia.queueease.core.data.SessionManager
import edu.alia.queueease.core.models.QueueEntry
import edu.alia.queueease.core.repository.QueueRepository

class QueueHistoryViewModel : ViewModel() {

    private val _history = MutableLiveData<List<QueueEntry>>()
    val history: LiveData<List<QueueEntry>> = _history

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    init {
        loadHistory()
    }

    fun loadHistory() {
        val email = SessionManager.email ?: return
        _isLoading.value = true
        QueueRepository.getUserQueueHistory(email) { entries ->
            _history.value = entries
            _isLoading.value = false
        }
    }
}
