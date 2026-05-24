package edu.alia.queueease.features.customer

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import edu.alia.queueease.R
import edu.alia.queueease.databinding.FragmentActiveQueueBinding
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

class ActiveQueueFragment : Fragment() {

    private var _binding: FragmentActiveQueueBinding? = null
    private val binding get() = _binding!!

    private lateinit var viewModel: ActiveQueueViewModel
    private var currentEntryId: String? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentActiveQueueBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel = ViewModelProvider(this)[ActiveQueueViewModel::class.java]

        setupListeners()
        observeViewModel()
    }

    private fun setupListeners() {
        binding.btnBack.setOnClickListener {
            if (!findNavController().popBackStack()) {
                findNavController().navigate(R.id.customerHomeFragment)
            }
        }

        binding.btnLeaveQueue.setOnClickListener {
            currentEntryId?.let { id ->
                viewModel.leaveQueue(id)
            }
        }
    }

    private fun observeViewModel() {
        viewModel.activeEntry.observe(viewLifecycleOwner) { entry ->
            if (entry == null) {
                // If entry becomes null (completed or cancelled), go back safely
                view?.post {
                    if (isAdded) {
                        try {
                            if (!findNavController().popBackStack()) {
                                findNavController().navigate(R.id.customerHomeFragment)
                            }
                        } catch (e: Exception) {
                            try {
                                findNavController().navigate(R.id.customerHomeFragment)
                            } catch (e2: Exception) {}
                        }
                    }
                }
                return@observe
            }
            currentEntryId = entry.id
            binding.tvQueueNumber.text = "#${entry.queueNumber}"
            binding.tvCenterName.text = entry.serviceCenterName

            // Format date
            val dateStr = entry.joinedAt
            if (!dateStr.isNullOrEmpty()) {
                try {
                    val sdfIn = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
                    sdfIn.timeZone = TimeZone.getTimeZone("UTC")
                    val date = sdfIn.parse(dateStr)
                    val sdfOut = SimpleDateFormat("HH:mm a", Locale.US)
                    binding.tvJoinedAt.text = sdfOut.format(date!!)
                } catch (e: Exception) {
                    binding.tvJoinedAt.text = dateStr
                }
            }

            if (entry.status == "SERVING") {
                binding.heroCard.setBackgroundResource(R.drawable.bg_hero_serving)
                binding.tvTitle.text = getString(R.string.now_serving)
                binding.tvStatusSubtitle.text = getString(R.string.your_turn_subtitle)
            } else {
                binding.heroCard.setBackgroundResource(R.drawable.bg_hero_queue)
                binding.tvTitle.text = getString(R.string.active_queue)
                val pos = viewModel.position.value ?: 0
                binding.tvStatusSubtitle.text = "Position: $pos • Waiting"
            }
        }

        viewModel.position.observe(viewLifecycleOwner) { pos ->
            val entry = viewModel.activeEntry.value
            if (entry?.status == "WAITING") {
                binding.tvStatusSubtitle.text = "Position: $pos • Waiting"
            }
        }

        viewModel.leaveStatus.observe(viewLifecycleOwner) { status ->
            when (status) {
                is ActiveQueueViewModel.LeaveStatus.Loading -> {
                    binding.btnLeaveQueue.isEnabled = false
                }
                is ActiveQueueViewModel.LeaveStatus.Success -> {
                    Toast.makeText(context, "Left queue", Toast.LENGTH_SHORT).show()
                    findNavController().popBackStack()
                }
                is ActiveQueueViewModel.LeaveStatus.Error -> {
                    binding.btnLeaveQueue.isEnabled = true
                    Toast.makeText(context, status.message, Toast.LENGTH_LONG).show()
                }
                else -> {}
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
