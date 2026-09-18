import { useEffect, useState } from 'react';
import { Key, Plus, X } from 'lucide-react';
import * as usersApi from '../api/users';
import type { CreateUserRequest } from '../api/users';
import type { AppUser, UserRole } from '../types';
import { toast } from '../components/Toast';
import { ApiError } from '../api/client';
import { formatDateTime } from '../utils';

const ROLES: UserRole[] = ['ADMIN', 'PLM_MANAGER', 'QUALITY_MANAGER', 'PURCHASING', 'VIEWER'];

function NewUserModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState<CreateUserRequest>({ username: '', password: '', fullName: '', email: '', role: 'VIEWER' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await usersApi.createUser(formData);
      toast('User created', 'success');
      onCreated();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to create user', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>New User</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" minLength={8} className="form-input" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Full Name</label>
              <input className="form-input" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading}>Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Users() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);

  const loadData = () => {
    usersApi.fetchUsers().then(setUsers).catch(() => toast('Failed to load users', 'error'));
  };

  useEffect(() => { loadData(); }, []);

  const handleRoleChange = async (user: AppUser, role: UserRole) => {
    try {
      await usersApi.updateUser(user.id, { fullName: user.fullName, email: user.email, role, enabled: user.enabled });
      toast('Role updated', 'success');
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to update role', 'error');
    }
  };

  const handleToggleEnabled = async (user: AppUser) => {
    try {
      await usersApi.updateUser(user.id, { fullName: user.fullName, email: user.email, role: user.role, enabled: !user.enabled });
      toast(user.enabled ? 'User disabled' : 'User enabled', 'success');
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to update user', 'error');
    }
  };

  const handleResetPassword = async (user: AppUser) => {
    const newPassword = window.prompt(`New password for ${user.username} (min 8 chars):`);
    if (!newPassword) return;
    try {
      await usersApi.resetPassword(user.id, newPassword);
      toast('Password reset', 'success');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to reset password', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1>Users</h1>
          <p className="text-muted">Manage accounts and roles</p>
        </div>
        <button className="btn" onClick={() => setModalOpen(true)}><Plus size={18} /> New User</button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
       <div className="table-responsive">
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
              <th style={{ padding: '0.75rem 0' }}>Username</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem 0' }}>{u.username}</td>
                <td>{u.fullName || '—'}</td>
                <td>
                  <select className="form-select" style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} value={u.role} onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td>
                  <span className={`badge ${u.enabled ? 'badge-validated' : 'badge-archived'}`}>{u.enabled ? 'Active' : 'Disabled'}</span>
                </td>
                <td className="text-muted" style={{ fontSize: '0.8rem' }}>{formatDateTime(u.createdAt)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.6rem' }} onClick={() => handleResetPassword(u)}>
                      <Key size={14} />
                    </button>
                    <button className={u.enabled ? 'btn btn-danger' : 'btn btn-success'} style={{ padding: '0.25rem 0.6rem' }} onClick={() => handleToggleEnabled(u)}>
                      {u.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
      </div>

      <NewUserModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onCreated={loadData} />
    </div>
  );
}
