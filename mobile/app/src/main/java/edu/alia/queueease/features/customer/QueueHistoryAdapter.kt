package edu.alia.queueease.features.customer

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import edu.alia.queueease.R
import edu.alia.queueease.core.models.QueueEntry
import edu.alia.queueease.databinding.ItemQueueHistoryBinding
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

class QueueHistoryAdapter : ListAdapter<QueueEntry, QueueHistoryAdapter.ViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemQueueHistoryBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(private val binding: ItemQueueHistoryBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(entry: QueueEntry) {
            binding.tvCenterName.text = entry.serviceCenterName
            binding.tvQueueNumber.text = "#${entry.queueNumber}"

            // Format date
            val dateStr = entry.completedAt ?: entry.joinedAt
            if (!dateStr.isNullOrEmpty()) {
                try {
                    val sdfIn = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
                    sdfIn.timeZone = TimeZone.getTimeZone("UTC")
                    val date = sdfIn.parse(dateStr)
                    val sdfOut = SimpleDateFormat("MMM dd, yyyy - HH:mm", Locale.US)
                    binding.tvDate.text = sdfOut.format(date!!)
                } catch (e: Exception) {
                    binding.tvDate.text = dateStr
                }
            }

            // Status styling
            binding.tvStatus.text = entry.status
            when (entry.status) {
                "COMPLETED" -> {
                    binding.tvStatus.setBackgroundResource(R.drawable.bg_pill_completed)
                    binding.tvStatus.setTextColor(binding.root.context.getColor(R.color.gray_700))
                }
                "CANCELLED", "MISSED" -> {
                    binding.tvStatus.setBackgroundResource(R.drawable.bg_pill_cancelled)
                    binding.tvStatus.setTextColor(binding.root.context.getColor(R.color.red_600))
                }
                else -> {
                    binding.tvStatus.setBackgroundResource(R.drawable.bg_pill_waiting)
                    binding.tvStatus.setTextColor(binding.root.context.getColor(R.color.amber_500))
                }
            }

            // Calculate wait time
            if (entry.joinedAt != null && entry.servedAt != null) {
                try {
                    val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
                    sdf.timeZone = TimeZone.getTimeZone("UTC")
                    val join = sdf.parse(entry.joinedAt)!!.time
                    val served = sdf.parse(entry.servedAt)!!.time
                    val mins = (served - join) / 60000
                    binding.tvWaitTime.text = "${mins}m"
                } catch (e: Exception) {
                    binding.tvWaitTime.text = "-"
                }
            } else {
                binding.tvWaitTime.text = "-"
            }
        }
    }

    class DiffCallback : DiffUtil.ItemCallback<QueueEntry>() {
        override fun areItemsTheSame(oldItem: QueueEntry, newItem: QueueEntry): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: QueueEntry, newItem: QueueEntry): Boolean {
            return oldItem == newItem
        }
    }
}
