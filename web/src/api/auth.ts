import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// ADD THIS: Request Interceptor for JWT 
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // SDD: Bearer token format 
  }
  return config;
});

// Authentication Endpoints 
export const register = (data: any) => api.post('/auth/register', data);
export const login = (data: any) => api.post('/auth/login', data);

// Staff Registration (Restricted to ADMIN)
export const registerStaff = (data: any) => api.post('/auth/register/staff', data);

export default api;