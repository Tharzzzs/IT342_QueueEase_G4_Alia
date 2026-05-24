package edu.alia.queueease.core.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import edu.alia.queueease.core.models.ServiceCenter
import edu.alia.queueease.core.models.StaffUser
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object ServiceCenterRepository {
    private const val COLLECTION = "service_centers"
    private const val FAVORITES_COLLECTION = "favorite_centers"
    private val db = FirebaseFirestore.getInstance()

    private fun nowIso(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date())
    }

    fun createServiceCenter(
        data: ServiceCenter,
        onSuccess: (String) -> Unit,
        onFailure: (String) -> Unit
    ) {
        val map = hashMapOf(
            "name" to data.name,
            "description" to data.description,
            "category" to data.category,
            "address" to data.address,
            "operatingHours" to data.operatingHours,
            "maxCapacity" to data.maxCapacity,
            "isActive" to data.isActive,
            "createdBy" to data.createdBy,
            "createdAt" to nowIso(),
            "assignedStaffEmail" to (data.assignedStaffEmail ?: ""),
            "assignedStaffName" to (data.assignedStaffName ?: "")
        )
        db.collection(COLLECTION).add(map)
            .addOnSuccessListener { onSuccess(it.id) }
            .addOnFailureListener { onFailure(it.message ?: "Failed to create service center") }
    }

    fun updateServiceCenter(
        id: String,
        updates: Map<String, Any>,
        onSuccess: () -> Unit,
        onFailure: (String) -> Unit
    ) {
        db.collection(COLLECTION).document(id).update(updates)
            .addOnSuccessListener { onSuccess() }
            .addOnFailureListener { onFailure(it.message ?: "Failed to update") }
    }

    fun deleteServiceCenter(id: String, onSuccess: () -> Unit, onFailure: (String) -> Unit) {
        db.collection(COLLECTION).document(id).delete()
            .addOnSuccessListener { onSuccess() }
            .addOnFailureListener { onFailure(it.message ?: "Failed to delete") }
    }

    fun getAllStaffUsers(onResult: (List<StaffUser>) -> Unit) {
        db.collection("users")
            .whereEqualTo("role", "STAFF")
            .get()
            .addOnSuccessListener { snapshot ->
                val staff = snapshot.documents.map { doc ->
                    StaffUser(
                        id = doc.id,
                        email = doc.getString("email") ?: "",
                        firstname = doc.getString("firstname") ?: "",
                        lastname = doc.getString("lastname") ?: "",
                        name = doc.getString("name") ?: "",
                        role = doc.getString("role") ?: ""
                    )
                }
                onResult(staff)
            }
            .addOnFailureListener { onResult(emptyList()) }
    }

    fun assignStaff(
        centerId: String,
        staffEmail: String,
        staffName: String,
        onSuccess: () -> Unit,
        onFailure: (String) -> Unit
    ) {
        // Check if staff is already assigned to another center
        db.collection(COLLECTION)
            .whereEqualTo("assignedStaffEmail", staffEmail)
            .get()
            .addOnSuccessListener { snapshot ->
                val existingCenter = snapshot.documents.firstOrNull { it.id != centerId }
                if (existingCenter != null) {
                    val name = existingCenter.getString("name") ?: "another center"
                    onFailure("This staff member is already assigned to \"$name\". Unassign them first.")
                    return@addOnSuccessListener
                }
                db.collection(COLLECTION).document(centerId)
                    .update(
                        mapOf(
                            "assignedStaffEmail" to staffEmail,
                            "assignedStaffName" to staffName
                        )
                    )
                    .addOnSuccessListener { onSuccess() }
                    .addOnFailureListener { onFailure(it.message ?: "Failed to assign staff") }
            }
            .addOnFailureListener { onFailure(it.message ?: "Failed to check assignment") }
    }

    fun unassignStaff(centerId: String, onSuccess: () -> Unit, onFailure: (String) -> Unit) {
        db.collection(COLLECTION).document(centerId)
            .update(
                mapOf(
                    "assignedStaffEmail" to "",
                    "assignedStaffName" to ""
                )
            )
            .addOnSuccessListener { onSuccess() }
            .addOnFailureListener { onFailure(it.message ?: "Failed to unassign staff") }
    }

    fun getStaffAssignedCenter(
        staffEmail: String,
        onResult: (ServiceCenter?) -> Unit
    ) {
        db.collection(COLLECTION)
            .whereEqualTo("assignedStaffEmail", staffEmail)
            .get()
            .addOnSuccessListener { snapshot ->
                if (snapshot.isEmpty) {
                    onResult(null)
                } else {
                    val doc = snapshot.documents[0]
                    onResult(parseCenter(doc))
                }
            }
            .addOnFailureListener { onResult(null) }
    }

    fun subscribeToStaffCenter(
        staffEmail: String,
        callback: (ServiceCenter?) -> Unit
    ): ListenerRegistration {
        return db.collection(COLLECTION)
            .whereEqualTo("assignedStaffEmail", staffEmail)
            .addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null || snapshot.isEmpty) {
                    callback(null)
                    return@addSnapshotListener
                }
                val doc = snapshot.documents[0]
                callback(parseCenter(doc))
            }
    }

    fun subscribeToServiceCenters(
        callback: (List<ServiceCenter>) -> Unit
    ): ListenerRegistration {
        return db.collection(COLLECTION)
            .addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null) {
                    callback(emptyList())
                    return@addSnapshotListener
                }
                val centers = snapshot.documents
                    .mapNotNull { parseCenter(it) }
                    .sortedByDescending { it.createdAt ?: "" }
                callback(centers)
            }
    }

    // Favorites
    fun toggleFavorite(
        userEmail: String,
        centerId: String,
        isFavorite: Boolean,
        onSuccess: () -> Unit,
        onFailure: (String) -> Unit
    ) {
        if (isFavorite) {
            // Unfavorite: find and delete
            db.collection(FAVORITES_COLLECTION)
                .whereEqualTo("userEmail", userEmail)
                .whereEqualTo("serviceCenterId", centerId)
                .get()
                .addOnSuccessListener { snapshot ->
                    val batch = db.batch()
                    snapshot.documents.forEach { doc ->
                        batch.delete(doc.reference)
                    }
                    batch.commit()
                        .addOnSuccessListener { onSuccess() }
                        .addOnFailureListener { onFailure(it.message ?: "Failed") }
                }
                .addOnFailureListener { onFailure(it.message ?: "Failed") }
        } else {
            // Favorite: add new doc
            val data = hashMapOf(
                "userEmail" to userEmail,
                "serviceCenterId" to centerId,
                "createdAt" to nowIso()
            )
            db.collection(FAVORITES_COLLECTION).add(data)
                .addOnSuccessListener { onSuccess() }
                .addOnFailureListener { onFailure(it.message ?: "Failed") }
        }
    }

    fun subscribeToFavorites(
        userEmail: String,
        callback: (List<String>) -> Unit
    ): ListenerRegistration {
        return db.collection(FAVORITES_COLLECTION)
            .whereEqualTo("userEmail", userEmail)
            .addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null) {
                    callback(emptyList())
                    return@addSnapshotListener
                }
                val ids = snapshot.documents.mapNotNull { it.getString("serviceCenterId") }
                callback(ids)
            }
    }

    private fun parseCenter(doc: com.google.firebase.firestore.DocumentSnapshot): ServiceCenter? {
        return try {
            ServiceCenter(
                id = doc.id,
                name = doc.getString("name") ?: "",
                description = doc.getString("description") ?: "",
                category = doc.getString("category") ?: "",
                address = doc.getString("address") ?: "",
                operatingHours = doc.getString("operatingHours") ?: "",
                maxCapacity = (doc.getLong("maxCapacity") ?: 0).toInt(),
                isActive = doc.getBoolean("isActive") ?: true,
                createdBy = doc.getString("createdBy") ?: "",
                createdAt = doc.getString("createdAt"),
                assignedStaffEmail = doc.getString("assignedStaffEmail"),
                assignedStaffName = doc.getString("assignedStaffName"),
                brandLogoUrl = doc.getString("brandLogoUrl")
            )
        } catch (e: Exception) {
            null
        }
    }
}
