import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BellRing, X, ExternalLink } from 'lucide-react';
import { subscribeToUserQueue, type QueueEntry } from '../features/queue/queue';

// Premium Web Audio Dual-Tone Chime Synthesizer
// Play a clean, high-quality, futuristic double-tone chime (D5 -> A5)
const playServingChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // If context is suspended (browser autoplay policy), we attempt to resume, but don't crash if blocked
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Tone 1 (D5) - Bell Ding
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.8);

    // Tone 2 (A5) - Bell Dong (slightly delayed and higher pitch for a bright feeling)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.12);
    gain2.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 1.2);
  } catch (err) {
    console.warn('Web Audio chime playback not allowed or failed:', err);
  }
};

export const QueueNotificationListener: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [activeQueueEntry, setActiveQueueEntry] = useState<QueueEntry | null>(null);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  // Sync email and role from localStorage on route change
  useEffect(() => {
    const email = localStorage.getItem('email') || '';
    const role = localStorage.getItem('role') || '';

    if (role === 'USER' && email) {
      if (email !== currentEmail) {
        setCurrentEmail(email);
      }
    } else {
      // Clear subscription if logged out or role changes
      setCurrentEmail('');
      setActiveQueueEntry(null);
      setPrevStatus(null);
    }
  }, [location.pathname, currentEmail]);

  // Subscribe to real-time updates for active queue entry
  useEffect(() => {
    if (!currentEmail) return;

    const unsub = subscribeToUserQueue(currentEmail, (entry) => {
      if (!entry) {
        setActiveQueueEntry(null);
        setPrevStatus(null);
        return;
      }

      const status = entry.status;
      const dismissedKey = `dismissed-serving-${entry.id}`;
      const isDismissed = sessionStorage.getItem(dismissedKey) === 'true';

      // Detect transition to SERVING state
      if (status === 'SERVING' && !isDismissed) {
        // Trigger alert only when transition happens or initially loaded as SERVING without dismissal
        if (prevStatus === 'WAITING' || prevStatus === null) {
          setIsExiting(false);
          setActiveQueueEntry(entry);
          playServingChime();
        }
      } else {
        // If state changes away from SERVING or is dismissed, remove alert
        setActiveQueueEntry(null);
      }

      setPrevStatus(status);
    });

    return () => {
      unsub();
    };
  }, [currentEmail, prevStatus]);

  // Close helper that updates session state to prevent reactivation
  const handleDismiss = () => {
    if (!activeQueueEntry?.id) return;
    
    // Set exit animation
    setIsExiting(true);
    
    // Store dismissal in sessionStorage so it doesn't pop up again in this session
    sessionStorage.setItem(`dismissed-serving-${activeQueueEntry.id}`, 'true');

    // Wait for slide-out animation to complete
    setTimeout(() => {
      setActiveQueueEntry(null);
      setIsExiting(false);
    }, 300);
  };

  const handleNavigateToQueue = () => {
    if (!activeQueueEntry?.id) return;
    
    // Dismiss the notification
    sessionStorage.setItem(`dismissed-serving-${activeQueueEntry.id}`, 'true');
    setActiveQueueEntry(null);

    // Redirect to customer queue status page
    navigate('/customer/queue-status');
  };

  if (!activeQueueEntry) return null;

  return (
    <div className="queue-notification-container" role="alert" aria-live="assertive">
      <div className={`queue-notification-card ${isExiting ? 'exit' : ''}`}>
        <div className="queue-notification-icon-wrapper">
          <BellRing size={20} className="bell-icon" />
          <span className="queue-notification-pulse-dot" />
          <span className="queue-notification-pulse-ring" />
        </div>

        <div className="queue-notification-content">
          <h4 className="queue-notification-title">It's Your Turn!</h4>
          <p className="queue-notification-desc">
            You are now being served at <strong>{activeQueueEntry.serviceCenterName}</strong>. Please proceed to the service counter.
          </p>
          <span className="queue-notification-badge">
            Queue Number: #{activeQueueEntry.queueNumber}
          </span>

          <div className="queue-notification-actions">
            <button
              onClick={handleNavigateToQueue}
              className="btn-notification-action btn-notification-primary"
            >
              <ExternalLink size={13} /> View Status
            </button>
            <button
              onClick={handleDismiss}
              className="btn-notification-action btn-notification-secondary"
            >
              Dismiss
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="queue-notification-close"
          aria-label="Dismiss notification"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};

export default QueueNotificationListener;
