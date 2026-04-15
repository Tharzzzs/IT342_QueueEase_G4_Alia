import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  role: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItem = (label: string, path: string, icon: string) => (
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
      <div className="sidebar-brand" onClick={() => navigate('/admin/dashboard')}>
        <div className="sidebar-logo">Q</div>
        <h1 className="sidebar-title">QueueEase</h1>
      </div>

      <nav className="sidebar-nav">
        {navItem('Dashboard', '/admin/dashboard', '📊')}
        {navItem('Service Centers', '/admin/service-centers', '🏢')}
        {navItem('Queue Monitor', '/admin/queue-monitor', '📋')}

        {role === 'ADMIN' && (
          <div className="sidebar-section">
            <p className="sidebar-section-title">Administration</p>
            {navItem('Register Staff', '/admin/register-staff', '👤')}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-role-badge">
          <span className="sidebar-role-dot"></span>
          {role}
        </div>
        <button onClick={handleLogout} className="sidebar-logout">
          <span>↩</span> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
