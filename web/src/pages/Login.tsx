import React, { useState } from 'react';
import { login } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase';

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
            alert(err.response?.data?.message || err.message || "Invalid credentials");
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
            if (res.data.firebaseToken) {
                await signInWithCustomToken(auth, res.data.firebaseToken);
            }
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
            {/* Ambient Background Blobs */}
            <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-indigo-400/20 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="auth-card">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl mb-6 shadow-2xl shadow-blue-500/40 transform -rotate-3">
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
                            onChange={(e) => setCreds({...creds, email: e.target.value.toLowerCase().trim()})} 
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
                            <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">Forgot?</a>
                        </div>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            required 
                            className="form-input"
                            onChange={(e) => setCreds({...creds, password: e.target.value})} 
                        />
                    </div>
                    
                    <button type="submit" disabled={loading} className="btn-primary !mt-8">
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing in...
                            </span>
                        ) : 'Sign In'}
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
                            onError={() => alert("Google Login Failed")}
                            theme="outline"
                            size="large"
                            width="1000px" // Forces full width
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