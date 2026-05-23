import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { getUserQueueHistory, type QueueEntry } from './queue';

const QueueHistory = () => {
  const email = localStorage.getItem('email') || '';
  const navigate = useNavigate();
  const [history, setHistory] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      navigate('/login');
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      const data = await getUserQueueHistory(email);
      setHistory(data);
      setLoading(false);
    };

    fetchHistory();
  }, [email, navigate]);



  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-layout">
      <Sidebar role="USER" />
      <div className="admin-main">

      <div className="customer-container">
        <div className="flex justify-between items-center mb-6">
          <h2 className="customer-section-title mb-0">Transaction History</h2>
          <button onClick={() => navigate('/customer/home')} className="btn-secondary btn-sm">
            <ArrowLeft size={16} /> Back to Home
          </button>
        </div>

        {loading ? (
          <div className="queue-status-loading" style={{ height: '300px' }}>
            <div className="spinner"></div>
            <p>Loading your history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ClipboardList size={36} /></div>
            <p className="empty-state-text">No past transactions found.</p>
          </div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Service Center</th>
                  <th>Queue #</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="font-semibold">{formatDateTime(entry.joinedAt)}</div>
                      {entry.completedAt && (
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Ended: {formatDateTime(entry.completedAt)}
                        </div>
                      )}
                    </td>
                    <td className="font-semibold">{entry.serviceCenterName}</td>
                    <td>#{entry.queueNumber}</td>
                    <td>
                      <span className={`status-pill status-${entry.status.toLowerCase()}`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default QueueHistory;
