import React from 'react';

const CustomerHome = () => {
  const email = localStorage.getItem('email');

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen bg-gray-50">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-blue-600">QueueEase</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 italic">{email}</span>
          <button onClick={handleLogout} className="text-sm font-semibold text-red-500 hover:text-red-700">Logout</button>
        </div>
      </header>

      {/* Discovery - SDD Requirement  */}
      <h2 className="text-xl font-bold mb-4">Find Services</h2>
      <input 
        type="text" 
        placeholder="Search for clinics, offices..." 
        className="w-full p-4 border border-gray-300 rounded-xl mb-8 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
      />

      <h3 className="font-bold text-gray-700 mb-4 uppercase tracking-wider text-sm">Nearby Service Centers</h3>
      <div className="space-y-4">
        {['City Medical Clinic', 'Passport Office', 'Bank Branch A'].map((center) => (
          <div key={center} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
            <div>
              <p className="font-bold text-lg">{center}</p>
              <p className="text-sm text-gray-500">Estimated wait: ~20 minutes</p>
            </div>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors">
              Join Queue
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerHome;