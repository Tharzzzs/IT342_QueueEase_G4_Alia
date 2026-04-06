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
      <div className="auth-card">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create Account</h2>
            <p className="text-gray-500 mt-2 font-medium">Start managing your time better</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input 
                type="text" 
                placeholder="First" 
                required 
                className="form-input px-4" 
                onChange={(e) => setFormData({...formData, firstname: e.target.value})} 
            />
            <input 
                type="text" 
                placeholder="Last" 
                required 
                className="form-input px-4"
                onChange={(e) => setFormData({...formData, lastname: e.target.value})} 
            />
          </div>

          <input 
            type="email" 
            placeholder="Email Address" 
            required 
            className="form-input"
            onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase().trim()})} 
          />

          <input 
            type="password" 
            placeholder="Create Password" 
            required 
            className="form-input"
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
          />

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'Creating Account...' : 'Get Started'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Already a member? <Link to="/login" className="text-blue-600 font-bold hover:underline ml-1">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;