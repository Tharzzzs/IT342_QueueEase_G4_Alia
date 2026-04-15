import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { subscribeToServiceCenters, type ServiceCenter } from '../api/serviceCenter';
import { getTotalInQueue, getServedTodayCount } from '../api/queue';

const AdminDashboard = () => {
  const role = localStorage.getItem('role');
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [activeCenters, setActiveCenters] = useState(0);
  const [peopleInQueue, setPeopleInQueue] = useState(0);
  const [servedToday, setServedToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to service centers
    const unsub = subscribeToServiceCenters((data) => {
      setCenters(data);
      setActiveCenters(data.filter((c) => c.isActive).length);
    });

    // Load queue metrics
    const loadMetrics = async () => {
      try {
        const [queueCount, servedCount] = await Promise.all([
          getTotalInQueue(),
          getServedTodayCount(),
        ]);
        setPeopleInQueue(queueCount);
        setServedToday(servedCount);
      } catch (err) {
        console.error('Failed to load metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="admin-layout">
      <Sidebar role={role} />

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <h2 className="admin-page-title">Dashboard Overview</h2>
            <p className="admin-page-subtitle">Real-time system metrics</p>
          </div>
          <div className="header-role-pill">
            Logged in as: <span className="header-role-value">{role}</span>
          </div>
        </header>

        {/* Metric Cards */}
        <div className="metrics-grid">
          <div className="metric-card metric-blue">
            <div className="metric-icon">🏢</div>
            <div>
              <p className="metric-label">Active Centers</p>
              <p className="metric-value">{loading ? '...' : activeCenters}</p>
            </div>
          </div>
          <div className="metric-card metric-amber">
            <div className="metric-icon">👥</div>
            <div>
              <p className="metric-label">People in Queue</p>
              <p className="metric-value">{loading ? '...' : peopleInQueue}</p>
            </div>
          </div>
          <div className="metric-card metric-green">
            <div className="metric-icon">✅</div>
            <div>
              <p className="metric-label">Served Today</p>
              <p className="metric-value">{loading ? '...' : servedToday}</p>
            </div>
          </div>
          <div className="metric-card metric-purple">
            <div className="metric-icon">📊</div>
            <div>
              <p className="metric-label">Total Centers</p>
              <p className="metric-value">{loading ? '...' : centers.length}</p>
            </div>
          </div>
        </div>

        {/* Service Centers Overview */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">Service Centers</h3>
          </div>
          <div className="dashboard-table-wrap">
            {centers.length === 0 ? (
              <div className="empty-state-sm">
                <p>No service centers yet. Create one to get started.</p>
              </div>
            ) : (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Address</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {centers.slice(0, 5).map((center) => (
                    <tr key={center.id}>
                      <td className="font-semibold">{center.name}</td>
                      <td>
                        <span className="category-pill">{center.category}</span>
                      </td>
                      <td className="text-muted">{center.address}</td>
                      <td className="text-muted">{center.operatingHours}</td>
                      <td>
                        <span className={`status-badge ${center.isActive ? 'status-active' : 'status-inactive'}`}>
                          {center.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;