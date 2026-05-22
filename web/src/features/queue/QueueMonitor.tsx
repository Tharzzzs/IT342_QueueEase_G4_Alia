import { useEffect, useState } from 'react';
import { Check, Clock, Link2, Megaphone } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Toast, { useToast } from '../../components/Toast';
import { subscribeToStaffCenter, type ServiceCenter } from '../serviceCenter/serviceCenter';
import { subscribeToQueue, callNext, markServed, getCenterQueueHistory, type QueueEntry } from './queue';

const QueueMonitor = () => {
  const role = localStorage.getItem('role');
  const email = localStorage.getItem('email') || '';
  const [assignedCenter, setAssignedCenter] = useState<ServiceCenter | null>(null);
  const [centerLoading, setCenterLoading] = useState(true);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [positionMap, setPositionMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [historyEntries, setHistoryEntries] = useState<QueueEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (!email) {
      setCenterLoading(false);
      return;
    }
    const unsub = subscribeToStaffCenter(email, (center) => {
      setAssignedCenter(center);
      setCenterLoading(false);
    });
    return () => unsub();
  }, [email]);

  useEffect(() => {
    if (!assignedCenter?.id) {
      setQueueEntries([]);
      return;
    }
    const unsub = subscribeToQueue(assignedCenter.id, (entries, positions) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filtered = entries.filter((e) => {
        if (!e.joinedAt) return true;
        const joinDate = e.joinedAt.toDate ? e.joinedAt.toDate() : new Date(e.joinedAt);
        return joinDate >= today;
      });
      setQueueEntries(filtered);
      setPositionMap(positions);
    });
    return () => unsub();
  }, [assignedCenter]);

  useEffect(() => {
    if (activeTab === 'history' && assignedCenter?.id) {
      setHistoryLoading(true);
      getCenterQueueHistory(assignedCenter.id).then(data => {
        setHistoryEntries(data);
        setHistoryLoading(false);
      });
    }
  }, [activeTab, assignedCenter]);

  const handleCallNext = async () => {
    if (!assignedCenter?.id) return;
    setLoading(true);
    try {
      const entry = await callNext(assignedCenter.id);
      if (entry) {
        addToast('success', `Now serving: ${entry.userName}`);
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
      addToast('success', `${entry.userName} marked as served.`);
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

  if (centerLoading) {
    return (
      <div className="admin-layout">
        <Sidebar role={role} />
        <div className="admin-main">
          <div className="empty-state">
            <div className="empty-state-icon"><Clock size={36} /></div>
            <p className="empty-state-text">Loading your assigned center...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!assignedCenter) {
    return (
      <div className="admin-layout">
        <Sidebar role={role} />
        <div className="admin-main">
          <header className="admin-header">
            <div>
              <h2 className="admin-page-title">Queue Monitor</h2>
              <p className="admin-page-subtitle">Monitor and manage your service center's queue</p>
            </div>
          </header>
          <div className="access-denied-container">
            <div className="access-denied-icon"><Link2 size={48} /></div>
            <h3 className="access-denied-title">No Service Center Assigned</h3>
            <p className="access-denied-text">
              You haven't been assigned to a service center yet.<br />
              Please contact your administrator to get assigned to a center.
            </p>
          </div>
        </div>
        <Toast toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <Sidebar role={role} />
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <h2 className="admin-page-title">Queue Monitor</h2>
            <p className="admin-page-subtitle">Monitoring: {assignedCenter.name}</p>
          </div>
          <button onClick={handleCallNext} disabled={loading || waiting.length === 0} className="btn-call-next">
            {loading ? 'Calling...' : <><Megaphone size={17} /> Call Next</>}
          </button>
        </header>

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

        <div className="customer-tabs" style={{ marginTop: '2rem' }}>
          <button className={`tab-btn ${activeTab === 'live' ? 'tab-active' : ''}`} onClick={() => setActiveTab('live')}>
            Live Queue
          </button>
          <button className={`tab-btn ${activeTab === 'history' ? 'tab-active' : ''}`} onClick={() => setActiveTab('history')}>
            Transaction History (Today)
          </button>
        </div>

        {activeTab === 'live' ? (
          <>
            {serving.length > 0 && (
              <div className="serving-section">
                <h3 className="section-title">Now Serving</h3>
                {serving.map((entry) => (
                  <div key={entry.id} className="serving-card">
                    <div className="serving-info">
                      <span className="serving-number">#{positionMap.get(entry.id!) || entry.queueNumber}</span>
                      <div>
                        <p className="serving-name">{entry.userName}</p>
                        <p className="serving-email">{entry.userEmail}</p>
                      </div>
                    </div>
                    <button onClick={() => handleMarkServed(entry)} className="btn-mark-served">
                      <Check size={16} /> Mark Served
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="queue-table-wrapper">
              <h3 className="section-title">Queue List</h3>
              {queueEntries.length === 0 ? (
                <div className="empty-state-sm"><p>No queue entries for today.</p></div>
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
                    {queueEntries.filter((e) => e.status !== 'CANCELLED').map((entry) => (
                      <tr key={entry.id} className={`queue-row queue-row-${entry.status.toLowerCase()}`}>
                        <td className="queue-number-cell">{positionMap.get(entry.id!) || entry.queueNumber}</td>
                        <td className="queue-name-cell">{entry.userName}</td>
                        <td className="queue-email-cell">{entry.userEmail}</td>
                        <td>{formatTime(entry.joinedAt)}</td>
                        <td><span className={`status-pill status-${entry.status.toLowerCase()}`}>{entry.status}</span></td>
                        <td>
                          {entry.status === 'SERVING' && (
                            <button onClick={() => handleMarkServed(entry)} className="btn-action btn-complete-sm">Complete</button>
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
        ) : (
          <div className="queue-table-wrapper">
            <h3 className="section-title">Transaction History</h3>
            {historyLoading ? (
              <div className="empty-state-sm"><div className="spinner" style={{ margin: '0 auto' }}></div></div>
            ) : historyEntries.length === 0 ? (
              <div className="empty-state-sm"><p>No historical transactions found for today.</p></div>
            ) : (
              <table className="queue-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Queue #</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyEntries.map((entry) => (
                    <tr key={entry.id} className="queue-row">
                      <td>{formatTime(entry.completedAt || entry.joinedAt)}</td>
                      <td className="queue-name-cell">{entry.userName}</td>
                      <td className="queue-email-cell">{entry.userEmail}</td>
                      <td className="queue-number-cell">#{entry.queueNumber}</td>
                      <td><span className={`status-pill status-${entry.status.toLowerCase()}`}>{entry.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default QueueMonitor;
