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
import androidx.appcompat.app.AlertDialog
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
            binding.etDescription.setText(centerToEdit.description)
            binding.etOperatingHours.setText(centerToEdit.operatingHours)
            binding.etMaxCapacity.setText(centerToEdit.maxCapacity.toString())
            existingLogoUrl = centerToEdit.brandLogoUrl
            
            if (!existingLogoUrl.isNullOrEmpty()) {
                Glide.with(this).load(existingLogoUrl).into(binding.ivLogo)
            }
            
            binding.btnDelete.visibility = View.VISIBLE
            binding.btnDelete.setOnClickListener {
                AlertDialog.Builder(requireContext())
                    .setTitle("Delete Center")
                    .setMessage("Are you sure you want to permanently delete this service center?")
                    .setPositiveButton("Delete") { _, _ ->
                        binding.btnDelete.isEnabled = false
                        binding.btnDelete.text = "Deleting..."
                        ServiceCenterRepository.deleteServiceCenter(centerToEdit.id,
                            onSuccess = {
                                Toast.makeText(context, "Center deleted", Toast.LENGTH_SHORT).show()
                                dismiss()
                            },
                            onFailure = { err ->
                                Toast.makeText(context, err, Toast.LENGTH_SHORT).show()
                                binding.btnDelete.isEnabled = true
                                binding.btnDelete.text = "Delete Center"
                            }
                        )
                    }
                    .setNegativeButton("Cancel", null)
                    .show()
            }
        } else {
            binding.tvTitle.text = getString(R.string.create_center)
            binding.btnDelete.visibility = View.GONE
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
            val description = binding.etDescription.text.toString().trim()
            val operatingHours = binding.etOperatingHours.text.toString().trim()
            val maxCapacityStr = binding.etMaxCapacity.text.toString().trim()
            val maxCapacity = maxCapacityStr.toIntOrNull() ?: 0

            if (name.isEmpty() || category.isEmpty() || address.isEmpty() || operatingHours.isEmpty()) {
                Toast.makeText(context, "Please fill all required fields", Toast.LENGTH_SHORT).show()
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
                            saveServiceCenter(name, category, address, description, operatingHours, maxCapacity, url)
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
                saveServiceCenter(name, category, address, description, operatingHours, maxCapacity, existingLogoUrl ?: "")
            }
        }
    }

    private fun saveServiceCenter(name: String, category: String, address: String, description: String, operatingHours: String, maxCapacity: Int, logoUrl: String) {
        if (centerToEdit != null) {
            // Edit
            val updates = mutableMapOf<String, Any>(
                "name" to name,
                "category" to category,
                "address" to address,
                "description" to description,
                "operatingHours" to operatingHours,
                "maxCapacity" to maxCapacity
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
                description = description,
                operatingHours = operatingHours,
                maxCapacity = maxCapacity,
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
