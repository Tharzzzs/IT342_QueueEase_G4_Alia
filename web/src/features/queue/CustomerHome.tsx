import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Clock, ClipboardList, MapPin, Search, Star } from 'lucide-react';
import Toast, { useToast } from '../../components/Toast';
import Sidebar from '../../components/Sidebar';
import { subscribeToServiceCenters, toggleFavoriteCenter, subscribeToFavorites, type ServiceCenter } from '../serviceCenter/serviceCenter';
import { joinQueue, getUserActiveQueue, getWaitingCount } from './queue';

const CustomerHome = () => {
  const email = localStorage.getItem('email') || '';
  const userId = localStorage.getItem('userId') || email;
  const navigate = useNavigate();
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [waitCounts, setWaitCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [joining, setJoining] = useState<string | null>(null);
  const [hasActiveQueue, setHasActiveQueue] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'favorites'>('all');
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const unsub = subscribeToServiceCenters((data) => {
      const active = data.filter((c) => c.isActive);
      setCenters(active);
      active.forEach(async (center) => {
        if (center.id) {
          const count = await getWaitingCount(center.id);
          setWaitCounts((prev) => ({ ...prev, [center.id!]: count }));
        }
      });
    });

    const unsubFavs = subscribeToFavorites(email, (ids) => {
      setFavoriteIds(ids);
    });

    return () => {
      unsub();
      unsubFavs();
    };
  }, [email]);

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
        email.split('@')[0]
      );
      addToast('success', `You joined the queue for ${center.name}. Queue number: #${result.queueNumber}`);
      setHasActiveQueue(true);
      setTimeout(() => navigate('/customer/queue-status'), 1500);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to join queue.');
    } finally {
      setJoining(null);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, centerId: string) => {
    e.stopPropagation();
    const isFav = favoriteIds.includes(centerId);
    try {
      await toggleFavoriteCenter(email, centerId, isFav);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update favorites.');
    }
  };



  const filtered = centers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = filterTab === 'all' || (filterTab === 'favorites' && c.id && favoriteIds.includes(c.id));
    return matchesSearch && matchesTab;
  });

  return (
    <div className="admin-layout">
      <Sidebar role="USER" />
      <div className="admin-main">
        <div className="customer-container">
        <div className="customer-hero">
          <h2 className="customer-hero-title">Find Services Near You</h2>
          <p className="customer-hero-subtitle">Join a queue remotely and save your time</p>
        </div>

        <div className="search-bar-wrapper customer-search">
          <span className="search-icon"><Search size={17} /></span>
          <input
            type="text"
            placeholder="Search clinics, offices, banks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {hasActiveQueue && (
          <div className="active-queue-banner" onClick={() => navigate('/customer/queue-status')}>
            <span className="banner-icon"><ClipboardList size={22} /></span>
            <div>
              <p className="banner-title">You have an active queue</p>
              <p className="banner-text">Tap here to view your queue status</p>
            </div>
            <span className="banner-arrow"><ChevronRight size={20} /></span>
          </div>
        )}

        <div className="customer-tabs">
          <button
            className={`tab-btn ${filterTab === 'all' ? 'tab-active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All Centers
          </button>
          <button
            className={`tab-btn ${filterTab === 'favorites' ? 'tab-active' : ''}`}
            onClick={() => setFilterTab('favorites')}
          >
            Favorites
          </button>
        </div>

        <h3 className="customer-section-title">{filterTab === 'all' ? 'Available Service Centers' : 'Favorite Service Centers'}</h3>
        <div className="customer-centers-list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                {filterTab === 'favorites' ? <Star size={36} /> : <Building2 size={36} />}
              </div>
              <p className="empty-state-text">{filterTab === 'favorites' ? 'You have no favorite centers yet.' : 'No service centers available.'}</p>
            </div>
          ) : (
            filtered.map((center) => (
              <div key={center.id} className="customer-center-card" style={{ padding: '1.25rem', overflow: 'hidden' }}>
                {center.brandLogoUrl && (
                  <div style={{ width: '120px', height: '120px', flexShrink: 0, borderRadius: 'var(--radius-xl)', overflow: 'hidden', backgroundColor: 'var(--gray-100)' }}>
                    <img src={center.brandLogoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div className="customer-center-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="customer-center-top">
                    <span className="center-card-category">
                      {center.category}
                    </span>
                    <div className="center-top-right">
                      <span className="queue-count-badge">
                        {waitCounts[center.id!] || 0} in queue
                      </span>
                      <button
                        className="btn-favorite"
                        onClick={(e) => handleToggleFavorite(e, center.id!)}
                        title={favoriteIds.includes(center.id!) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star size={20} fill={favoriteIds.includes(center.id!) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                  <h4 className="customer-center-name">{center.name}</h4>
                  {center.description && (
                    <p className="customer-center-desc">{center.description}</p>
                  )}
                  <div className="customer-center-meta">
                    <span><MapPin size={14} /> {center.address}</span>
                    <span><Clock size={14} /> {center.operatingHours}</span>
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
    </div>
  );
};

export default CustomerHome;
