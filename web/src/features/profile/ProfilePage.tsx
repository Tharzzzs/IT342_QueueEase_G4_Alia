import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, ArrowLeft, User as UserIcon } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Toast, { useToast } from '../../components/Toast';
import { getUserProfile, updateUserProfile, uploadFile, type UserProfile } from './profile';

const ProfilePage = () => {
  const role = localStorage.getItem('role');
  const email = localStorage.getItem('email') || '';
  const navigate = useNavigate();
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

    } catch (err: any) {
      addToast('error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const isCustomer = role === 'USER';

  const content = (
    <div className="profile-container" style={{ padding: '2rem', maxWidth: '600px', margin: isCustomer ? '0 auto' : '0' }}>
      <button className="btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ArrowLeft size={16} /> Back
      </button>
      
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Edit Profile</h2>
      
      {loading ? (
        <p>Loading profile...</p>
      ) : (
        <form onSubmit={handleSave} className="profile-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Avatar Upload Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div 
              style={{
                width: '120px', height: '120px', borderRadius: '50%', 
                backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative', border: '2px solid #e5e7eb'
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <UserIcon size={48} color="#9ca3af" />
              )}
            </div>
            
            <button 
              type="button" 
              className="btn-secondary btn-sm" 
              onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Camera size={16} /> Change Photo
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email (Read Only)</label>
            <input type="email" value={email} className="form-input" disabled style={{ backgroundColor: '#f9fafb' }} />
          </div>

          <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">First Name</label>
              <input 
                type="text" 
                value={firstname} 
                onChange={(e) => setFirstname(e.target.value)} 
                className="form-input" 
                placeholder="Enter first name" 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Last Name</label>
              <input 
                type="text" 
                value={lastname} 
                onChange={(e) => setLastname(e.target.value)} 
                className="form-input" 
                placeholder="Enter last name" 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary-sm" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );

  if (isCustomer) {
    return (
      <div className="customer-page">
        <header className="customer-header">
          <h1 className="customer-brand" onClick={() => navigate('/customer/home')}>QueueEase</h1>
        </header>
        {content}
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <Sidebar role={role} />
      <div className="admin-main">
        {content}
      </div>
    </div>
  );
};

export default ProfilePage;
