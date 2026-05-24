import React, { useEffect, useState, useRef } from 'react';
import { Camera, Save, X, User as UserIcon } from 'lucide-react';
import Toast, { useToast } from '../../components/Toast';
import { getUserProfile, updateUserProfile, uploadFile, type UserProfile } from './profile';

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const role = localStorage.getItem('role');
  const email = localStorage.getItem('email') || '';
  const { toasts, addToast, removeToast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const user = await getUserProfile(email);
        if (user) {
          setProfile(user);
          setFirstname(user.firstname || '');
          setLastname(user.lastname || '');
          setAvatarUrl(user.avatar_url || '');
        }
      } catch (err) {
        addToast('error', 'Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [email]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        addToast('error', 'Please select a valid image file.');
        return;
      }
      setSelectedFile(file);
      // Create a local preview
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalAvatarUrl = profile?.avatar_url || '';
      
      if (selectedFile) {
        finalAvatarUrl = await uploadFile(selectedFile, 'avatars');
      }

      await updateUserProfile({
        firstname,
        lastname,
        avatarUrl: finalAvatarUrl
      });
      
      addToast('success', 'Profile updated successfully!');
      
      // Update local state to reflect saved status
      setAvatarUrl(finalAvatarUrl);
      setSelectedFile(null);
      if (profile) {
        setProfile({ ...profile, firstname, lastname, avatar_url: finalAvatarUrl });
      }

      // Notify other components (like Sidebar) to refresh profile details
      window.dispatchEvent(new Event('profileUpdated'));

    } catch (err: any) {
      addToast('error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', position: 'relative' }}
      >
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            background: 'none', border: 'none', color: 'var(--gray-400)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0.25rem', borderRadius: '50%', transition: 'all 0.2s'
          }}
          className="hover:bg-gray-100 hover:text-gray-700"
          title="Close Modal"
        >
          <X size={20} />
        </button>

        <div className="profile-header">
          <h2 className="profile-title">Edit Profile</h2>
          <span className={`profile-badge ${role === 'ADMIN' ? 'profile-badge-admin' : role === 'STAFF' ? 'profile-badge-staff' : ''}`}>
            {role === 'USER' ? 'Customer' : role}
          </span>
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Loading profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="modal-form" style={{ gap: '1.75rem', marginTop: '1.5rem' }}>
            
            {/* Avatar Upload Section */}
            <div className="profile-avatar-container">
              <div className="profile-avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="profile-avatar-img" />
                ) : (
                  <UserIcon size={48} className="profile-avatar-placeholder" />
                )}
                <div className="profile-avatar-overlay">
                  <Camera size={20} style={{ marginBottom: '0.25rem' }} />
                  <span>Upload Photo</span>
                </div>
              </div>
              
              <div className="profile-avatar-badge">
                <Camera size={14} />
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>

            <div className="profile-info-section">
              <span className="profile-info-label">Email Address (Read Only)</span>
              <span className="profile-info-value">{email}</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input 
                  type="text" 
                  value={firstname} 
                  onChange={(e) => setFirstname(e.target.value)} 
                  className="form-input" 
                  placeholder="Enter first name" 
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input 
                  type="text" 
                  value={lastname} 
                  onChange={(e) => setLastname(e.target.value)} 
                  className="form-input" 
                  placeholder="Enter last name" 
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={onClose}
                style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary-sm" 
                disabled={saving} 
                style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ProfileModal;
