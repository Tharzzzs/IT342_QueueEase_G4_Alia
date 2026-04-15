import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

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
}

const COLLECTION = 'service_centers';

// Create a new service center
export const createServiceCenter = async (data: Omit<ServiceCenter, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    console.log('Service center created with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Failed to create service center:', error);
    throw new Error(error.message || 'Failed to create service center. Check Firestore rules.');
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
