import React, { useState } from 'react';
import { login } from './auth';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../firebase';

const Login = () => {
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(creds);
      if (res.data.firebaseToken) {
        await signInWithCustomToken(auth, res.data.firebaseToken);
      }
      saveSession(res.data);
      handleNavigation(res.data.role);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:8081/api/v1/auth/google', {
        token: credentialResponse.credential
      });
      if (res.data.firebaseToken) {
        await signInWithCustomToken(auth, res.data.firebaseToken);
      }
      saveSession(res.data);
      handleNavigation(res.data.role);
    } catch (err: any) {
      alert('Google Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const saveSession = (data: any) => {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('role', data.role);
    localStorage.setItem('email', data.email);
    if (data.firstname && data.lastname) {
      localStorage.setItem('userName', `${data.firstname} ${data.lastname}`);
    } else if (data.name) {
      localStorage.setItem('userName', data.name);
    }
  };

  const handleNavigation = (role: string) => {
    if (role === 'USER') navigate('/customer/home');
    else if (role === 'ADMIN' || role === 'STAFF') navigate('/admin/dashboard');
    else navigate('/customer/home');
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="text-center mb-10">
          <div className="auth-logo">
            <span className="text-4xl text-white font-black tracking-tighter">Q</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="text-gray-500 mt-2 font-medium">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
            <input
              type="email"
              placeholder="name@company.com"
              required
              className="form-input"
              onChange={(e) => setCreds({ ...creds, email: e.target.value.toLowerCase().trim() })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
              <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">Forgot?</a>
            </div>
            <input
              type="password"
              placeholder="Password"
              required
              className="form-input"
              onChange={(e) => setCreds({ ...creds, password: e.target.value })}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary !mt-8">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="social-divider">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative"><span className="px-4 text-[11px] text-gray-400 font-black uppercase tracking-[0.2em] bg-white/0">Social Login</span></div>
        </div>

        <div className="flex justify-center w-full">
          <div className="w-full overflow-hidden rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert('Google Login Failed')}
              theme="outline"
              size="large"
              width="1000px"
              shape="rectangular"
              text="continue_with"
            />
          </div>
        </div>

        <p className="mt-10 text-center text-[15px] text-gray-500 font-medium">
          Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:underline decoration-2 underline-offset-4 ml-1">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
