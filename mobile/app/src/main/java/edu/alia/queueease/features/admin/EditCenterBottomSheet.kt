package edu.alia.queueease.features.admin

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
import com.bumptech.glide.Glide
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import edu.alia.queueease.R
import edu.alia.queueease.core.data.SessionManager
import edu.alia.queueease.core.models.ServiceCenter
import edu.alia.queueease.core.network.ApiClient
import edu.alia.queueease.core.repository.ServiceCenterRepository
import edu.alia.queueease.databinding.BottomSheetEditCenterBinding
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.io.File
import java.io.FileOutputStream

class EditCenterBottomSheet(private val centerToEdit: ServiceCenter? = null) : BottomSheetDialogFragment() {

    private var _binding: BottomSheetEditCenterBinding? = null
    private val binding get() = _binding!!
    private var selectedLogoUri: Uri? = null
    private var existingLogoUrl: String? = null

    private val imagePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val data: Intent? = result.data
            selectedLogoUri = data?.data
            if (selectedLogoUri != null) {
                Glide.with(this).load(selectedLogoUri).into(binding.ivLogo)
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = BottomSheetEditCenterBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        if (centerToEdit != null) {
            binding.tvTitle.text = getString(R.string.edit_center)
            binding.etName.setText(centerToEdit.name)
            binding.etCategory.setText(centerToEdit.category)
            binding.etAddress.setText(centerToEdit.address)
            existingLogoUrl = centerToEdit.brandLogoUrl
            
            if (!existingLogoUrl.isNullOrEmpty()) {
                Glide.with(this).load(existingLogoUrl).into(binding.ivLogo)
            }
        } else {
            binding.tvTitle.text = getString(R.string.create_center)
        }

        binding.btnUploadLogo.setOnClickListener {
            val intent = Intent(Intent.ACTION_PICK)
            intent.type = "image/*"
            imagePickerLauncher.launch(intent)
        }

        binding.btnCancel.setOnClickListener {
            dismiss()
        }

        binding.btnSave.setOnClickListener {
            val name = binding.etName.text.toString().trim()
            val category = binding.etCategory.text.toString().trim()
            val address = binding.etAddress.text.toString().trim()

            if (name.isEmpty() || category.isEmpty() || address.isEmpty()) {
                Toast.makeText(context, "Please fill all fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            binding.btnSave.isEnabled = false
            binding.btnSave.text = "Saving..."

            if (selectedLogoUri != null) {
                // First upload image
                val file = getFileFromUri(selectedLogoUri!!)
                if (file == null) {
                    Toast.makeText(context, "Failed to process image", Toast.LENGTH_SHORT).show()
                    resetSaveButton()
                    return@setOnClickListener
                }

                val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
                val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
                val folder = "logos".toRequestBody("text/plain".toMediaTypeOrNull())

                ApiClient.apiService.uploadFile(body, folder).enqueue(object : Callback<Map<String, String>> {
                    override fun onResponse(call: Call<Map<String, String>>, response: Response<Map<String, String>>) {
                        if (response.isSuccessful && response.body() != null) {
                            val url = response.body()!!["url"] ?: ""
                            saveServiceCenter(name, category, address, url)
                        } else {
                            Toast.makeText(context, "Logo upload failed", Toast.LENGTH_SHORT).show()
                            resetSaveButton()
                        }
                    }

                    override fun onFailure(call: Call<Map<String, String>>, t: Throwable) {
                        Toast.makeText(context, "Upload error: ${t.message}", Toast.LENGTH_SHORT).show()
                        resetSaveButton()
                    }
                })
            } else {
                saveServiceCenter(name, category, address, existingLogoUrl ?: "")
            }
        }
    }

    private fun saveServiceCenter(name: String, category: String, address: String, logoUrl: String) {
        if (centerToEdit != null) {
            // Edit
            val updates = mutableMapOf<String, Any>(
                "name" to name,
                "category" to category,
                "address" to address
            )
            if (logoUrl.isNotEmpty()) updates["brandLogoUrl"] = logoUrl

            ServiceCenterRepository.updateServiceCenter(centerToEdit.id, updates,
                onSuccess = {
                    Toast.makeText(context, "Center updated", Toast.LENGTH_SHORT).show()
                    dismiss()
                },
                onFailure = {
                    Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
                    resetSaveButton()
                }
            )
        } else {
            // Create
            val userId = SessionManager.userId ?: ""
            val newCenter = ServiceCenter(
                name = name,
                category = category,
                address = address,
                description = "",
                operatingHours = "09:00 - 17:00",
                maxCapacity = 100,
                isActive = true,
                createdBy = userId,
                brandLogoUrl = logoUrl
            )
            ServiceCenterRepository.createServiceCenter(newCenter,
                onSuccess = {
                    Toast.makeText(context, "Center created", Toast.LENGTH_SHORT).show()
                    dismiss()
                },
                onFailure = {
                    Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
                    resetSaveButton()
                }
            )
        }
    }

    private fun resetSaveButton() {
        binding.btnSave.isEnabled = true
        binding.btnSave.text = getString(R.string.save)
    }

    private fun getFileFromUri(uri: Uri): File? {
        val context = requireContext()
        val contentResolver = context.contentResolver
        var fileName = "temp_logo.jpg"
        
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
