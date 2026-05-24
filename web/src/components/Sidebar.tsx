import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Building2, ClipboardList, LogOut, UserPlus, Home, History } from 'lucide-react';
import ProfileModal from '../features/profile/ProfileModal';

interface SidebarProps {
  role: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const confirmLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItem = (label: string, path: string, icon: React.ReactNode) => (
    <div
      key={path}
      onClick={() => navigate(path)}
      className={`sidebar-nav-item ${isActive(path) ? 'sidebar-nav-active' : ''}`}
    >
      <span className="sidebar-nav-icon">{icon}</span>
      {label}
    </div>
  );

  return (
    <div className="sidebar">
      <div className="sidebar-brand" onClick={() => navigate(role === 'USER' ? '/customer/home' : '/admin/dashboard')}>
        <div className="sidebar-logo">Q</div>
        <h1 className="sidebar-title">QueueEase</h1>
      </div>

      <nav className="sidebar-nav">
        {role !== 'USER' && navItem('Dashboard', '/admin/dashboard', <BarChart3 size={18} />)}

        {role === 'ADMIN' && (
          <>
            {navItem('Service Centers', '/admin/service-centers', <Building2 size={18} />)}
            <div className="sidebar-section">
              <p className="sidebar-section-title">Administration</p>
              {navItem('Register Staff', '/admin/register-staff', <UserPlus size={18} />)}
            </div>
          </>
        )}

        {role === 'STAFF' && (
          <>
            {navItem('Queue Monitor', '/admin/queue-monitor', <ClipboardList size={18} />)}
          </>
        )}

        {role === 'USER' && (
          <>
            {navItem('Home', '/customer/home', <Home size={18} />)}
            {navItem('My Queue', '/customer/queue-status', <ClipboardList size={18} />)}
            {navItem('History', '/customer/history', <History size={18} />)}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-role-badge">
          <span className="sidebar-role-dot"></span>
          {role}
        </div>
        <button onClick={() => setShowProfileModal(true)} className="sidebar-logout" style={{ marginBottom: '10px' }}>
          <ClipboardList size={16} /> Profile
        </button>
        <button onClick={() => setShowLogoutModal(true)} className="sidebar-logout">
          <LogOut size={16} /> Logout
        </button>
      </div>

      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Confirm Logout</h3>
            <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>Are you sure you want to log out of your account?</p>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowLogoutModal(false)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={confirmLogout} className="btn-primary-sm" style={{ backgroundColor: '#ef4444' }}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
};

export default Sidebar;
