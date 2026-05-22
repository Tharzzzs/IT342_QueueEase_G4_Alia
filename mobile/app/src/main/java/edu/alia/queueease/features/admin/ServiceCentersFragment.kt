package edu.alia.queueease.features.admin

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import edu.alia.queueease.databinding.FragmentServiceCentersBinding

class ServiceCentersFragment : Fragment() {

    private var _binding: FragmentServiceCentersBinding? = null
    private val binding get() = _binding!!

    private lateinit var viewModel: AdminServiceCentersViewModel
    private lateinit var adapter: AdminServiceCenterAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentServiceCentersBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel = ViewModelProvider(this)[AdminServiceCentersViewModel::class.java]

        setupRecyclerView()
        setupListeners()
        observeViewModel()
    }

    private fun setupRecyclerView() {
        adapter = AdminServiceCenterAdapter(
            onEditClick = { center ->
                val bottomSheet = EditCenterBottomSheet(center)
                bottomSheet.show(childFragmentManager, "EditCenterBottomSheet")
            },
            onAssignStaffClick = { center ->
                val bottomSheet = AssignStaffBottomSheet(center)
                bottomSheet.show(childFragmentManager, "AssignStaffBottomSheet")
            }
        )
        binding.rvCenters.adapter = adapter
    }

    private fun setupListeners() {
        binding.fabAddCenter.setOnClickListener {
            val bottomSheet = EditCenterBottomSheet()
            bottomSheet.show(childFragmentManager, "CreateCenterBottomSheet")
        }
    }

    private fun observeViewModel() {
        viewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        }

        viewModel.centers.observe(viewLifecycleOwner) { centers ->
            adapter.submitList(centers)
        }

        viewModel.error.observe(viewLifecycleOwner) { msg ->
            Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
