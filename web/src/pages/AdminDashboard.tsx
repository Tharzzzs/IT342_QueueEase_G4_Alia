import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar - SDD Navigation [cite: 177] */}
      <div className="w-64 bg-white shadow-md p-6 flex flex-col">
        <h1 className="text-xl font-bold text-blue-600 mb-8">QueueEase</h1>
        <nav className="space-y-4 flex-1">
          <div className="text-blue-600 font-semibold cursor-pointer p-2 rounded-lg bg-blue-50">
            Dashboard
          </div>
          <div className="text-gray-600 hover:text-blue-600 cursor-pointer p-2 hover:bg-gray-50 transition-colors">
            Service Centers
          </div>
          <div className="text-gray-600 hover:text-blue-600 cursor-pointer p-2 hover:bg-gray-50 transition-colors">
            Live Monitor
          </div>
          
          {/* Admin-only sections [cite: 30, 88, 114] */}
          {role === 'ADMIN' && (
            <>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2 ml-2">Administration</p>
                <div 
                  onClick={() => navigate('/admin/register-staff')}
                  className="text-gray-600 hover:text-blue-600 cursor-pointer p-2 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                >
                  + Register Staff
                </div>
                <div className="text-gray-600 hover:text-blue-600 cursor-pointer p-2 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                  User Management
                </div>
              </div>
            </>
          )}
        </nav>
        
        <button 
          onClick={handleLogout} 
          className="mt-auto text-red-500 font-medium hover:bg-red-50 p-2 rounded-lg transition-colors text-left"
        >
          Logout
        </button>
      </div>

      {/* Main Content - SDD Wireframe Metrics [cite: 333, 339, 341] */}
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
          <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border">
            Logged in as: <span className="font-bold text-blue-600">{role}</span>
          </div>
        </header>
        
        {/* Metric Cards [cite: 332, 337] */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-400 uppercase font-bold mb-1">Active Centers</p>
            <p className="text-3xl font-bold text-gray-800">12</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-400 uppercase font-bold mb-1">People in Queue</p>
            <p className="text-3xl font-bold text-gray-800">48</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-400 uppercase font-bold mb-1">Served Today</p>
            <p className="text-3xl font-bold text-gray-800">156</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-400 uppercase font-bold mb-1">System Health</p>
            <p className="text-3xl font-bold text-green-500">99.9%</p>
          </div>
        </div>

        {/* Global Activity Log - SDD Requirement [cite: 334, 346] */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Global Activity Log</h3>
          </div>
          <div className="p-6">
            <div className="text-center py-10 text-gray-400">
              <p>No recent activity to display.</p>
              <p className="text-sm">Real-time Firestore listeners will populate this in Phase 2[cite: 495].</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;