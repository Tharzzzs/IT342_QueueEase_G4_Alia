import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast, { useToast } from '../components/Toast';
import { subscribeToServiceCenters, type ServiceCenter } from '../api/serviceCenter';
import { joinQueue, getUserActiveQueue, getWaitingCount } from '../api/queue';

const CustomerHome = () => {
  const email = localStorage.getItem('email') || '';
  const userId = localStorage.getItem('userId') || email;
  const navigate = useNavigate();
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [waitCounts, setWaitCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [joining, setJoining] = useState<string | null>(null);
  const [hasActiveQueue, setHasActiveQueue] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const unsub = subscribeToServiceCenters((data) => {
      const active = data.filter((c) => c.isActive);
      setCenters(active);
      // Load wait counts for each center
      active.forEach(async (center) => {
        if (center.id) {
          const count = await getWaitingCount(center.id);
          setWaitCounts((prev) => ({ ...prev, [center.id!]: count }));
        }
      });
    });
    return () => unsub();
  }, []);

  // Check if user already has an active queue
  useEffect(() => {
    const checkActive = async () => {
      const existing = await getUserActiveQueue(email);
      setHasActiveQueue(!!existing);
    };
    checkActive();
  }, [email]);

  const handleJoinQueue = async (center: ServiceCenter) => {
    if (hasActiveQueue) {
      addToast('error', 'You are already in a queue. Check your queue status or leave your current queue first.');
      return;
    }
    setJoining(center.id!);
    try {
      const result = await joinQueue(
        center.id!,
        center.name,
        userId,
        email,
        email.split('@')[0] // Use email prefix as display name
      );
      addToast('success', `You joined the queue for ${center.name}! Queue number: #${result.queueNumber}`);
      setHasActiveQueue(true);
      // Navigate to queue status after a moment
      setTimeout(() => navigate('/customer/queue-status'), 1500);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to join queue.');
    } finally {
      setJoining(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const filtered = centers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="customer-page">
      {/* Header */}
      <header className="customer-header">
        <h1 className="customer-brand" onClick={() => navigate('/customer/home')}>QueueEase</h1>
        <div className="customer-header-right">
          {hasActiveQueue && (
            <button onClick={() => navigate('/customer/queue-status')} className="btn-queue-status">
              📋 My Queue
            </button>
          )}
          <span className="customer-email">{email}</span>
          <button onClick={handleLogout} className="customer-logout">Logout</button>
        </div>
      </header>

      <div className="customer-container">
        {/* Hero Section */}
        <div className="customer-hero">
          <h2 className="customer-hero-title">Find Services Near You</h2>
          <p className="customer-hero-subtitle">Join a queue remotely and save your time</p>
        </div>

        {/* Search */}
        <div className="search-bar-wrapper customer-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search clinics, offices, banks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Active Queue Banner */}
        {hasActiveQueue && (
          <div className="active-queue-banner" onClick={() => navigate('/customer/queue-status')}>
            <span className="banner-icon">📋</span>
            <div>
              <p className="banner-title">You have an active queue</p>
              <p className="banner-text">Tap here to view your queue status</p>
            </div>
            <span className="banner-arrow">→</span>
          </div>
        )}

        {/* Service Centers List */}
        <h3 className="customer-section-title">Available Service Centers</h3>
        <div className="customer-centers-list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-icon">🏢</p>
              <p className="empty-state-text">No service centers available.</p>
            </div>
          ) : (
            filtered.map((center) => (
              <div key={center.id} className="customer-center-card">
                <div className="customer-center-info">
                  <div className="customer-center-top">
                    <span className="center-card-category">{center.category}</span>
                    <span className="queue-count-badge">
                      {waitCounts[center.id!] || 0} in queue
                    </span>
                  </div>
                  <h4 className="customer-center-name">{center.name}</h4>
                  {center.description && (
                    <p className="customer-center-desc">{center.description}</p>
                  )}
                  <div className="customer-center-meta">
                    <span>📍 {center.address}</span>
                    <span>🕐 {center.operatingHours}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinQueue(center)}
                  disabled={joining === center.id || hasActiveQueue}
                  className="btn-join-queue"
                >
                  {joining === center.id ? 'Joining...' : hasActiveQueue ? 'Already Queued' : 'Join Queue'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default CustomerHome;