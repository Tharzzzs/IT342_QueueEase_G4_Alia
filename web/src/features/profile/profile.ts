import api from '../auth/auth';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export interface UserProfile {
  id?: string;
  email: string;
  firstname?: string;
  lastname?: string;
  avatar_url?: string;
  role: string;
}

export const getUserProfile = async (email: string): Promise<UserProfile | null> => {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserProfile;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (data: { firstname?: string; lastname?: string; avatarUrl?: string }) => {
  try {
    const response = await api.put('/users/profile', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to update profile.');
  }
};

export const uploadFile = async (file: File, folder: string = 'general'): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || error.message || 'Failed to upload file.');
  }
};
