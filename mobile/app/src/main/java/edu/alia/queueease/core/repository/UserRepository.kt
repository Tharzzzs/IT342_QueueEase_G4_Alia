package edu.alia.queueease.core.repository

import com.google.firebase.firestore.FirebaseFirestore
import edu.alia.queueease.core.models.UserProfile

object UserRepository {
    private val db = FirebaseFirestore.getInstance()

    fun getUserProfile(
        email: String,
        onResult: (UserProfile?) -> Unit,
        onError: (String) -> Unit
    ) {
        db.collection("users")
            .whereEqualTo("email", email)
            .get()
            .addOnSuccessListener { snapshot ->
                if (snapshot.isEmpty) {
                    onResult(null)
                } else {
                    val doc = snapshot.documents[0]
                    val profile = UserProfile(
                        id = doc.id,
                        email = doc.getString("email") ?: "",
                        firstname = doc.getString("firstname") ?: "",
                        lastname = doc.getString("lastname") ?: "",
                        avatarUrl = doc.getString("avatar_url"),
                        role = doc.getString("role") ?: "USER"
                    )
                    onResult(profile)
                }
            }
            .addOnFailureListener {
                onError(it.message ?: "Failed to retrieve profile")
            }
    }
}
