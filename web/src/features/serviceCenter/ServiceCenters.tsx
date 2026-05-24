import { useEffect, useState } from 'react';
import { Clock, MapPin, Plus, Search, UserRound, Users } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Toast, { useToast } from '../../components/Toast';
import {
  createServiceCenter,
  updateServiceCenter,
  deleteServiceCenter,
  subscribeToServiceCenters,
  assignStaffToCenter,
  unassignStaffFromCenter,
  getAllStaffUsers,
  type ServiceCenter,
  type StaffUser,
} from './serviceCenter';
import { uploadFile } from '../profile/profile';
import { ImagePlus } from 'lucide-react';

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
  brandLogoUrl: '',
};

const ServiceCenters = () => {
  const role = localStorage.getItem('role');
  const email = localStorage.getItem('email') || '';
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm, createdBy: email });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toasts, addToast, removeToast } = useToast();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignCenterId, setAssignCenterId] = useState<string | null>(null);
  const [assignCenterName, setAssignCenterName] = useState('');
  const [selectedStaffEmail, setSelectedStaffEmail] = useState('');
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState<ServiceCenter | null>(null);
  const [centerToUnassign, setCenterToUnassign] = useState<ServiceCenter | null>(null);

  useEffect(() => {
    const unsub = subscribeToServiceCenters(
      (data) => setCenters(data),
      (error) => {
        console.error('Service centers subscription failed:', error);
        addToast('error', 'Failed to load service centers: ' + (error.message || 'Check Firestore rules.'));
      }
    );

    if (role === 'ADMIN') {
      getAllStaffUsers().then((users) => setStaffList(users));
    }

    return () => unsub();
  }, [role]);

  const resetForm = () => {
    setForm({ ...emptyForm, createdBy: email });
    setLogoFile(null);
    setLogoPreview('');
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
      let finalLogoUrl = form.brandLogoUrl || '';
      if (logoFile) {
        finalLogoUrl = await uploadFile(logoFile, 'logos');
      }
      const dataToSave = { ...form, brandLogoUrl: finalLogoUrl };

      if (editingId) {
        await updateServiceCenter(editingId, dataToSave);
        addToast('success', `"${form.name}" updated successfully.`);
      } else {
        await createServiceCenter(dataToSave);
        addToast('success', `"${form.name}" created successfully.`);
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
      brandLogoUrl: center.brandLogoUrl || '',
    });
    setLogoFile(null);
    setLogoPreview(center.brandLogoUrl || '');
    setEditingId(center.id || null);
    setShowModal(true);
  };

  const handleDelete = (center: ServiceCenter) => {
    setCenterToDelete(center);
  };

  const confirmDelete = async () => {
    if (!centerToDelete) return;
    try {
      await deleteServiceCenter(centerToDelete.id!);
      addToast('success', `"${centerToDelete.name}" deleted.`);
    } catch (err: any) {
      addToast('error', err.message || 'Delete failed.');
    } finally {
      setCenterToDelete(null);
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

  const openAssignModal = (center: ServiceCenter) => {
    setAssignCenterId(center.id!);
    setAssignCenterName(center.name);
    setSelectedStaffEmail('');
    setShowAssignModal(true);
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCenterId) return;
    if (!selectedStaffEmail) {
      addToast('error', 'Please select a staff member.');
      return;
    }

    const selectedStaff = staffList.find(s => s.email === selectedStaffEmail);
    if (!selectedStaff) {
      addToast('error', 'Selected staff member not found.');
      return;
    }

    const center = centers.find((c) => c.id === assignCenterId);
    if (center?.assignedStaffEmail) {
      addToast('error', `This center already has staff assigned (${center.assignedStaffEmail}). Unassign them first.`);
      return;
    }

    setAssignLoading(true);
    try {
      const staffName = selectedStaff.name || `${selectedStaff.firstname || ''} ${selectedStaff.lastname || ''}`.trim() || 'Staff User';
      await assignStaffToCenter(assignCenterId, selectedStaff.email, staffName);
      addToast('success', `Staff "${staffName}" assigned to "${assignCenterName}" successfully.`);
      setShowAssignModal(false);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to assign staff.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUnassignStaff = (center: ServiceCenter) => {
    setCenterToUnassign(center);
  };

  const confirmUnassign = async () => {
    if (!centerToUnassign) return;
    try {
      await unassignStaffFromCenter(centerToUnassign.id!);
      addToast('success', `Staff unassigned from "${centerToUnassign.name}".`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to unassign staff.');
    } finally {
      setCenterToUnassign(null);
    }
  };

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
              <Plus size={16} /> Add Center
            </button>
          )}
        </header>

        <div className="search-bar-wrapper">
          <span className="search-icon"><Search size={17} /></span>
          <input
            type="text"
            placeholder="Search by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="centers-grid">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={36} /></div>
              <p className="empty-state-text">No service centers found.</p>
              {role === 'ADMIN' && <p className="empty-state-sub">Create your first service center to get started.</p>}
            </div>
          ) : (
            filtered.map((center) => (
              <div key={center.id} className="center-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {center.brandLogoUrl ? (
                  <div style={{ width: '100%', height: '180px', backgroundColor: 'var(--gray-100)' }}>
                    <img src={center.brandLogoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '14px', backgroundColor: 'var(--blue-600)' }} />
                )}
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="center-card-header">
                    <div className="center-card-category">
                      {center.category}
                    </div>
                    <div className={`status-badge ${center.isActive ? 'status-active' : 'status-inactive'}`}>
                      {center.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                <h3 className="center-card-name">{center.name}</h3>
                <p className="center-card-desc">{center.description || 'No description provided.'}</p>
                <div className="center-card-details">
                  <div className="center-detail">
                    <span className="detail-label"><MapPin size={14} /> Address</span>
                    <span className="detail-value">{center.address}</span>
                  </div>
                  <div className="center-detail">
                    <span className="detail-label"><Clock size={14} /> Hours</span>
                    <span className="detail-value">{center.operatingHours}</span>
                  </div>
                  <div className="center-detail">
                    <span className="detail-label"><Users size={14} /> Capacity</span>
                    <span className="detail-value">{center.maxCapacity}</span>
                  </div>
                </div>

                <div className="staff-assignment-section">
                  <span className="detail-label"><UserRound size={14} /> Assigned Staff</span>
                  {center.assignedStaffEmail ? (
                    <div className="staff-assignment-badge">
                      <span className="staff-dot staff-dot-assigned"></span>
                      <div>
                        <span className="staff-badge-name">{center.assignedStaffName || 'Staff'}</span>
                        <span className="staff-badge-email">{center.assignedStaffEmail}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted staff-unassigned">No staff assigned</span>
                  )}
                </div>

                {role === 'ADMIN' && (
                  <div className="center-card-actions">
                    <button onClick={() => handleEdit(center)} className="btn-action btn-edit">Edit</button>
                    <button onClick={() => handleToggleActive(center)} className="btn-action btn-toggle">
                      {center.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    {center.assignedStaffEmail ? (
                      <button onClick={() => handleUnassignStaff(center)} className="btn-action btn-delete">
                        Unassign
                      </button>
                    ) : (
                      <button onClick={() => openAssignModal(center)} className="btn-action btn-assign">
                        Assign Staff
                      </button>
                    )}
                    <button onClick={() => handleDelete(center)} className="btn-action btn-delete">Delete</button>
                  </div>
                )}
                </div>
              </div>
            ))
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => resetForm()}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">{editingId ? 'Edit Service Center' : 'Create Service Center'}</h3>
              <form onSubmit={handleSubmit} className="modal-form">
                
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label className="form-label" style={{ alignSelf: 'flex-start' }}>Brand Logo</label>
                  <div 
                    style={{
                      width: '100px', height: '100px', borderRadius: '8px', 
                      backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', border: '1px dashed #d1d5db', marginBottom: '10px'
                    }}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImagePlus size={32} color="#9ca3af" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setLogoFile(e.target.files[0]);
                        setLogoPreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }} 
                    className="form-input" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" placeholder="e.g. City Medical Clinic" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="form-input">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-input form-textarea" placeholder="Brief description..." rows={3} />
                </div>
                <div className="form-group">
                  <label className="form-label">Address *</label>
                  <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="form-input" placeholder="Full address" required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Operating Hours *</label>
                    <input type="text" value={form.operatingHours} onChange={(e) => setForm({ ...form, operatingHours: e.target.value })} className="form-input" placeholder="8:00 AM - 5:00 PM" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Capacity *</label>
                    <input type="number" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: parseInt(e.target.value) || 0 })} className="form-input" min={1} required />
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

        {showAssignModal && (
          <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Assign Staff to "{assignCenterName}"</h3>
              <p className="assign-modal-subtitle">Select a registered staff member from the list. Each center can only have one staff member.</p>
              <form onSubmit={handleAssignStaff} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Select Staff *</label>
                  {staffList.length === 0 ? (
                    <p className="text-muted">No staff accounts found. Please register a staff member first.</p>
                  ) : (
                    <select value={selectedStaffEmail} onChange={(e) => setSelectedStaffEmail(e.target.value)} className="form-input" required>
                      <option value="">-- Choose Staff --</option>
                      {staffList.map((staff) => {
                        const name = staff.name || `${staff.firstname || ''} ${staff.lastname || ''}`.trim();
                        return (
                          <option key={staff.email} value={staff.email}>
                            {name ? `${name} (${staff.email})` : staff.email}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={assignLoading || staffList.length === 0} className="btn-primary-sm">
                    {assignLoading ? 'Assigning...' : 'Assign Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {centerToDelete && (
          <div className="modal-overlay" onClick={() => setCenterToDelete(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Confirm Deletion</h3>
              <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>Are you sure you want to delete "{centerToDelete.name}"?</p>
              <div className="modal-actions">
                <button type="button" onClick={() => setCenterToDelete(null)} className="btn-secondary">Cancel</button>
                <button type="button" onClick={confirmDelete} className="btn-primary-sm" style={{ backgroundColor: '#ef4444' }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {centerToUnassign && (
          <div className="modal-overlay" onClick={() => setCenterToUnassign(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">Confirm Unassign</h3>
              <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>Remove staff "{centerToUnassign.assignedStaffName || centerToUnassign.assignedStaffEmail}" from "{centerToUnassign.name}"?</p>
              <div className="modal-actions">
                <button type="button" onClick={() => setCenterToUnassign(null)} className="btn-secondary">Cancel</button>
                <button type="button" onClick={confirmUnassign} className="btn-primary-sm" style={{ backgroundColor: '#ef4444' }}>Unassign</button>
              </div>
            </div>
          </div>
        )}

      </div>
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ServiceCenters;
