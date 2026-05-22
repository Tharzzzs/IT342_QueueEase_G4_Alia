package edu.alia.queueease.features.admin

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import edu.alia.queueease.core.models.ServiceCenter
import edu.alia.queueease.core.models.StaffUser
import edu.alia.queueease.core.repository.ServiceCenterRepository
import edu.alia.queueease.databinding.BottomSheetAssignStaffBinding
import edu.alia.queueease.databinding.ItemStaffBinding

class AssignStaffBottomSheet(private val center: ServiceCenter) : BottomSheetDialogFragment() {

    private var _binding: BottomSheetAssignStaffBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = BottomSheetAssignStaffBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.tvSubtitle.text = "Assign staff to ${center.name}"

        binding.btnUnassign.visibility = if (center.assignedStaffEmail.isNullOrEmpty()) View.GONE else View.VISIBLE
        binding.btnUnassign.setOnClickListener {
            binding.progressBar.visibility = View.VISIBLE
            ServiceCenterRepository.unassignStaff(center.id,
                onSuccess = {
                    Toast.makeText(context, "Staff unassigned", Toast.LENGTH_SHORT).show()
                    dismiss()
                },
                onFailure = {
                    Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
                    binding.progressBar.visibility = View.GONE
                }
            )
        }

        loadStaff()
    }

    private fun loadStaff() {
        binding.progressBar.visibility = View.VISIBLE
        ServiceCenterRepository.getAllStaffUsers { staffList ->
            binding.progressBar.visibility = View.GONE
            setupRecyclerView(staffList)
        }
    }

    private fun setupRecyclerView(staffList: List<StaffUser>) {
        binding.rvStaff.layoutManager = LinearLayoutManager(context)
        binding.rvStaff.adapter = object : RecyclerView.Adapter<StaffViewHolder>() {
            override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StaffViewHolder {
                val itemBinding = ItemStaffBinding.inflate(LayoutInflater.from(parent.context), parent, false)
                return StaffViewHolder(itemBinding)
            }

            override fun onBindViewHolder(holder: StaffViewHolder, position: Int) {
                val staff = staffList[position]
                holder.binding.tvStaffName.text = staff.name
                holder.binding.tvStaffEmail.text = staff.email
                holder.binding.root.setOnClickListener {
                    assignStaff(staff)
                }
            }

            override fun getItemCount() = staffList.size
        }
    }

    private fun assignStaff(staff: StaffUser) {
        binding.progressBar.visibility = View.VISIBLE
        ServiceCenterRepository.assignStaff(center.id, staff.email, staff.name,
            onSuccess = {
                Toast.makeText(context, "Staff assigned successfully", Toast.LENGTH_SHORT).show()
                dismiss()
            },
            onFailure = {
                Toast.makeText(context, it, Toast.LENGTH_LONG).show()
                binding.progressBar.visibility = View.GONE
            }
        )
    }

    class StaffViewHolder(val binding: ItemStaffBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
