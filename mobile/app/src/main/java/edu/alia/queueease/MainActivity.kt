package edu.alia.queueease

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.NavController
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import edu.alia.queueease.core.data.SessionManager
import edu.alia.queueease.databinding.ActivityMainBinding
import edu.alia.queueease.features.auth.LoginActivity

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var navController: NavController

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check if user is logged in
        if (!SessionManager.isLoggedIn) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)

        setupNavigation()
    }

    private fun setupNavigation() {
        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        val inflater = navHostFragment.navController.navInflater
        
        val role = SessionManager.role ?: "USER"
        val graphId = when (role) {
            "ADMIN" -> R.navigation.nav_admin
            "STAFF" -> R.navigation.nav_staff
            else -> R.navigation.nav_customer
        }

        val graph = inflater.inflate(graphId)
        navHostFragment.navController.graph = graph
        navController = navHostFragment.navController

        // Set up bottom navigation menu based on role
        val menuId = when (role) {
            "ADMIN" -> R.menu.bottom_nav_admin
            "STAFF" -> R.menu.bottom_nav_staff
            else -> R.menu.bottom_nav_customer
        }
        binding.bottomNavigation.inflateMenu(menuId)
        binding.bottomNavigation.setupWithNavController(navController)

        // Update title based on destination
        navController.addOnDestinationChangedListener { _, destination, _ ->
            binding.toolbar.title = destination.label
        }
    }
}