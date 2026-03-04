import React, { useState } from 'react';
import { register } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Backend handles normalization and role assignment 
      await register(formData);
      alert("Registration Successful! Please log in.");
      navigate('/login');
    } catch (err: any) {
      // Specifically handles DB-002: Duplicate Email [cite: 268, 283]
      alert(err.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="auth-card">
        <h2 className="text-3xl font-extrabold text-blue-600 text-center mb-2">QueueEase</h2>
        <p className="text-center text-gray-500 mb-8">Create your account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="First Name" required className="form-input" 
                   onChange={(e) => setFormData({...formData, firstname: e.target.value})} />
            <input type="text" placeholder="Last Name" required className="form-input"
                   onChange={(e) => setFormData({...formData, lastname: e.target.value})} />
          </div>
          <input type="email" placeholder="Email" required className="form-input"
                 onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase().trim()})} />
          <input type="password" placeholder="Password" required className="form-input"
                 onChange={(e) => setFormData({...formData, password: e.target.value})} />
          <button type="submit" className="btn-primary">REGISTER</button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;