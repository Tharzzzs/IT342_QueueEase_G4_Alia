package edu.alia.queueease.features.admin

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import edu.alia.queueease.R
import edu.alia.queueease.core.models.ServiceCenter
import edu.alia.queueease.databinding.ItemAdminServiceCenterBinding

class AdminServiceCenterAdapter(
    private val onEditClick: (ServiceCenter) -> Unit,
    private val onAssignStaffClick: (ServiceCenter) -> Unit
) : ListAdapter<ServiceCenter, AdminServiceCenterAdapter.ViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemAdminServiceCenterBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(private val binding: ItemAdminServiceCenterBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(center: ServiceCenter) {
            binding.tvName.text = center.name
            binding.tvCategory.text = center.category

            if (center.isActive) {
                binding.tvStatus.text = "ACTIVE"
                binding.tvStatus.setBackgroundResource(R.drawable.bg_pill_serving)
                binding.tvStatus.setTextColor(binding.root.context.getColor(R.color.green_600))
            } else {
                binding.tvStatus.text = "INACTIVE"
                binding.tvStatus.setBackgroundResource(R.drawable.bg_pill_cancelled)
                binding.tvStatus.setTextColor(binding.root.context.getColor(R.color.red_600))
            }

            if (center.assignedStaffName.isNullOrEmpty()) {
                binding.tvStaff.text = "No Staff Assigned"
                binding.tvStaff.setTextColor(binding.root.context.getColor(R.color.warning_400))
                binding.btnAssignStaff.text = "Assign Staff"
            } else {
                binding.tvStaff.text = "Staff: ${center.assignedStaffName}"
                binding.tvStaff.setTextColor(binding.root.context.getColor(R.color.gray_600))
                binding.btnAssignStaff.text = "Reassign Staff"
            }

            binding.btnEdit.setOnClickListener {
                onEditClick(center)
            }

            binding.btnAssignStaff.setOnClickListener {
                onAssignStaffClick(center)
            }
        }
    }

    class DiffCallback : DiffUtil.ItemCallback<ServiceCenter>() {
        override fun areItemsTheSame(oldItem: ServiceCenter, newItem: ServiceCenter): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: ServiceCenter, newItem: ServiceCenter): Boolean {
            return oldItem == newItem
        }
    }
}
