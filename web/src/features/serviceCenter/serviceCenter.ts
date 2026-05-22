import api from '../auth/auth';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';

export interface ServiceCenter {
  id?: string;
  name: string;
  description: string;
  category: string;
  address: string;
  operatingHours: string;
  maxCapacity: number;
  isActive: boolean;
  createdBy: string;
  createdAt?: any;
  assignedStaffEmail?: string;
  assignedStaffName?: string;
}
export interface StaffUser {
  id?: string;
  email: string;
  firstname?: string;
  lastname?: string;
  name?: string;
  role: string;
}

const COLLECTION = 'service_centers';

// Create a new service center
export const createServiceCenter = async (data: Omit<ServiceCenter, 'id' | 'createdAt'>) => {
  try {
    const response = await api.post('/service-centers', data);
    const docId = response.data.data.centerId;
    console.log('Service center created with ID:', docId);
    return docId;
  } catch (error: any) {
    console.error('Failed to create service center:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to create service center.');
  }
};

// Get all service centers
export const getAllServiceCenters = async (): Promise<ServiceCenter[]> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as ServiceCenter[];
  } catch (error: any) {
    console.error('Failed to get service centers:', error);
    return [];
  }
};

// Update a service center
export const updateServiceCenter = async (id: string, data: Partial<ServiceCenter>) => {
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, { ...data });
  } catch (error: any) {
    console.error('Failed to update service center:', error);
    throw new Error(error.message || 'Failed to update service center.');
  }
};

// Delete a service center
export const deleteServiceCenter = async (id: string) => {
  try {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error('Failed to delete service center:', error);
    throw new Error(error.message || 'Failed to delete service center.');
  }
};

// Get all staff users
export const getAllStaffUsers = async (): Promise<StaffUser[]> => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'STAFF'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffUser));
  } catch (error: any) {
    console.error('Failed to get staff users:', error);
    return [];
  }
};

// Assign a staff member to a service center
export const assignStaffToCenter = async (
  centerId: string,
  staffEmail: string,
  staffName: string
) => {
  try {
    // Check if this staff is already assigned to another center
    const existingCenter = await getStaffAssignedCenter(staffEmail);
    if (existingCenter && existingCenter.id !== centerId) {
      throw new Error(`This staff member is already assigned to "${existingCenter.name}". Unassign them first.`);
    }

    const docRef = doc(db, COLLECTION, centerId);
    await updateDoc(docRef, {
      assignedStaffEmail: staffEmail,
      assignedStaffName: staffName,
    });
  } catch (error: any) {
    console.error('Failed to assign staff:', error);
    throw new Error(error.message || 'Failed to assign staff to service center.');
  }
};

// Unassign staff from a service center
export const unassignStaffFromCenter = async (centerId: string) => {
  try {
    const docRef = doc(db, COLLECTION, centerId);
    await updateDoc(docRef, {
      assignedStaffEmail: '',
      assignedStaffName: '',
    });
  } catch (error: any) {
    console.error('Failed to unassign staff:', error);
    throw new Error(error.message || 'Failed to unassign staff.');
  }
};

// Get the service center assigned to a staff member
export const getStaffAssignedCenter = async (staffEmail: string): Promise<ServiceCenter | null> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('assignedStaffEmail', '==', staffEmail)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as ServiceCenter;
  } catch (error) {
    console.error('Failed to get staff assigned center:', error);
    return null;
  }
};

// Subscribe to a staff member's assigned center (real-time)
export const subscribeToStaffCenter = (
  staffEmail: string,
  callback: (center: ServiceCenter | null) => void
) => {
  const q = query(
    collection(db, COLLECTION),
    where('assignedStaffEmail', '==', staffEmail)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }
      const d = snapshot.docs[0];
      callback({ id: d.id, ...d.data() } as ServiceCenter);
    },
    (error) => {
      console.error('Staff center subscription error:', error);
      callback(null);
    }
  );
};

// Real-time listener for service centers
export const subscribeToServiceCenters = (
  callback: (centers: ServiceCenter[]) => void,
  onError?: (error: any) => void
) => {
  // Use simple query without orderBy to avoid needing a Firestore index
  const colRef = collection(db, COLLECTION);
  return onSnapshot(
    colRef,

    (snapshot) => {
      const centers = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ServiceCenter[];
      // Sort client-side instead
      centers.sort((a, b) => {
        const aTime = a.createdAt || '';
        const bTime = b.createdAt || '';
        return bTime > aTime ? 1 : -1;
      });
      callback(centers);
    },
    (error) => {
      console.error('Firestore subscription error:', error);
      if (onError) onError(error);
      // Fallback: try a one-time fetch
      getAllServiceCenters().then(callback).catch(() => callback([]));
    }
  );
};

// ==============================
// FAVORITE SERVICE CENTERS
// ==============================

const FAVORITES_COLLECTION = 'favorite_centers';

// Toggle favorite status for a service center
export const toggleFavoriteCenter = async (userEmail: string, centerId: string, isFavorite: boolean) => {
  try {
    if (isFavorite) {
      // Unfavorite: find the doc and delete it
      const q = query(
        collection(db, FAVORITES_COLLECTION),
        where('userEmail', '==', userEmail),
        where('serviceCenterId', '==', centerId)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach(async (d) => {
        await deleteDoc(doc(db, FAVORITES_COLLECTION, d.id));
      });
    } else {
      // Favorite: add a new doc
      await addDoc(collection(db, FAVORITES_COLLECTION), {
        userEmail,
        serviceCenterId: centerId,
        createdAt: new Date().toISOString()
      });
    }
  } catch (error: any) {
    console.error('Failed to toggle favorite:', error);
    throw new Error(error.message || 'Failed to update favorites.');
  }
};

// Subscribe to a user's favorite centers
export const subscribeToFavorites = (
  userEmail: string,
  callback: (favoriteCenterIds: string[]) => void
) => {
  const q = query(
    collection(db, FAVORITES_COLLECTION),
    where('userEmail', '==', userEmail)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const ids = snapshot.docs.map((d) => d.data().serviceCenterId);
      callback(ids);
    },
    (error) => {
      console.error('Favorites subscription error:', error);
      callback([]);
    }
  );
};
