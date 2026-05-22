package edu.alia.queueease

import android.app.Application
import edu.alia.queueease.core.data.SessionManager

class QueueEaseApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize SessionManager so prefs is ready for all OkHttp interceptors and DataStores
        SessionManager.init(this)
    }
}
