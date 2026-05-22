import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Building2, ClipboardList, LogOut, UserPlus } from 'lucide-react';

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
      <div className="sidebar-brand" onClick={() => navigate('/admin/dashboard')}>
        <div className="sidebar-logo">Q</div>
        <h1 className="sidebar-title">QueueEase</h1>
      </div>

      <nav className="sidebar-nav">
        {navItem('Dashboard', '/admin/dashboard', <BarChart3 size={18} />)}

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
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-role-badge">
          <span className="sidebar-role-dot"></span>
          {role}
        </div>
        <button onClick={() => navigate('/profile')} className="sidebar-logout" style={{ marginBottom: '10px' }}>
          <ClipboardList size={16} /> Profile
        </button>
        <button onClick={handleLogout} className="sidebar-logout">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
