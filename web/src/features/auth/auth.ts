import axios from 'axios';

const api = axios.create({
  baseURL: 'https://queueease-backend-evab.onrender.com/api/v1', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor for JWT 
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // SDD: Bearer token format 
  }
  return config;
});

// Response Interceptor for Global Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns SDD-compliant error structure
    if (error.response && error.response.data && error.response.data.error) {
      const errData = error.response.data.error;
      // Formulate a clean error message combining validation details if present
      let finalMessage = errData.message || 'An error occurred';
      if (errData.details && typeof errData.details === 'object') {
        const detailsStr = Object.values(errData.details).join(', ');
        if (detailsStr) {
          finalMessage += `: ${detailsStr}`;
        }
      }
      return Promise.reject(new Error(finalMessage));
    }
    
    // Fallback for network errors or unhandled structures
    return Promise.reject(error);
  }
);

// Authentication Endpoints 
export const register = (data: any) => api.post('/auth/register', data);
export const login = (data: any) => api.post('/auth/login', data);

// Staff Registration (Restricted to ADMIN)
export const registerStaff = (data: any) => api.post('/auth/register/staff', data);

export default api;