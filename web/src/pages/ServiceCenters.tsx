import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Toast, { useToast } from '../components/Toast';
import {
  createServiceCenter,
  updateServiceCenter,
  deleteServiceCenter,
  subscribeToServiceCenters,
  type ServiceCenter,
} from '../api/serviceCenter';

const CATEGORIES = ['Medical', 'Government', 'Banking', 'Utilities', 'Education', 'Other'];

const emptyForm: Omit<ServiceCenter, 'id' | 'createdAt'> = {
  name: '',
  description: '',
  category: 'Medical',
  address: '',
  operatingHours: '8:00 AM - 5:00 PM',
  maxCapacity: 50,
  isActive: true,
  createdBy: '',
};

const ServiceCenters = () => {
  const role = localStorage.getItem('role');
  const email = localStorage.getItem('email') || '';
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm, createdBy: email });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const unsub = subscribeToServiceCenters(
      (data) => {
        setCenters(data);
      },
      (error) => {
        console.error('Service centers subscription failed:', error);
        addToast('error', 'Failed to load service centers: ' + (error.message || 'Check Firestore rules.'));
      }
    );
    return () => unsub();
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm, createdBy: email });
    setEditingId(null);
    setShowModal(false);
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Service center name is required.';
    if (form.name.trim().length < 3) return 'Name must be at least 3 characters.';
    if (!form.address.trim()) return 'Address is required.';
    if (form.maxCapacity < 1) return 'Max capacity must be at least 1.';
    if (!form.operatingHours.trim()) return 'Operating hours are required.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      addToast('error', error);
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await updateServiceCenter(editingId, form);
        addToast('success', `"${form.name}" updated successfully!`);
      } else {
        await createServiceCenter(form);
        addToast('success', `"${form.name}" created successfully!`);
      }
      resetForm();
    } catch (err: any) {
      addToast('error', err.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (center: ServiceCenter) => {
    setForm({
      name: center.name,
      description: center.description,
      category: center.category,
      address: center.address,
      operatingHours: center.operatingHours,
      maxCapacity: center.maxCapacity,
      isActive: center.isActive,
      createdBy: center.createdBy,
    });
    setEditingId(center.id || null);
    setShowModal(true);
  };

  const handleDelete = async (center: ServiceCenter) => {
    if (!window.confirm(`Are you sure you want to delete "${center.name}"?`)) return;
    try {
      await deleteServiceCenter(center.id!);
      addToast('success', `"${center.name}" deleted.`);
    } catch (err: any) {
      addToast('error', err.message || 'Delete failed.');
    }
  };

  const handleToggleActive = async (center: ServiceCenter) => {
    try {
      await updateServiceCenter(center.id!, { isActive: !center.isActive });
      addToast('info', `"${center.name}" is now ${!center.isActive ? 'active' : 'inactive'}.`);
    } catch (err: any) {
      addToast('error', err.message || 'Update failed.');
    }
  };

  const filtered = centers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <Sidebar role={role} />
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <h2 className="admin-page-title">Service Centers</h2>
            <p className="admin-page-subtitle">Manage your service center locations</p>
          </div>
          {role === 'ADMIN' && (
            <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary-sm">
              + Add Center
            </button>
          )}
        </header>

        {/* Search Bar */}
        <div className="search-bar-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Centers Grid */}
        <div className="centers-grid">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-icon">🏢</p>
              <p className="empty-state-text">No service centers found.</p>
              {role === 'ADMIN' && <p className="empty-state-sub">Create your first service center to get started.</p>}
            </div>
          ) : (
            filtered.map((center) => (
              <div key={center.id} className="center-card">
                <div className="center-card-header">
                  <div className="center-card-category">{center.category}</div>
                  <div className={`status-badge ${center.isActive ? 'status-active' : 'status-inactive'}`}>
                    {center.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <h3 className="center-card-name">{center.name}</h3>
                <p className="center-card-desc">{center.description || 'No description provided.'}</p>
                <div className="center-card-details">
                  <div className="center-detail">
                    <span className="detail-label">📍 Address</span>
                    <span className="detail-value">{center.address}</span>
                  </div>
                  <div className="center-detail">
                    <span className="detail-label">🕐 Hours</span>
                    <span className="detail-value">{center.operatingHours}</span>
                  </div>
                  <div className="center-detail">
                    <span className="detail-label">👥 Capacity</span>
                    <span className="detail-value">{center.maxCapacity}</span>
                  </div>
                </div>
                {role === 'ADMIN' && (
                  <div className="center-card-actions">
                    <button onClick={() => handleEdit(center)} className="btn-action btn-edit">Edit</button>
                    <button onClick={() => handleToggleActive(center)} className="btn-action btn-toggle">
                      {center.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(center)} className="btn-action btn-delete">Delete</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => resetForm()}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">{editingId ? 'Edit Service Center' : 'Create Service Center'}</h3>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="form-input"
                    placeholder="e.g. City Medical Clinic"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="form-input"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="form-input form-textarea"
                    placeholder="Brief description..."
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address *</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="form-input"
                    placeholder="Full address"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Operating Hours *</label>
                    <input
                      type="text"
                      value={form.operatingHours}
                      onChange={(e) => setForm({ ...form, operatingHours: e.target.value })}
                      className="form-input"
                      placeholder="8:00 AM - 5:00 PM"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Capacity *</label>
                    <input
                      type="number"
                      value={form.maxCapacity}
                      onChange={(e) => setForm({ ...form, maxCapacity: parseInt(e.target.value) || 0 })}
                      className="form-input"
                      min={1}
                      required
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={loading} className="btn-primary-sm">
                    {loading ? 'Saving...' : editingId ? 'Update Center' : 'Create Center'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ServiceCenters;
