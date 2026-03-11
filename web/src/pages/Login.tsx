import React, { useState } from 'react';
import { login } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [creds, setCreds] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await login(creds);
            saveSession(res.data);
            handleNavigation(res.data.role);
        } catch (err: any) {
            alert(err.response?.data?.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            setLoading(true);
            const res = await axios.post('http://localhost:8080/api/v1/auth/google', {
                token: credentialResponse.credential 
            });
            saveSession(res.data);
            handleNavigation(res.data.role);
        } catch (err: any) {
            alert("Google Authentication failed.");
        } finally {
            setLoading(false);
        }
    };

    const saveSession = (data: any) => {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('role', data.role);
        localStorage.setItem('email', data.email);
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
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
                        <span className="text-2xl text-white font-black">Q</span>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h2>
                    <p className="text-gray-500 mt-2 font-medium">Log in to your QueueEase account</p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        required 
                        className="form-input"
                        onChange={(e) => setCreds({...creds, email: e.target.value.toLowerCase().trim()})} 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        required 
                        className="form-input"
                        onChange={(e) => setCreds({...creds, password: e.target.value})} 
                    />
                    
                    <button type="submit" disabled={loading} className="btn-primary mt-2 flex justify-center items-center">
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                
                <div className="social-divider">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                    <div className="relative"><span className="px-4 bg-white text-xs text-gray-400 font-bold uppercase tracking-widest">or</span></div>
                </div>
                
                <div className="flex justify-center w-full overflow-hidden rounded-xl">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => alert("Google Login Failed")}
                        theme="outline"
                        width="320"
                        shape="rectangular"
                        text="continue_with"
                    />
                </div>
                
                <p className="mt-8 text-center text-sm text-gray-500">
                    Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:underline ml-1">Register for free</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;