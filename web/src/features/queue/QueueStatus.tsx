import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ClipboardList, X } from 'lucide-react';
import Toast, { useToast } from '../../components/Toast';
import Sidebar from '../../components/Sidebar';
import { subscribeToUserQueueWithPosition, leaveQueue, type QueueEntry } from './queue';

const QueueStatus = () => {
  const email = localStorage.getItem('email') || '';
  const navigate = useNavigate();
  const [queueEntry, setQueueEntry] = useState<QueueEntry | null>(null);
  const [position, setPosition] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (!email) return;
    const unsub = subscribeToUserQueueWithPosition(email, (entry, pos, total) => {
      setQueueEntry(entry);
      setPosition(pos);
      setTotalActive(total);
      setLoading(false);
    });
    return () => unsub();
  }, [email]);

  const confirmLeaveQueue = async () => {
    if (!queueEntry?.id) return;
    setShowLeaveModal(false);
    setLeaving(true);
    try {
      await leaveQueue(queueEntry.id);
      addToast('success', 'You have left the queue.');
      setTimeout(() => navigate('/customer/home'), 1500);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to leave queue.');
    } finally {
      setLeaving(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };



  if (loading) {
    return (
      <div className="queue-status-page">
        <div className="queue-status-loading">
          <div className="spinner"></div>
          <p>Loading your queue status...</p>
        </div>
      </div>
    );
  }

  if (!queueEntry) {
    return (
      <div className="admin-layout">
        <Sidebar role="USER" />
        <div className="admin-main">
        <div className="queue-status-empty">
          <div className="empty-queue-icon"><ClipboardList size={44} /></div>
          <h2>No Active Queue</h2>
          <p>You are not currently in any queue.</p>
          <button onClick={() => navigate('/customer/home')} className="btn-primary-sm">
            Browse Service Centers
          </button>
        </div>
        <Toast toasts={toasts} removeToast={removeToast} />
        </div>
      </div>
    );
  }

  const isServing = queueEntry.status === 'SERVING';

  return (
    <div className="admin-layout">
      <Sidebar role="USER" />
      <div className="admin-main">

      <div className="queue-status-container">
        <div className={`queue-status-hero ${isServing ? 'hero-serving' : 'hero-waiting'}`}>
          <div className="hero-badge">
            {isServing ? 'Now Serving' : 'In Queue'}
          </div>
          <div className="hero-number">#{position || queueEntry.queueNumber}</div>
          <p className="hero-center">{queueEntry.serviceCenterName}</p>
        </div>

        <div className="queue-details-card">
          <div className="queue-detail-row">
            <span className="queue-detail-label">Status</span>
            <span className={`status-pill status-${queueEntry.status.toLowerCase()}`}>
              {queueEntry.status}
            </span>
          </div>
          <div className="queue-detail-row">
            <span className="queue-detail-label">Queue Number</span>
            <span className="queue-detail-value">#{position || queueEntry.queueNumber}</span>
          </div>
          {queueEntry.status === 'WAITING' && totalActive > 0 && (
            <div className="queue-detail-row">
              <span className="queue-detail-label">Position in Queue</span>
              <span className="queue-detail-value">{position} of {totalActive}</span>
            </div>
          )}
          <div className="queue-detail-row">
            <span className="queue-detail-label">Service Center</span>
            <span className="queue-detail-value">{queueEntry.serviceCenterName}</span>
          </div>
          <div className="queue-detail-row">
            <span className="queue-detail-label">Joined At</span>
            <span className="queue-detail-value">{formatTime(queueEntry.joinedAt)}</span>
          </div>
          {queueEntry.servedAt && (
            <div className="queue-detail-row">
              <span className="queue-detail-label">Serving Since</span>
              <span className="queue-detail-value">{formatTime(queueEntry.servedAt)}</span>
            </div>
          )}
        </div>

        {isServing ? (
          <div className="queue-info-banner serving-banner">
            <span className="banner-icon"><ClipboardList size={22} /></span>
            <div>
              <p className="banner-title">It's your turn</p>
              <p className="banner-text">Please proceed to the service counter.</p>
            </div>
          </div>
        ) : (
          <div className="queue-info-banner waiting-banner">
            <span className="banner-icon"><Clock size={22} /></span>
            <div>
              <p className="banner-title">Please wait</p>
              <p className="banner-text">This page updates automatically. You'll be notified when it's your turn.</p>
            </div>
          </div>
        )}

        {!isServing && (
          <button onClick={() => setShowLeaveModal(true)} disabled={leaving} className="btn-leave-queue">
            {leaving ? 'Leaving...' : <><X size={16} /> Leave Queue</>}
          </button>
        )}

        <button onClick={() => navigate('/customer/home')} className="btn-secondary btn-full">
          <ArrowLeft size={16} /> Back to Home
        </button>
      </div>

      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Confirm Leave</h3>
            <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>Are you sure you want to leave the queue?</p>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowLeaveModal(false)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={confirmLeaveQueue} className="btn-primary-sm" style={{ backgroundColor: '#ef4444' }}>Leave Queue</button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
};

export default QueueStatus;
