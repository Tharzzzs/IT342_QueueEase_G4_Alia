import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterStaff = () => {
  const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // ADD THIS LINE TO DEBUG:
      console.log("SENDING TOKEN:", token); 
      console.log("ROLE IN STORAGE:", localStorage.getItem('role'));
      // SDD Requirement: Use Bearer Token for restricted endpoints [cite: 211, 254]
      await axios.post('http://localhost:8080/api/v1/auth/register/staff', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Staff Member Registered Successfully!");
      navigate('/admin/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.message || "Action Failed: Insufficient Permissions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Register New Staff</h2>
        <p className="text-sm text-gray-500 mb-6">Create an account for service center personnel.</p>
        
        <form onSubmit={handleStaffSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="First Name" required className="form-input" 
                   onChange={(e) => setFormData({...formData, firstname: e.target.value})} />
            <input type="text" placeholder="Last Name" required className="form-input"
                   onChange={(e) => setFormData({...formData, lastname: e.target.value})} />
          </div>
          <input type="email" placeholder="Staff Email" required className="form-input"
                 onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase().trim()})} />
          <input type="password" placeholder="Temporary Password" required className="form-input"
                 onChange={(e) => setFormData({...formData, password: e.target.value})} />
          
          <div className="flex gap-4 mt-6">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? "Registering..." : "Add Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterStaff;