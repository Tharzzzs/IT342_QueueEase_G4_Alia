import React, { useState } from 'react';
import { register } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      alert("Registration Successful! Please log in.");
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-purple-400/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="auth-card">
          <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create Account</h2>
              <p className="text-gray-500 mt-2 font-medium">Join QueueEase and skip the wait.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">First Name</label>
                <input 
                    type="text" 
                    placeholder="John" 
                    required 
                    className="form-input" 
                    onChange={(e) => setFormData({...formData, firstname: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">Last Name</label>
                <input 
                    type="text" 
                    placeholder="Doe" 
                    required 
                    className="form-input"
                    onChange={(e) => setFormData({...formData, lastname: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
              <input 
                type="email" 
                placeholder="name@company.com" 
                required 
                className="form-input"
                onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase().trim()})} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required 
                className="form-input"
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary !mt-8">
              {loading ? 'Creating Account...' : 'Get Started'}
            </button>
          </form>

          <p className="mt-10 text-center text-[15px] text-gray-500 font-medium">
            Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline decoration-2 underline-offset-4 ml-1">Log in</Link>
          </p>
      </div>
    </div>
  );
};

export default Register;