package edu.alia.queueease.features.admin

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import edu.alia.queueease.core.repository.QueueRepository
import edu.alia.queueease.core.repository.ServiceCenterRepository

class AdminDashboardViewModel : ViewModel() {

    private val _totalCenters = MutableLiveData<Int>(0)
    val totalCenters: LiveData<Int> = _totalCenters

    private val _activeCenters = MutableLiveData<Int>(0)
    val activeCenters: LiveData<Int> = _activeCenters

    private val _totalInQueue = MutableLiveData<Int>(0)
    val totalInQueue: LiveData<Int> = _totalInQueue

    private val _servedToday = MutableLiveData<Int>(0)
    val servedToday: LiveData<Int> = _servedToday

    init {
        loadStats()
    }

    fun loadStats() {
        ServiceCenterRepository.subscribeToServiceCenters { centers ->
            _totalCenters.value = centers.size
            _activeCenters.value = centers.count { it.isActive }
        }

        QueueRepository.getTotalInQueue { count ->
            _totalInQueue.value = count
        }

        QueueRepository.getServedTodayCount { count ->
            _servedToday.value = count
        }
    }
}
