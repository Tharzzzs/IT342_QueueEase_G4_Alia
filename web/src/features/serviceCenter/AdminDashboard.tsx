import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { subscribeToServiceCenters, subscribeToStaffCenter, type ServiceCenter } from './serviceCenter';
import { getTotalInQueue, getServedTodayCount, getWaitingCount } from '../queue/queue';

const AdminDashboard = () => {
  const role = localStorage.getItem('role');
  const email = localStorage.getItem('email') || '';
  const navigate = useNavigate();

  // Shared state
  const [loading, setLoading] = useState(true);

  // Admin state
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [activeCenters, setActiveCenters] = useState(0);
  const [peopleInQueue, setPeopleInQueue] = useState(0);
  const [servedToday, setServedToday] = useState(0);

  // Staff state
  const [assignedCenter, setAssignedCenter] = useState<ServiceCenter | null>(null);
  const [staffQueueCount, setStaffQueueCount] = useState(0);
  const [staffServedToday, setStaffServedToday] = useState(0);

  // Admin: load all metrics
  useEffect(() => {
    if (role !== 'ADMIN') return;

    const unsub = subscribeToServiceCenters((data) => {
      setCenters(data);
      setActiveCenters(data.filter((c) => c.isActive).length);
    });

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
    const interval = setInterval(loadMetrics, 30000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [role]);

  // Staff: load assigned center metrics
  useEffect(() => {
    if (role !== 'STAFF' || !email) return;

    const unsub = subscribeToStaffCenter(email, async (center) => {
      setAssignedCenter(center);
      if (center && center.id) {
        try {
          const count = await getWaitingCount(center.id);
          setStaffQueueCount(count);
          // Load served today for this center's queue
          const servedCount = await getServedTodayCount();
          setStaffServedToday(servedCount);
        } catch (err) {
          console.error('Failed to load staff metrics:', err);
        }
      }
      setLoading(false);
    });

    const interval = setInterval(async () => {
      if (assignedCenter?.id) {
        const count = await getWaitingCount(assignedCenter.id);
        setStaffQueueCount(count);
      }
    }, 30000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [role, email]);

  // ─── ADMIN DASHBOARD ─────────────────────────────
  if (role === 'ADMIN') {
    return (
      <div className="admin-layout">
        <Sidebar role={role} />
        <div className="admin-main">
          <header className="admin-header">
            <div>
              <h2 className="admin-page-title">Admin Dashboard</h2>
              <p className="admin-page-subtitle">System overview & staff management</p>
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
              <h3 className="section-title">Service Centers & Staff Assignments</h3>
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
                      <th>Assigned Staff</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centers.slice(0, 10).map((center) => (
                      <tr key={center.id}>
                        <td className="font-semibold">{center.name}</td>
                        <td>
                          <span className="category-pill">{center.category}</span>
                        </td>
                        <td>
                          {center.assignedStaffEmail ? (
                            <div className="staff-assignment-badge">
                              <span className="staff-dot staff-dot-assigned"></span>
                              <div>
                                <span className="staff-badge-name">{center.assignedStaffName || center.assignedStaffEmail}</span>
                                <span className="staff-badge-email">{center.assignedStaffEmail}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted staff-unassigned">No staff assigned</span>
                          )}
                        </td>
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
  }

  // ─── STAFF DASHBOARD ─────────────────────────────
  return (
    <div className="admin-layout">
      <Sidebar role={role} />
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <h2 className="admin-page-title">Staff Dashboard</h2>
            <p className="admin-page-subtitle">
              {assignedCenter ? `Assigned to: ${assignedCenter.name}` : 'Your workspace overview'}
            </p>
          </div>
          <div className="header-role-pill">
            Logged in as: <span className="header-role-value">{role}</span>
          </div>
        </header>

        {loading ? (
          <div className="empty-state">
            <p className="empty-state-icon">⏳</p>
            <p className="empty-state-text">Loading your dashboard...</p>
          </div>
        ) : !assignedCenter ? (
          <div className="access-denied-container">
            <div className="access-denied-icon">🔗</div>
            <h3 className="access-denied-title">No Service Center Assigned</h3>
            <p className="access-denied-text">
              You haven't been assigned to a service center yet.<br />
              Please contact your administrator to get assigned.
            </p>
          </div>
        ) : (
          <>
            {/* Staff Metrics */}
            <div className="metrics-grid">
              <div className="metric-card metric-blue">
                <div className="metric-icon">🏢</div>
                <div>
                  <p className="metric-label">Your Center</p>
                  <p className="metric-value" style={{ fontSize: '1.1rem' }}>{assignedCenter.name}</p>
                </div>
              </div>
              <div className="metric-card metric-amber">
                <div className="metric-icon">👥</div>
                <div>
                  <p className="metric-label">People Waiting</p>
                  <p className="metric-value">{staffQueueCount}</p>
                </div>
              </div>
              <div className="metric-card metric-green">
                <div className="metric-icon">✅</div>
                <div>
                  <p className="metric-label">Served Today</p>
                  <p className="metric-value">{staffServedToday}</p>
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <div className="dashboard-section">
              <div className="section-header">
                <h3 className="section-title">Quick Actions</h3>
              </div>
              <div className="staff-quick-actions">
                <button
                  onClick={() => navigate('/admin/queue-monitor')}
                  className="staff-action-card"
                >
                  <span className="staff-action-icon">📋</span>
                  <div>
                    <p className="staff-action-title">Open Queue Monitor</p>
                    <p className="staff-action-desc">Manage the queue for {assignedCenter.name}</p>
                  </div>
                  <span className="staff-action-arrow">→</span>
                </button>
              </div>
            </div>

            {/* Center Info */}
            <div className="dashboard-section">
              <div className="section-header">
                <h3 className="section-title">Center Details</h3>
              </div>
              <div className="staff-center-info-card">
                <div className="center-detail">
                  <span className="detail-label">📍 Address</span>
                  <span className="detail-value">{assignedCenter.address}</span>
                </div>
                <div className="center-detail">
                  <span className="detail-label">🕐 Hours</span>
                  <span className="detail-value">{assignedCenter.operatingHours}</span>
                </div>
                <div className="center-detail">
                  <span className="detail-label">👥 Max Capacity</span>
                  <span className="detail-value">{assignedCenter.maxCapacity}</span>
                </div>
                <div className="center-detail">
                  <span className="detail-label">📂 Category</span>
                  <span className="detail-value">{assignedCenter.category}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;