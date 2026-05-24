import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google'; // 1. Import the provider
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import AdminDashboard from './features/serviceCenter/AdminDashboard';
import CustomerHome from './features/queue/CustomerHome';
import RegisterStaff from './features/auth/RegisterStaff';
import ServiceCenters from './features/serviceCenter/ServiceCenters';
import QueueMonitor from './features/queue/QueueMonitor';
import QueueStatus from './features/queue/QueueStatus';
import QueueHistory from './features/queue/QueueHistory';
import QueueNotificationListener from './components/QueueNotificationListener';


// Role-Based Guard Interface
interface Props {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(userRole || "")) {
    return <Navigate to={userRole === 'USER' ? "/customer/home" : "/admin/dashboard"} replace />;
  }

  return <>{children}</>;
};

function App() {
  // 2. Wrap everything in the GoogleOAuthProvider
  return (
    <GoogleOAuthProvider clientId="770395482652-o453hvr1sqlgfaqvedl5vj07tfkehf6f.apps.googleusercontent.com">
      <BrowserRouter>
        <QueueNotificationListener />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin/Staff Dashboard */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Service Centers Management (Admin Only) */}
          <Route path="/admin/service-centers" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ServiceCenters />
            </ProtectedRoute>
          } />

          {/* Queue Monitor (Staff Only) */}
          <Route path="/admin/queue-monitor" element={
            <ProtectedRoute allowedRoles={['STAFF']}>
              <QueueMonitor />
            </ProtectedRoute>
          } />

          {/* Customer Home */}
          <Route path="/customer/home" element={
            <ProtectedRoute allowedRoles={['USER']}>
              <CustomerHome />
            </ProtectedRoute>
          } />

          {/* Customer Queue Status */}
          <Route path="/customer/queue-status" element={
            <ProtectedRoute allowedRoles={['USER']}>
              <QueueStatus />
            </ProtectedRoute>
          } />

          {/* Customer Queue History */}
          <Route path="/customer/history" element={
            <ProtectedRoute allowedRoles={['USER']}>
              <QueueHistory />
            </ProtectedRoute>
          } />

          <Route path="/admin/register-staff" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <RegisterStaff />
            </ProtectedRoute>
          } />



          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;