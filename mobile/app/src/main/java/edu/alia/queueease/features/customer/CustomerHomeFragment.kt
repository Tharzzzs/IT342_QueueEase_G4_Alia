package edu.alia.queueease.features.customer

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import com.google.android.material.tabs.TabLayout
import edu.alia.queueease.R
import edu.alia.queueease.databinding.FragmentCustomerHomeBinding
import edu.alia.queueease.databinding.LayoutActiveQueueBannerBinding

class CustomerHomeFragment : Fragment() {

    private var _binding: FragmentCustomerHomeBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var viewModel: CustomerHomeViewModel
    private lateinit var activeQueueViewModel: ActiveQueueViewModel
    private lateinit var adapter: ServiceCenterAdapter

    private var allItems = listOf<ServiceCenterItem>()
    private var searchQuery = ""
    private var showFavoritesOnly = false

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCustomerHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        viewModel = ViewModelProvider(this)[CustomerHomeViewModel::class.java]
        activeQueueViewModel = ViewModelProvider(this)[ActiveQueueViewModel::class.java]

        setupRecyclerView()
        setupListeners()
        observeViewModels()
    }

    private fun setupRecyclerView() {
        adapter = ServiceCenterAdapter(
            onJoinClick = { center ->
                viewModel.joinQueue(center)
            },
            onFavoriteClick = { center, isFav ->
                viewModel.toggleFavorite(center.id, isFav)
            }
        )
        binding.rvCenters.adapter = adapter
    }

    private fun setupListeners() {
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                searchQuery = s.toString().lowercase()
                filterList()
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        binding.tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                showFavoritesOnly = tab?.position == 1
                filterList()
            }
            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })
    }

    private fun observeViewModels() {
        binding.progressBar.visibility = View.VISIBLE
        
        viewModel.centers.observe(viewLifecycleOwner) { items ->
            binding.progressBar.visibility = View.GONE
            allItems = items
            filterList()
        }

        viewModel.error.observe(viewLifecycleOwner) { msg ->
            Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
        }

        viewModel.joinStatus.observe(viewLifecycleOwner) { status ->
            when (status) {
                is CustomerHomeViewModel.JoinStatus.Loading -> {
                }
                is CustomerHomeViewModel.JoinStatus.Success -> {
                    Toast.makeText(context, "Successfully joined queue!", Toast.LENGTH_SHORT).show()
                    viewModel.resetJoinStatus()
                    findNavController().navigate(R.id.action_home_to_activeQueue)
                }
                is CustomerHomeViewModel.JoinStatus.Error -> {
                    Toast.makeText(context, status.message, Toast.LENGTH_LONG).show()
                    viewModel.resetJoinStatus()
                }
                else -> {}
            }
        }

        activeQueueViewModel.activeEntry.observe(viewLifecycleOwner) { entry ->
            updateBanner()
        }

        activeQueueViewModel.position.observe(viewLifecycleOwner) { pos ->
            updateBanner()
        }
    }

    private fun updateBanner() {
        val entry = activeQueueViewModel.activeEntry.value
        binding.bannerContainer.removeAllViews()
        if (entry != null && (entry.status == "WAITING" || entry.status == "SERVING")) {
            val bannerBinding = edu.alia.queueease.databinding.LayoutActiveQueueBannerBinding.inflate(layoutInflater, binding.bannerContainer, true)
            
            if (entry.status == "SERVING") {
                bannerBinding.bannerRoot.setBackgroundResource(edu.alia.queueease.R.color.green_50)
                bannerBinding.tvBannerTitle.text = getString(edu.alia.queueease.R.string.now_serving)
                bannerBinding.tvBannerSubtitle.text = "At ${entry.serviceCenterName}"
            } else {
                bannerBinding.bannerRoot.setBackgroundResource(edu.alia.queueease.R.color.amber_50)
                bannerBinding.tvBannerTitle.text = "You are in a queue"
                val pos = activeQueueViewModel.position.value ?: 0
                bannerBinding.tvBannerSubtitle.text = "Position: $pos at ${entry.serviceCenterName}"
            }

            bannerBinding.bannerRoot.setOnClickListener {
                findNavController().navigate(edu.alia.queueease.R.id.action_home_to_activeQueue)
            }
        }
    }

    private fun filterList() {
        var filtered = allItems
        
        if (showFavoritesOnly) {
            filtered = filtered.filter { it.isFavorite }
        }
        
        if (searchQuery.isNotEmpty()) {
            filtered = filtered.filter { 
                it.center.name.lowercase().contains(searchQuery) || 
                it.center.category.lowercase().contains(searchQuery) 
            }
        }
        
        adapter.submitList(filtered)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
