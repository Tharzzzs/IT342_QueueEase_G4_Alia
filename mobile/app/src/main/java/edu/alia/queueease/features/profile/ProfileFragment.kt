package edu.alia.queueease.features.profile

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.OpenableColumns
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import com.bumptech.glide.Glide
import edu.alia.queueease.core.data.SessionManager
import edu.alia.queueease.core.network.ApiClient
import edu.alia.queueease.core.network.models.UpdateProfileRequest
import edu.alia.queueease.core.repository.UserRepository
import edu.alia.queueease.databinding.FragmentProfileBinding
import edu.alia.queueease.features.auth.LoginActivity
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.io.File
import java.io.FileOutputStream

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!
    private var selectedImageUri: Uri? = null

    private val imagePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val data: Intent? = result.data
            selectedImageUri = data?.data
            if (selectedImageUri != null) {
                binding.tvAvatarInitials.visibility = View.GONE
                Glide.with(this).load(selectedImageUri).into(binding.ivAvatar)
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.tvName.text = SessionManager.userName ?: "User"
        binding.tvEmail.text = SessionManager.email ?: ""
        binding.tvRole.text = SessionManager.role ?: "USER"
        
        // Setup Avatar Initials placeholder
        val userName = SessionManager.userName ?: "User"
        binding.tvAvatarInitials.text = userName.firstOrNull()?.toString()?.uppercase() ?: "U"

        // Load existing avatar from local session cache
        val avatarUrl = SessionManager.avatarUrl
        if (!avatarUrl.isNullOrEmpty()) {
            binding.tvAvatarInitials.visibility = View.GONE
            Glide.with(this).load(ApiClient.sanitizeUrl(avatarUrl)).into(binding.ivAvatar)
        }

        // Fallback local splitting to populate First/Last Name inputs while fetching Firestore details
        val parts = userName.split(" ")
        if (parts.isNotEmpty()) {
            binding.etFirstname.setText(parts[0])
            if (parts.size > 1) {
                binding.etLastname.setText(parts.subList(1, parts.size).joinToString(" "))
            }
        }

        // Fetch user profile from Firestore to populate name inputs with most recent details
        val email = SessionManager.email ?: ""
        if (email.isNotEmpty()) {
            UserRepository.getUserProfile(email,
                onResult = { profile ->
                    if (profile != null && isAdded) {
                        binding.etFirstname.setText(profile.firstname)
                        binding.etLastname.setText(profile.lastname)
                        profile.avatarUrl?.let { url ->
                            if (url.isNotEmpty()) {
                                SessionManager.avatarUrl = url
                                binding.tvAvatarInitials.visibility = View.GONE
                                Glide.with(this@ProfileFragment).load(ApiClient.sanitizeUrl(url)).into(binding.ivAvatar)
                            }
                        }
                    }
                },
                onError = {
                    if (isAdded) {
                        Toast.makeText(context, "Failed to sync online profile details", Toast.LENGTH_SHORT).show()
                    }
                }
            )
        }

        binding.btnChangePhoto.setOnClickListener {
            val intent = Intent(Intent.ACTION_PICK)
            intent.type = "image/*"
            imagePickerLauncher.launch(intent)
        }

        binding.btnSave.setOnClickListener {
            saveProfileChanges()
        }

        binding.btnLogout.setOnClickListener {
            AlertDialog.Builder(requireContext())
                .setTitle("Logout")
                .setMessage("Are you sure you want to logout?")
                .setPositiveButton("Logout") { _, _ ->
                    SessionManager.clearSession()
                    com.google.firebase.auth.FirebaseAuth.getInstance().signOut()
                    val intent = Intent(requireContext(), LoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                }
                .setNegativeButton("Cancel", null)
                .show()
        }
    }

    private fun saveProfileChanges() {
        val firstname = binding.etFirstname.text.toString().trim()
        val lastname = binding.etLastname.text.toString().trim()

        if (firstname.isEmpty() || lastname.isEmpty()) {
            Toast.makeText(context, "Please fill in all fields", Toast.LENGTH_SHORT).show()
            return
        }

        binding.btnSave.isEnabled = false
        binding.btnSave.text = "Saving..."

        if (selectedImageUri != null) {
            // First upload the new avatar photo
            try {
                val file = getFileFromUri(selectedImageUri!!)
                if (file == null) {
                    Toast.makeText(context, "Failed to read image", Toast.LENGTH_SHORT).show()
                    resetSaveButton()
                    return
                }

                val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
                val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
                val folder = "avatars".toRequestBody("text/plain".toMediaTypeOrNull())

                ApiClient.apiService.uploadFile(body, folder).enqueue(object : Callback<Map<String, String>> {
                    override fun onResponse(call: Call<Map<String, String>>, response: Response<Map<String, String>>) {
                        if (response.isSuccessful && response.body() != null) {
                            val url = response.body()!!["url"] ?: ""
                            updateProfileOnBackend(firstname, lastname, url)
                        } else {
                            Toast.makeText(context, "Upload failed", Toast.LENGTH_SHORT).show()
                            resetSaveButton()
                        }
                    }

                    override fun onFailure(call: Call<Map<String, String>>, t: Throwable) {
                        Toast.makeText(context, "Upload error: ${t.message}", Toast.LENGTH_SHORT).show()
                        resetSaveButton()
                    }
                })
            } catch (e: Exception) {
                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                resetSaveButton()
            }
        } else {
            // No new avatar, save names and keep existing avatarUrl
            val existingAvatarUrl = SessionManager.avatarUrl ?: ""
            updateProfileOnBackend(firstname, lastname, existingAvatarUrl)
        }
    }

    private fun updateProfileOnBackend(firstname: String, lastname: String, avatarUrl: String) {
        val request = UpdateProfileRequest(
            firstname = firstname,
            lastname = lastname,
            avatarUrl = avatarUrl
        )
        ApiClient.apiService.updateProfile(request).enqueue(object : Callback<Map<String, Any>> {
            override fun onResponse(call: Call<Map<String, Any>>, response: Response<Map<String, Any>>) {
                resetSaveButton()
                if (response.isSuccessful) {
                    Toast.makeText(context, "Profile updated successfully", Toast.LENGTH_SHORT).show()
                    SessionManager.userName = "$firstname $lastname".trim()
                    SessionManager.avatarUrl = avatarUrl
                    binding.tvName.text = SessionManager.userName
                    
                    if (avatarUrl.isNotEmpty()) {
                        binding.tvAvatarInitials.visibility = View.GONE
                        Glide.with(this@ProfileFragment).load(ApiClient.sanitizeUrl(avatarUrl)).into(binding.ivAvatar)
                    }
                    selectedImageUri = null // Reset selection
                } else {
                    Toast.makeText(context, "Update failed", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {
                resetSaveButton()
                Toast.makeText(context, "Update error: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun resetSaveButton() {
        binding.btnSave.isEnabled = true
        binding.btnSave.text = "Save Changes"
    }

    private fun getFileFromUri(uri: Uri): File? {
        val context = requireContext()
        val contentResolver = context.contentResolver
        var fileName = "temp_image.jpg"
        
        contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (index != -1) {
                    fileName = cursor.getString(index)
                }
            }
        }
        
        val tempFile = File(context.cacheDir, fileName)
        try {
            contentResolver.openInputStream(uri)?.use { inputStream ->
                FileOutputStream(tempFile).use { outputStream ->
                    inputStream.copyTo(outputStream)
                }
            }
            return tempFile
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
