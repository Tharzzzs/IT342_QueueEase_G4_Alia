import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CustomerHome from './pages/CustomerHome';
import RegisterStaff from './pages/RegisterStaff';
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
    // SDD: AC-3 Role-Based Access Enforcement [cite: 153, 156]
    return <Navigate to={userRole === 'USER' ? "/customer/home" : "/admin/dashboard"} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin/Staff Dashboard - SDD Phase 3 [cite: 502, 503] */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Customer Home - SDD Journey 1 [cite: 70, 71] */}
        <Route path="/customer/home" element={
          <ProtectedRoute allowedRoles={['USER']}>
            <CustomerHome />
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
  );
}

export default App;