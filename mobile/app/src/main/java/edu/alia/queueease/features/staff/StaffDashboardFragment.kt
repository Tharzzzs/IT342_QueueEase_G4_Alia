package edu.alia.queueease.features.staff

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import edu.alia.queueease.databinding.FragmentStaffDashboardBinding

class StaffDashboardFragment : Fragment() {

    private var _binding: FragmentStaffDashboardBinding? = null
    private val binding get() = _binding!!

    private lateinit var viewModel: StaffDashboardViewModel

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentStaffDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel = ViewModelProvider(this)[StaffDashboardViewModel::class.java]

        setupListeners()
        observeViewModel()
    }

    private fun setupListeners() {
        binding.switchStatus.setOnCheckedChangeListener { _, isChecked ->
            viewModel.toggleCenterStatus(isChecked)
        }
    }

    private fun observeViewModel() {
        viewModel.assignedCenter.observe(viewLifecycleOwner) { center ->
            if (center == null) {
                binding.llNoAssignment.visibility = View.VISIBLE
                binding.llAssignedContent.visibility = View.GONE
            } else {
                binding.llNoAssignment.visibility = View.GONE
                binding.llAssignedContent.visibility = View.VISIBLE
                
                binding.tvCenterName.text = center.name
                
                // Remove listener temporarily to avoid looping
                binding.switchStatus.setOnCheckedChangeListener(null)
                binding.switchStatus.isChecked = center.isActive
                binding.switchStatus.setOnCheckedChangeListener { _, isChecked ->
                    viewModel.toggleCenterStatus(isChecked)
                }
            }
        }

        viewModel.waitingCount.observe(viewLifecycleOwner) { count ->
            binding.tvWaitingCount.text = count.toString()
        }

        viewModel.todayServedCount.observe(viewLifecycleOwner) { count ->
            binding.tvServedCount.text = count.toString()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
