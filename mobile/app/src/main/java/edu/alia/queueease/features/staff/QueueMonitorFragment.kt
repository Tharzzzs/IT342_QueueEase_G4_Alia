package edu.alia.queueease.features.staff

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import edu.alia.queueease.databinding.FragmentQueueMonitorBinding

class QueueMonitorFragment : Fragment() {

    private var _binding: FragmentQueueMonitorBinding? = null
    private val binding get() = _binding!!

    private lateinit var viewModel: QueueMonitorViewModel
    private lateinit var adapter: QueueMonitorAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentQueueMonitorBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel = ViewModelProvider(this)[QueueMonitorViewModel::class.java]

        setupRecyclerView()
        setupListeners()
        observeViewModel()
    }

    private fun setupRecyclerView() {
        adapter = QueueMonitorAdapter()
        binding.rvQueue.adapter = adapter
    }

    private fun setupListeners() {
        binding.btnCallNext.setOnClickListener {
            viewModel.callNext()
        }

        binding.btnMarkServed.setOnClickListener {
            viewModel.markServed()
        }
    }

    private fun observeViewModel() {
        viewModel.queue.observe(viewLifecycleOwner) { entries ->
            adapter.submitList(entries)
            if (entries.isEmpty()) {
                binding.emptyState.visibility = View.VISIBLE
                binding.rvQueue.visibility = View.GONE
            } else {
                binding.emptyState.visibility = View.GONE
                binding.rvQueue.visibility = View.VISIBLE
            }
        }

        viewModel.currentServing.observe(viewLifecycleOwner) { serving ->
            if (serving != null) {
                binding.tvCurrentServingNumber.text = "#${serving.queueNumber}"
                binding.tvCurrentServingName.text = serving.userName
                binding.btnMarkServed.isEnabled = true
            } else {
                binding.tvCurrentServingNumber.text = "--"
                binding.tvCurrentServingName.text = "No one currently serving"
                binding.btnMarkServed.isEnabled = false
            }
        }

        viewModel.actionStatus.observe(viewLifecycleOwner) { status ->
            when (status) {
                is QueueMonitorViewModel.ActionStatus.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.btnCallNext.isEnabled = false
                    binding.btnMarkServed.isEnabled = false
                }
                is QueueMonitorViewModel.ActionStatus.Success -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnCallNext.isEnabled = true
                    // btnMarkServed is handled by currentServing observer
                    Toast.makeText(context, status.message, Toast.LENGTH_SHORT).show()
                    viewModel.resetStatus()
                }
                is QueueMonitorViewModel.ActionStatus.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnCallNext.isEnabled = true
                    Toast.makeText(context, status.message, Toast.LENGTH_LONG).show()
                    viewModel.resetStatus()
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
