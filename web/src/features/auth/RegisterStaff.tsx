import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, ArrowLeft } from 'lucide-react';

const RegisterStaff = () => {
  const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8081/api/v1/auth/register/staff', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Staff Member Registered Successfully!');
      navigate('/admin/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action Failed: Insufficient Permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card !max-w-[500px]">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 font-bold text-sm mb-8 transition-colors group">
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-5 mb-10">
          <div className="auth-logo auth-logo-sm">
            <UserPlus size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Add Staff</h2>
            <p className="text-sm text-gray-500 font-medium">Create a new service center account.</p>
          </div>
        </div>

        <form onSubmit={handleStaffSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">First Name</label>
              <input type="text" placeholder="John" required className="form-input" onChange={(e) => setFormData({ ...formData, firstname: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">Last Name</label>
              <input type="text" placeholder="Doe" required className="form-input" onChange={(e) => setFormData({ ...formData, lastname: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">Staff Email</label>
            <input type="email" placeholder="staff@business.com" required className="form-input" onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase().trim() })} />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">Temporary Password</label>
            <input type="password" placeholder="Password" required className="form-input" onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>

          <div className="pt-6">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Registering...' : 'Confirm & Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterStaff;
