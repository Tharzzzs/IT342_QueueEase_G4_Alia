import React, { useState } from 'react';
import { login } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [creds, setCreds] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login(creds);
      
      // Store essential data as per SDD requirements [cite: 37, 109, 326]
      localStorage.setItem('token', res.data.accessToken); 
      localStorage.setItem('role', res.data.role); // Store the role (ADMIN, STAFF, USER)
      localStorage.setItem('email', res.data.email);

      // Role-based redirection logic [cite: 30, 116]
      if (res.data.role === 'ADMIN' || res.data.role === 'STAFF') {
        navigate('/admin/dashboard');
      } else {
        navigate('/customer/home');
      }
    } catch (err: any) {
      // Handles AUTH-001 error code defined in SDD [cite: 272, 276]
      alert(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="auth-card">
        <h2 className="text-3xl font-extrabold text-blue-600 text-center mb-2">QueueEase</h2>
        <p className="text-center text-gray-500 mb-8">Welcome back</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" required className="form-input"
                 onChange={(e) => setCreds({...creds, email: e.target.value.toLowerCase().trim()})} />
          <input type="password" placeholder="Password" required className="form-input"
                 onChange={(e) => setCreds({...creds, password: e.target.value})} />
          <button type="submit" className="btn-primary">LOGIN</button>
        </form>
        
        {/* Google OAuth Option as per Mobile Wireframes [cite: 373, 381] */}
        <div className="relative my-6 flex items-center justify-center">
          <span className="absolute inset-x-0 h-px bg-gray-300"></span>
          <span className="relative px-4 bg-white text-sm text-gray-500">OR</span>
        </div>
        <button className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
          Continue with Google
        </button>
        
        <p className="mt-6 text-center text-sm text-gray-600">
          New here? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;