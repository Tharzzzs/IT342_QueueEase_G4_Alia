package edu.alia.queueease.features.admin

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import edu.alia.queueease.R
import edu.alia.queueease.core.data.SessionManager
import edu.alia.queueease.core.models.ServiceCenter
import edu.alia.queueease.core.repository.ServiceCenterRepository
import edu.alia.queueease.databinding.BottomSheetEditCenterBinding

class EditCenterBottomSheet(private val centerToEdit: ServiceCenter? = null) : BottomSheetDialogFragment() {

    private var _binding: BottomSheetEditCenterBinding? = null
    private val binding get() = _binding!!

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
        } else {
            binding.tvTitle.text = getString(R.string.create_center)
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

            if (centerToEdit != null) {
                // Edit
                val updates = mapOf(
                    "name" to name,
                    "category" to category,
                    "address" to address
                )
                ServiceCenterRepository.updateServiceCenter(centerToEdit.id, updates,
                    onSuccess = {
                        Toast.makeText(context, "Center updated", Toast.LENGTH_SHORT).show()
                        dismiss()
                    },
                    onFailure = {
                        Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
                        binding.btnSave.isEnabled = true
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
                    createdBy = userId
                )
                ServiceCenterRepository.createServiceCenter(newCenter,
                    onSuccess = {
                        Toast.makeText(context, "Center created", Toast.LENGTH_SHORT).show()
                        dismiss()
                    },
                    onFailure = {
                        Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
                        binding.btnSave.isEnabled = true
                    }
                )
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
