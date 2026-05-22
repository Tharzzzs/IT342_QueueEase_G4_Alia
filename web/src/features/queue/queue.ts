import api from '../auth/auth';
import {
  collection,
  updateDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';

export interface QueueEntry {
  id?: string;
  serviceCenterId: string;
  serviceCenterName: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'WAITING' | 'SERVING' | 'COMPLETED' | 'CANCELLED';
  queueNumber: number;
  joinedAt?: any;
  servedAt?: any;
  completedAt?: any;
}

const COLLECTION = 'queue_entries';

// Generate next queue number based on current active (WAITING/SERVING) entries only
/*
const getNextQueueNumber = async (serviceCenterId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('serviceCenterId', '==', serviceCenterId),
      where('status', 'in', ['WAITING', 'SERVING'])
    );
    const snapshot = await getDocs(q);
    // Filter today's entries client-side
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEntries = snapshot.docs.filter((d) => {
      const data = d.data();
      if (!data.joinedAt) return false;
      const joinDate = data.joinedAt.toDate ? data.joinedAt.toDate() : new Date(data.joinedAt);
      return joinDate >= today;
    });
    return todayEntries.length + 1;
  } catch (error) {
    console.error('Failed to get next queue number:', error);
    return Math.floor(Math.random() * 900) + 100; // Fallback random number
  }
};
*/

// Compute dynamic display positions from active entries.
// Returns a map of entryId → display position (1-indexed, continuous).
// Entries are sorted by joinedAt so earliest joiner = position 1.
export const computeDisplayPositions = (entries: QueueEntry[]): Map<string, number> => {
  const positionMap = new Map<string, number>();
  const activeEntries = entries
    .filter((e) => e.status === 'WAITING' || e.status === 'SERVING')
    .sort((a, b) => {
      const aTime = a.joinedAt
        ? (a.joinedAt.toDate ? a.joinedAt.toDate().getTime() : new Date(a.joinedAt).getTime())
        : 0;
      const bTime = b.joinedAt
        ? (b.joinedAt.toDate ? b.joinedAt.toDate().getTime() : new Date(b.joinedAt).getTime())
        : 0;
      return aTime - bTime;
    });
  activeEntries.forEach((entry, index) => {
    if (entry.id) {
      positionMap.set(entry.id, index + 1);
    }
  });
  return positionMap;
};

// Join a queue
export const joinQueue = async (
  serviceCenterId: string,
  serviceCenterName: string,
  _userId: string,
  userEmail: string,
  _userName: string
): Promise<{ entryId: string; queueNumber: number }> => {
  // Check if user already has an active queue entry
  const existing = await getUserActiveQueue(userEmail);
  if (existing) {
    throw new Error('You are already in a queue. Please leave your current queue first.');
  }

  try {
    const payload = {
      serviceCenterName
    };
    const response = await api.post(`/queues/join/${serviceCenterId}`, payload);
    const data = response.data.data;
    
    console.log('Queue entry created:', data.queueId, 'Queue #', data.position);
    return { entryId: data.queueId, queueNumber: data.position };
  } catch (error: any) {
    console.error('Failed to join queue:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to join queue.');
  }
};

// Leave / cancel queue
export const leaveQueue = async (entryId: string) => {
  try {
    const docRef = doc(db, COLLECTION, entryId);
    await updateDoc(docRef, {
      status: 'CANCELLED',
      completedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to leave queue:', error);
    throw new Error(error.message || 'Failed to leave queue.');
  }
};

// Call next person in queue (change WAITING → SERVING)
export const callNext = async (serviceCenterId: string): Promise<QueueEntry | null> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('serviceCenterId', '==', serviceCenterId),
      where('status', '==', 'WAITING')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    // Sort client-side by queueNumber
    const sorted = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as QueueEntry))
      .sort((a, b) => a.queueNumber - b.queueNumber);

    const next = sorted[0];
    const docRef = doc(db, COLLECTION, next.id!);
    await updateDoc(docRef, {
      status: 'SERVING',
      servedAt: new Date().toISOString(),
    });

    return next;
  } catch (error: any) {
    console.error('Failed to call next:', error);
    throw new Error(error.message || 'Failed to call next.');
  }
};

// Mark as served (SERVING → COMPLETED)
export const markServed = async (entryId: string) => {
  try {
    const docRef = doc(db, COLLECTION, entryId);
    await updateDoc(docRef, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to mark served:', error);
    throw new Error(error.message || 'Failed to mark as served.');
  }
};

// Get queue entries for a service center
export const getQueueByCenter = async (serviceCenterId: string): Promise<QueueEntry[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('serviceCenterId', '==', serviceCenterId)
    );
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as QueueEntry[];
    return entries.sort((a, b) => a.queueNumber - b.queueNumber);
  } catch (error: any) {
    console.error('Failed to get queue:', error);
    return [];
  }
};

// Real-time subscription to a service center's queue
// Callback now also receives a positionMap for dynamic display positions.
export const subscribeToQueue = (
  serviceCenterId: string,
  callback: (entries: QueueEntry[], positionMap: Map<string, number>) => void
) => {
  const q = query(
    collection(db, COLLECTION),
    where('serviceCenterId', '==', serviceCenterId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as QueueEntry[];
      // Sort by joinedAt for consistent ordering
      entries.sort((a, b) => {
        const aTime = a.joinedAt
          ? (a.joinedAt.toDate ? a.joinedAt.toDate().getTime() : new Date(a.joinedAt).getTime())
          : 0;
        const bTime = b.joinedAt
          ? (b.joinedAt.toDate ? b.joinedAt.toDate().getTime() : new Date(b.joinedAt).getTime())
          : 0;
        return aTime - bTime;
      });
      const positionMap = computeDisplayPositions(entries);
      callback(entries, positionMap);
    },
    (error) => {
      console.error('Queue subscription error:', error);
      callback([], new Map());
    }
  );
};

// Get user's active queue entry (WAITING or SERVING)
export const getUserActiveQueue = async (userEmail: string): Promise<QueueEntry | null> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userEmail', '==', userEmail),
      where('status', 'in', ['WAITING', 'SERVING'])
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as QueueEntry;
  } catch (error) {
    console.error('Failed to get active queue:', error);
    return null;
  }
};

// Subscribe to user's active queue entry
export const subscribeToUserQueue = (
  userEmail: string,
  callback: (entry: QueueEntry | null) => void
) => {
  const q = query(
    collection(db, COLLECTION),
    where('userEmail', '==', userEmail),
    where('status', 'in', ['WAITING', 'SERVING'])
  );
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }
      const d = snapshot.docs[0];
      callback({ id: d.id, ...d.data() } as QueueEntry);
    },
    (error) => {
      console.error('User queue subscription error:', error);
      callback(null);
    }
  );
};

// Subscribe to user's queue entry WITH dynamic position computed from the full queue.
// Provides both the user's entry and their current position number.
export const subscribeToUserQueueWithPosition = (
  userEmail: string,
  callback: (entry: QueueEntry | null, position: number, totalActive: number) => void
) => {
  // First, subscribe to the user's own entry
  let currentEntry: QueueEntry | null = null;
  let queueUnsub: (() => void) | null = null;

  const userUnsub = subscribeToUserQueue(userEmail, (entry) => {
    currentEntry = entry;

    // Clean up previous queue subscription if service center changed
    if (queueUnsub) {
      queueUnsub();
      queueUnsub = null;
    }

    if (!entry || !entry.serviceCenterId) {
      callback(null, 0, 0);
      return;
    }

    // Subscribe to the full queue for this service center to compute position
    queueUnsub = subscribeToQueue(entry.serviceCenterId, (_entries, positionMap) => {
      if (!currentEntry || !currentEntry.id) {
        callback(null, 0, 0);
        return;
      }
      const position = positionMap.get(currentEntry.id) || 0;
      callback(currentEntry, position, positionMap.size);
    });
  });

  // Return cleanup function
  return () => {
    userUnsub();
    if (queueUnsub) queueUnsub();
  };
};

// Get count of people served today (all centers)
export const getServedTodayCount = async (): Promise<number> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', 'COMPLETED')
    );
    const snapshot = await getDocs(q);
    // Filter today client-side
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return snapshot.docs.filter((d) => {
      const data = d.data();
      if (!data.completedAt) return false;
      const completed = data.completedAt.toDate ? data.completedAt.toDate() : new Date(data.completedAt);
      return completed >= today;
    }).length;
  } catch (error) {
    console.error('Failed to get served count:', error);
    return 0;
  }
};

// Get total people currently in queue (all centers)
export const getTotalInQueue = async (): Promise<number> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('status', 'in', ['WAITING', 'SERVING'])
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Failed to get queue count:', error);
    return 0;
  }
};

// Get count of waiting people for a specific center
export const getWaitingCount = async (serviceCenterId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('serviceCenterId', '==', serviceCenterId),
      where('status', '==', 'WAITING')
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Failed to get waiting count:', error);
    return 0;
  }
};

// ==============================
// HISTORY / TRANSACTION LOGS
// ==============================

// Get a customer's queue history
export const getUserQueueHistory = async (userEmail: string): Promise<QueueEntry[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userEmail', '==', userEmail),
      where('status', 'in', ['COMPLETED', 'CANCELLED', 'MISSED'])
    );
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as QueueEntry[];
    // Sort by joinedAt descending (newest first)
    return entries.sort((a, b) => {
      const aTime = a.joinedAt ? (a.joinedAt.toDate ? a.joinedAt.toDate().getTime() : new Date(a.joinedAt).getTime()) : 0;
      const bTime = b.joinedAt ? (b.joinedAt.toDate ? b.joinedAt.toDate().getTime() : new Date(b.joinedAt).getTime()) : 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Failed to get user queue history:', error);
    return [];
  }
};

// Get a service center's queue history (for staff)
export const getCenterQueueHistory = async (serviceCenterId: string): Promise<QueueEntry[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('serviceCenterId', '==', serviceCenterId),
      where('status', 'in', ['COMPLETED', 'CANCELLED', 'MISSED'])
    );
    const snapshot = await getDocs(q);
    // Filter to today's history only to avoid massive data loading for staff
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entries = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as QueueEntry))
      .filter((e) => {
        const time = e.completedAt || e.joinedAt;
        if (!time) return false;
        const date = time.toDate ? time.toDate() : new Date(time);
        return date >= today;
      });
      
    // Sort by completedAt descending
    return entries.sort((a, b) => {
      const aTime = a.completedAt ? (a.completedAt.toDate ? a.completedAt.toDate().getTime() : new Date(a.completedAt).getTime()) : 0;
      const bTime = b.completedAt ? (b.completedAt.toDate ? b.completedAt.toDate().getTime() : new Date(b.completedAt).getTime()) : 0;
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Failed to get center queue history:', error);
    return [];
  }
};
