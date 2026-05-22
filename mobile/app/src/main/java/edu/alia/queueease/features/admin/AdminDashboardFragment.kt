package edu.alia.queueease.features.admin

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import edu.alia.queueease.databinding.FragmentAdminDashboardBinding

class AdminDashboardFragment : Fragment() {

    private var _binding: FragmentAdminDashboardBinding? = null
    private val binding get() = _binding!!

    private lateinit var viewModel: AdminDashboardViewModel

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAdminDashboardBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel = ViewModelProvider(this)[AdminDashboardViewModel::class.java]

        observeViewModel()
    }

    private fun observeViewModel() {
        viewModel.activeCenters.observe(viewLifecycleOwner) { count ->
            binding.tvActiveCenters.text = count.toString()
        }

        viewModel.totalCenters.observe(viewLifecycleOwner) { count ->
            binding.tvTotalCenters.text = count.toString()
        }

        viewModel.totalInQueue.observe(viewLifecycleOwner) { count ->
            binding.tvTotalInQueue.text = count.toString()
        }

        viewModel.servedToday.observe(viewLifecycleOwner) { count ->
            binding.tvServedToday.text = count.toString()
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.loadStats()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
