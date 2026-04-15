import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Toast, { useToast } from '../components/Toast';
import { subscribeToServiceCenters, type ServiceCenter } from '../api/serviceCenter';
import { subscribeToQueue, callNext, markServed, type QueueEntry } from '../api/queue';

const QueueMonitor = () => {
  const role = localStorage.getItem('role');
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [selectedCenterName, setSelectedCenterName] = useState('');
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  // Load service centers
  useEffect(() => {
    const unsub = subscribeToServiceCenters((data) => {
      setCenters(data.filter((c) => c.isActive));
    });
    return () => unsub();
  }, []);

  // Subscribe to queue when center is selected
  useEffect(() => {
    if (!selectedCenter) {
      setQueueEntries([]);
      return;
    }
    const unsub = subscribeToQueue(selectedCenter, (entries) => {
      // Show today's entries only
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filtered = entries.filter((e) => {
        if (!e.joinedAt) return true;
        const joinDate = e.joinedAt.toDate ? e.joinedAt.toDate() : new Date(e.joinedAt);
        return joinDate >= today;
      });
      setQueueEntries(filtered);
    });
    return () => unsub();
  }, [selectedCenter]);

  const handleSelectCenter = (center: ServiceCenter) => {
    setSelectedCenter(center.id!);
    setSelectedCenterName(center.name);
  };

  const handleCallNext = async () => {
    if (!selectedCenter) return;
    setLoading(true);
    try {
      const entry = await callNext(selectedCenter);
      if (entry) {
        addToast('success', `Now serving: ${entry.userName} (Queue #${entry.queueNumber})`);
      } else {
        addToast('info', 'No one is waiting in the queue.');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to call next.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkServed = async (entry: QueueEntry) => {
    try {
      await markServed(entry.id!);
      addToast('success', `${entry.userName} (Queue #${entry.queueNumber}) marked as served.`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to mark as served.');
    }
  };

  const waiting = queueEntries.filter((e) => e.status === 'WAITING');
  const serving = queueEntries.filter((e) => e.status === 'SERVING');
  const completed = queueEntries.filter((e) => e.status === 'COMPLETED');

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="admin-layout">
      <Sidebar role={role} />
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <h2 className="admin-page-title">Queue Monitor</h2>
            <p className="admin-page-subtitle">
              {selectedCenter ? `Monitoring: ${selectedCenterName}` : 'Select a service center to monitor'}
            </p>
          </div>
          {selectedCenter && (
            <button
              onClick={handleCallNext}
              disabled={loading || waiting.length === 0}
              className="btn-call-next"
            >
              {loading ? 'Calling...' : '📢 Call Next'}
            </button>
          )}
        </header>

        {/* Center Selection */}
        {!selectedCenter ? (
          <div className="center-select-grid">
            {centers.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-icon">🏢</p>
                <p className="empty-state-text">No active service centers.</p>
              </div>
            ) : (
              centers.map((center) => (
                <div
                  key={center.id}
                  onClick={() => handleSelectCenter(center)}
                  className="center-select-card"
                >
                  <div className="center-card-category">{center.category}</div>
                  <h3 className="center-card-name">{center.name}</h3>
                  <p className="center-card-desc">{center.address}</p>
                  <div className="center-select-footer">
                    <span>Click to monitor →</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            {/* Back Button */}
            <button
              onClick={() => { setSelectedCenter(null); setSelectedCenterName(''); }}
              className="btn-back"
            >
              ← Back to Centers
            </button>

            {/* Queue Stats */}
            <div className="queue-stats-row">
              <div className="queue-stat-card stat-waiting">
                <p className="stat-number">{waiting.length}</p>
                <p className="stat-label">Waiting</p>
              </div>
              <div className="queue-stat-card stat-serving">
                <p className="stat-number">{serving.length}</p>
                <p className="stat-label">Now Serving</p>
              </div>
              <div className="queue-stat-card stat-completed">
                <p className="stat-number">{completed.length}</p>
                <p className="stat-label">Completed</p>
              </div>
            </div>

            {/* Currently Serving */}
            {serving.length > 0 && (
              <div className="serving-section">
                <h3 className="section-title">🟢 Now Serving</h3>
                {serving.map((entry) => (
                  <div key={entry.id} className="serving-card">
                    <div className="serving-info">
                      <span className="serving-number">#{entry.queueNumber}</span>
                      <div>
                        <p className="serving-name">{entry.userName}</p>
                        <p className="serving-email">{entry.userEmail}</p>
                      </div>
                    </div>
                    <button onClick={() => handleMarkServed(entry)} className="btn-mark-served">
                      ✓ Mark Served
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Queue Table */}
            <div className="queue-table-wrapper">
              <h3 className="section-title">📋 Queue List</h3>
              {queueEntries.length === 0 ? (
                <div className="empty-state-sm">
                  <p>No queue entries for today.</p>
                </div>
              ) : (
                <table className="queue-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Joined At</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueEntries
                      .filter((e) => e.status !== 'CANCELLED')
                      .map((entry) => (
                      <tr key={entry.id} className={`queue-row queue-row-${entry.status.toLowerCase()}`}>
                        <td className="queue-number-cell">{entry.queueNumber}</td>
                        <td className="queue-name-cell">{entry.userName}</td>
                        <td className="queue-email-cell">{entry.userEmail}</td>
                        <td>{formatTime(entry.joinedAt)}</td>
                        <td>
                          <span className={`status-pill status-${entry.status.toLowerCase()}`}>
                            {entry.status}
                          </span>
                        </td>
                        <td>
                          {entry.status === 'SERVING' && (
                            <button onClick={() => handleMarkServed(entry)} className="btn-action btn-complete-sm">
                              Complete
                            </button>
                          )}
                          {entry.status === 'COMPLETED' && <span className="text-muted">Done</span>}
                          {entry.status === 'WAITING' && <span className="text-muted">Waiting...</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default QueueMonitor;
