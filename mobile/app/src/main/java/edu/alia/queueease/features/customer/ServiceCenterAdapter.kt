package edu.alia.queueease.features.customer

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import edu.alia.queueease.R
import edu.alia.queueease.core.models.ServiceCenter
import edu.alia.queueease.databinding.ItemServiceCenterBinding

class ServiceCenterAdapter(
    private val onJoinClick: (ServiceCenter) -> Unit,
    private val onFavoriteClick: (ServiceCenter, Boolean) -> Unit
) : ListAdapter<ServiceCenterItem, ServiceCenterAdapter.ViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemServiceCenterBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(private val binding: ItemServiceCenterBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(item: ServiceCenterItem) {
            val center = item.center
            binding.tvName.text = center.name
            binding.tvCategory.text = center.category
            binding.tvAddress.text = center.address
            binding.tvWaitingCount.text = item.waitingCount.toString()
            binding.tvEstWait.text = "~${item.waitingCount * 5}m" // Dummy calculation like web app

            if (item.isFavorite) {
                binding.ivFavorite.setImageResource(android.R.drawable.btn_star_big_on)
                binding.ivFavorite.setColorFilter(binding.root.context.getColor(R.color.warning_400))
            } else {
                binding.ivFavorite.setImageResource(android.R.drawable.btn_star_big_off)
                binding.ivFavorite.setColorFilter(binding.root.context.getColor(R.color.gray_400))
            }

            binding.btnJoinQueue.isEnabled = center.isActive
            binding.btnJoinQueue.text = if (center.isActive) "Join Queue" else "Closed"

            binding.btnJoinQueue.setOnClickListener {
                onJoinClick(center)
            }

            binding.ivFavorite.setOnClickListener {
                onFavoriteClick(center, !item.isFavorite)
            }
        }
    }

    class DiffCallback : DiffUtil.ItemCallback<ServiceCenterItem>() {
        override fun areItemsTheSame(oldItem: ServiceCenterItem, newItem: ServiceCenterItem): Boolean {
            return oldItem.center.id == newItem.center.id
        }

        override fun areContentsTheSame(oldItem: ServiceCenterItem, newItem: ServiceCenterItem): Boolean {
            return oldItem == newItem
        }
    }
}

data class ServiceCenterItem(
    val center: ServiceCenter,
    val isFavorite: Boolean,
    val waitingCount: Int
)
