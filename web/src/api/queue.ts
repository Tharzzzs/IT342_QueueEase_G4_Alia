import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

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

// Generate next queue number for a service center (today only)
const getNextQueueNumber = async (serviceCenterId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('serviceCenterId', '==', serviceCenterId)
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

// Join a queue
export const joinQueue = async (
  serviceCenterId: string,
  serviceCenterName: string,
  userId: string,
  userEmail: string,
  userName: string
): Promise<{ entryId: string; queueNumber: number }> => {
  // Check if user already has an active queue entry
  const existing = await getUserActiveQueue(userEmail);
  if (existing) {
    throw new Error('You are already in a queue. Please leave your current queue first.');
  }

  const queueNumber = await getNextQueueNumber(serviceCenterId);

  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      serviceCenterId,
      serviceCenterName,
      userId,
      userEmail,
      userName,
      status: 'WAITING',
      queueNumber,
      joinedAt: new Date().toISOString(),
    });

    console.log('Queue entry created:', docRef.id, 'Queue #', queueNumber);
    return { entryId: docRef.id, queueNumber };
  } catch (error: any) {
    console.error('Failed to join queue:', error);
    throw new Error(error.message || 'Failed to join queue.');
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
export const subscribeToQueue = (
  serviceCenterId: string,
  callback: (entries: QueueEntry[]) => void
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
      // Sort client-side
      entries.sort((a, b) => a.queueNumber - b.queueNumber);
      callback(entries);
    },
    (error) => {
      console.error('Queue subscription error:', error);
      callback([]);
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
