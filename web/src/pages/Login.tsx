import React, { useState } from 'react';
import { login } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { auth, googleProvider } from '../firebase'; // Import from step 2
import { signInWithPopup } from 'firebase/auth';

const Login = () => {
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(creds);
      
      localStorage.setItem('token', res.data.accessToken); 
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('email', res.data.email);

      if (res.data.role === 'ADMIN' || res.data.role === 'STAFF') {
        navigate('/admin/dashboard');
      } else {
        navigate('/customer/home');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Google OAuth Handler
  const handleGoogleLogin = async () => {
    try {
      // 1. Trigger Google Popup
      const result = await signInWithPopup(auth, googleProvider);
      
      // 2. Get the Firebase ID Token
      const idToken = await result.user.getIdToken();
      
      // 3. Send token to your Spring Boot backend for verification
      const res = await axios.post('http://localhost:8080/api/v1/auth/google', {
        token: idToken,
        email: result.user.email,
        firstname: result.user.displayName?.split(' ')[0] || '',
        lastname: result.user.displayName?.split(' ').slice(1).join(' ') || ''
      });

      // 4. Store your custom backend JWT and route the user
      localStorage.setItem('token', res.data.accessToken); 
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('email', res.data.email);

      if (res.data.role === 'ADMIN' || res.data.role === 'STAFF') {
        navigate('/admin/dashboard');
      } else {
        navigate('/customer/home');
      }
    } catch (err: any) {
      console.error("Google Login Error:", err);
      alert("Google sign-in failed. Please try again.");
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
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>
        
        <div className="relative my-6 flex items-center justify-center">
          <span className="absolute inset-x-0 h-px bg-gray-300"></span>
          <span className="relative px-4 bg-white text-sm text-gray-500">OR</span>
        </div>
        
        {/* NEW: Attached onClick handler to the Google button */}
        <button 
          type="button" 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
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