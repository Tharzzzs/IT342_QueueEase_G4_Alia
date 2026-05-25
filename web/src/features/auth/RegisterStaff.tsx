import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, X } from 'lucide-react';

interface RegisterStaffProps {
  onClose: () => void;
}

const RegisterStaff: React.FC<RegisterStaffProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://queueease-backend-evab.onrender.com/api/v1/auth/register/staff', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Staff Member Registered Successfully!');
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Action Failed: Insufficient Permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px', position: 'relative' }}
      >
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            background: 'none', border: 'none', color: 'var(--gray-400)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0.25rem', borderRadius: '50%', transition: 'all 0.2s'
          }}
          className="hover:bg-gray-100 hover:text-gray-700"
          title="Close Modal"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="auth-logo auth-logo-sm">
            <UserPlus size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Add Staff</h2>
            <p className="text-xs text-gray-500 font-medium">Create a new service center account.</p>
          </div>
        </div>

        <form onSubmit={handleStaffSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider ml-1">First Name</label>
              <input type="text" placeholder="John" required className="form-input" onChange={(e) => setFormData({ ...formData, firstname: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider ml-1">Last Name</label>
              <input type="text" placeholder="Doe" required className="form-input" onChange={(e) => setFormData({ ...formData, lastname: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider ml-1">Staff Email</label>
            <input type="email" placeholder="staff@business.com" required className="form-input" onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase().trim() })} />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
            <input type="password" placeholder="Password" required className="form-input" onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary-sm">
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterStaff;
