package edu.alia.queueease.core.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.QuerySnapshot
import edu.alia.queueease.core.models.QueueEntry
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object QueueRepository {
    private const val COLLECTION = "queue_entries"
    private val db = FirebaseFirestore.getInstance()

    private fun nowIso(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date())
    }

    private fun parseIsoDate(iso: String?): Long {
        if (iso.isNullOrEmpty()) return 0L
        return try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                java.time.Instant.parse(iso).toEpochMilli()
            } else {
                val normalized = if (iso.contains(".")) {
                    val base = iso.substringBeforeLast(".")
                    val frac = iso.substringAfterLast(".").substringBefore("Z").padEnd(3, '0').take(3)
                    "$base.$frac" + "Z"
                } else {
                    iso.replace("Z", ".000Z")
                }
                val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
                sdf.timeZone = TimeZone.getTimeZone("UTC")
                sdf.parse(normalized)?.time ?: 0L
            }
        } catch (e: Exception) {
            0L
        }
    }

    fun computeDisplayPositions(entries: List<QueueEntry>): Map<String, Int> {
        val positionMap = mutableMapOf<String, Int>()
        val activeEntries = entries
            .filter { it.status == "WAITING" || it.status == "SERVING" }
            .sortedBy { parseIsoDate(it.joinedAt) }
        activeEntries.forEachIndexed { index, entry ->
            if (entry.id.isNotEmpty()) {
                positionMap[entry.id] = index + 1
            }
        }
        return positionMap
    }

    fun joinQueue(
        serviceCenterId: String,
        serviceCenterName: String,
        userId: String,
        userEmail: String,
        userName: String,
        onSuccess: (entryId: String, queueNumber: Int) -> Unit,
        onFailure: (String) -> Unit
    ) {
        // Check if user already has active queue entry
        getUserActiveQueue(userEmail,
            onResult = { existing ->
                if (existing != null) {
                    onFailure("You are already in a queue. Please leave your current queue first.")
                    return@getUserActiveQueue
                }
                // Get next queue number
                getNextQueueNumber(serviceCenterId) { queueNumber ->
                    val entry = hashMapOf(
                        "serviceCenterId" to serviceCenterId,
                        "serviceCenterName" to serviceCenterName,
                        "userId" to userId,
                        "userEmail" to userEmail,
                        "userName" to userName,
                        "status" to "WAITING",
                        "queueNumber" to queueNumber,
                        "joinedAt" to nowIso()
                    )
                    db.collection(COLLECTION).add(entry)
                        .addOnSuccessListener { docRef ->
                            onSuccess(docRef.id, queueNumber)
                        }
                        .addOnFailureListener { e ->
                            onFailure(e.message ?: "Failed to join queue")
                        }
                }
            },
            onError = { onFailure(it) }
        )
    }

    private fun getNextQueueNumber(serviceCenterId: String, callback: (Int) -> Unit) {
        db.collection(COLLECTION)
            .whereEqualTo("serviceCenterId", serviceCenterId)
            .get()
            .addOnSuccessListener { snapshot ->
                val today = todayStart()
                val todayEntries = snapshot.documents.filter { doc ->
                    val joinedAt = doc.getString("joinedAt") ?: return@filter false
                    parseIsoDate(joinedAt) >= today
                }
                callback(todayEntries.size + 1)
            }
            .addOnFailureListener {
                callback((100..999).random())
            }
    }

    private fun todayStart(): Long {
        val cal = java.util.Calendar.getInstance()
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
        cal.set(java.util.Calendar.MINUTE, 0)
        cal.set(java.util.Calendar.SECOND, 0)
        cal.set(java.util.Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    fun leaveQueue(entryId: String, onSuccess: () -> Unit, onFailure: (String) -> Unit) {
        db.collection(COLLECTION).document(entryId)
            .update(
                mapOf(
                    "status" to "CANCELLED",
                    "completedAt" to nowIso()
                )
            )
            .addOnSuccessListener { onSuccess() }
            .addOnFailureListener { onFailure(it.message ?: "Failed to leave queue") }
    }

    fun callNext(
        serviceCenterId: String,
        onSuccess: (QueueEntry?) -> Unit,
        onFailure: (String) -> Unit
    ) {
        db.collection(COLLECTION)
            .whereEqualTo("serviceCenterId", serviceCenterId)
            .whereEqualTo("status", "WAITING")
            .get()
            .addOnSuccessListener { snapshot ->
                if (snapshot.isEmpty) {
                    onSuccess(null)
                    return@addOnSuccessListener
                }
                val sorted = snapshot.documents
                    .map { doc ->
                        QueueEntry(
                            id = doc.id,
                            serviceCenterId = doc.getString("serviceCenterId") ?: "",
                            serviceCenterName = doc.getString("serviceCenterName") ?: "",
                            userId = doc.getString("userId") ?: "",
                            userEmail = doc.getString("userEmail") ?: "",
                            userName = doc.getString("userName") ?: "",
                            status = doc.getString("status") ?: "",
                            queueNumber = (doc.getLong("queueNumber") ?: 0).toInt(),
                            joinedAt = doc.getString("joinedAt"),
                            servedAt = doc.getString("servedAt"),
                            completedAt = doc.getString("completedAt")
                        )
                    }
                    .sortedBy { parseIsoDate(it.joinedAt) }
                val next = sorted.first()
                db.collection(COLLECTION).document(next.id)
                    .update(
                        mapOf(
                            "status" to "SERVING",
                            "servedAt" to nowIso()
                        )
                    )
                    .addOnSuccessListener { onSuccess(next) }
                    .addOnFailureListener { onFailure(it.message ?: "Failed to call next") }
            }
            .addOnFailureListener { onFailure(it.message ?: "Failed to call next") }
    }

    fun markServed(entryId: String, onSuccess: () -> Unit, onFailure: (String) -> Unit) {
        db.collection(COLLECTION).document(entryId)
            .update(
                mapOf(
                    "status" to "COMPLETED",
                    "completedAt" to nowIso()
                )
            )
            .addOnSuccessListener { onSuccess() }
            .addOnFailureListener { onFailure(it.message ?: "Failed to mark served") }
    }

    fun markMissed(entryId: String, onSuccess: () -> Unit, onFailure: (String) -> Unit) {
        db.collection(COLLECTION).document(entryId)
            .update(
                mapOf(
                    "status" to "MISSED",
                    "completedAt" to nowIso()
                )
            )
            .addOnSuccessListener { onSuccess() }
            .addOnFailureListener { onFailure(it.message ?: "Failed to mark missed") }
    }

    fun subscribeToQueue(
        serviceCenterId: String,
        callback: (List<QueueEntry>, Map<String, Int>) -> Unit
    ): ListenerRegistration {
        return db.collection(COLLECTION)
            .whereEqualTo("serviceCenterId", serviceCenterId)
            .addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null) {
                    callback(emptyList(), emptyMap())
                    return@addSnapshotListener
                }
                val entries = parseEntries(snapshot)
                    .sortedBy { parseIsoDate(it.joinedAt) }
                val positionMap = computeDisplayPositions(entries)
                callback(entries, positionMap)
            }
    }

    fun getUserActiveQueue(
        userEmail: String,
        onResult: (QueueEntry?) -> Unit,
        onError: (String) -> Unit
    ) {
        db.collection(COLLECTION)
            .whereEqualTo("userEmail", userEmail)
            .whereIn("status", listOf("WAITING", "SERVING"))
            .get()
            .addOnSuccessListener { snapshot ->
                if (snapshot.isEmpty) {
                    onResult(null)
                } else {
                    val doc = snapshot.documents[0]
                    onResult(parseEntry(doc))
                }
            }
            .addOnFailureListener { onError(it.message ?: "Failed to get active queue") }
    }

    fun subscribeToUserQueue(
        userEmail: String,
        callback: (QueueEntry?) -> Unit
    ): ListenerRegistration {
        return db.collection(COLLECTION)
            .whereEqualTo("userEmail", userEmail)
            .whereIn("status", listOf("WAITING", "SERVING"))
            .addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null || snapshot.isEmpty) {
                    callback(null)
                    return@addSnapshotListener
                }
                val doc = snapshot.documents[0]
                callback(parseEntry(doc))
            }
    }

    fun subscribeToUserQueueWithPosition(
        userEmail: String,
        callback: (entry: QueueEntry?, position: Int, totalActive: Int, currentlyServing: List<QueueEntry>) -> Unit
    ): () -> Unit {
        var queueUnsub: ListenerRegistration? = null

        val userUnsub = subscribeToUserQueue(userEmail) { entry ->
            queueUnsub?.remove()
            queueUnsub = null

            if (entry == null || entry.serviceCenterId.isEmpty()) {
                callback(null, 0, 0, emptyList())
                return@subscribeToUserQueue
            }

            queueUnsub = subscribeToQueue(entry.serviceCenterId) { _entries, positionMap ->
                val position = positionMap[entry.id] ?: 0
                val currentlyServing = _entries.filter { it.status == "SERVING" }
                callback(entry, position, positionMap.size, currentlyServing)
            }
        }

        return {
            userUnsub.remove()
            queueUnsub?.remove()
        }
    }

    fun getServedTodayCount(onResult: (Int) -> Unit) {
        db.collection(COLLECTION)
            .whereEqualTo("status", "COMPLETED")
            .get()
            .addOnSuccessListener { snapshot ->
                val today = todayStart()
                val count = snapshot.documents.count { doc ->
                    val completedAt = doc.getString("completedAt") ?: return@count false
                    parseIsoDate(completedAt) >= today
                }
                onResult(count)
            }
            .addOnFailureListener { onResult(0) }
    }

    fun getTotalInQueue(onResult: (Int) -> Unit) {
        db.collection(COLLECTION)
            .whereIn("status", listOf("WAITING", "SERVING"))
            .get()
            .addOnSuccessListener { onResult(it.size()) }
            .addOnFailureListener { onResult(0) }
    }

    fun getWaitingCount(serviceCenterId: String, onResult: (Int) -> Unit) {
        db.collection(COLLECTION)
            .whereEqualTo("serviceCenterId", serviceCenterId)
            .whereEqualTo("status", "WAITING")
            .get()
            .addOnSuccessListener { onResult(it.size()) }
            .addOnFailureListener { onResult(0) }
    }

    fun getUserQueueHistory(userEmail: String, onResult: (List<QueueEntry>) -> Unit) {
        db.collection(COLLECTION)
            .whereEqualTo("userEmail", userEmail)
            .whereIn("status", listOf("COMPLETED", "CANCELLED", "MISSED"))
            .get()
            .addOnSuccessListener { snapshot ->
                val entries = parseEntries(snapshot)
                    .sortedByDescending { parseIsoDate(it.joinedAt) }
                onResult(entries)
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    fun getCenterQueueHistory(serviceCenterId: String, onResult: (List<QueueEntry>) -> Unit) {
        db.collection(COLLECTION)
            .whereEqualTo("serviceCenterId", serviceCenterId)
            .whereIn("status", listOf("COMPLETED", "CANCELLED", "MISSED"))
            .get()
            .addOnSuccessListener { snapshot ->
                val today = todayStart()
                val entries = parseEntries(snapshot)
                    .filter { entry ->
                        val time = entry.completedAt ?: entry.joinedAt
                        parseIsoDate(time) >= today
                    }
                    .sortedByDescending { parseIsoDate(it.completedAt) }
                onResult(entries)
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    private fun parseEntries(snapshot: QuerySnapshot): List<QueueEntry> {
        return snapshot.documents.map { parseEntry(it)!! }.filterNotNull()
    }

    private fun parseEntry(doc: com.google.firebase.firestore.DocumentSnapshot): QueueEntry? {
        return try {
            QueueEntry(
                id = doc.id,
                serviceCenterId = doc.getString("serviceCenterId") ?: "",
                serviceCenterName = doc.getString("serviceCenterName") ?: "",
                userId = doc.getString("userId") ?: "",
                userEmail = doc.getString("userEmail") ?: "",
                userName = doc.getString("userName") ?: "",
                status = doc.getString("status") ?: "",
                queueNumber = (doc.getLong("queueNumber") ?: 0).toInt(),
                joinedAt = doc.getString("joinedAt"),
                servedAt = doc.getString("servedAt"),
                completedAt = doc.getString("completedAt")
            )
        } catch (e: Exception) {
            null
        }
    }
}
