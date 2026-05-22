package edu.alia.queueease.features.staff

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import edu.alia.queueease.R
import edu.alia.queueease.core.models.QueueEntry
import edu.alia.queueease.databinding.ItemQueueMonitorBinding
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

class QueueMonitorAdapter : ListAdapter<QueueEntry, QueueMonitorAdapter.ViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemQueueMonitorBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(private val binding: ItemQueueMonitorBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(entry: QueueEntry) {
            binding.tvQueueNumber.text = "#${entry.queueNumber}"
            binding.tvCustomerName.text = entry.userName
            binding.tvStatus.text = entry.status

            if (entry.status == "SERVING") {
                binding.tvStatus.setBackgroundResource(R.drawable.bg_pill_serving)
                binding.tvStatus.setTextColor(binding.root.context.getColor(R.color.green_600))
            } else {
                binding.tvStatus.setBackgroundResource(R.drawable.bg_pill_waiting)
                binding.tvStatus.setTextColor(binding.root.context.getColor(R.color.amber_500))
            }

            // Format date
            val time = entry.servedAt ?: entry.joinedAt
            if (!time.isNullOrEmpty()) {
                try {
                    val sdfIn = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
                    sdfIn.timeZone = TimeZone.getTimeZone("UTC")
                    val date = sdfIn.parse(time)
                    val sdfOut = SimpleDateFormat("HH:mm a", Locale.US)
                    val prefix = if (entry.status == "SERVING") "Serving since: " else "Joined: "
                    binding.tvTime.text = "$prefix${sdfOut.format(date!!)}"
                } catch (e: Exception) {
                    binding.tvTime.text = time
                }
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
