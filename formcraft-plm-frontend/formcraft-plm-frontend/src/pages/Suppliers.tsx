import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Star } from 'lucide-react';
import * as suppliersApi from '../api/suppliers';
import type { SupplierRequest } from '../api/suppliers';
import type { Supplier } from '../types';
import { toast } from '../components/Toast';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

function NewSupplierModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState<SupplierRequest>({ code: '', name: '', contactName: '', contactEmail: '', phone: '', address: '', rating: 3 });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await suppliersApi.createSupplier(formData);
      toast('Supplier created', 'success');
      onCreated();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to create supplier', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>New Supplier</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Code</label>
            <input className="form-input" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. SUP-004" />
          </div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Contact Name</label>
              <input className="form-input" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Contact Email</label>
              <input className="form-input" type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-input" rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Rating (1-5)</label>
            <input type="number" min={1} max={5} className="form-input" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })} />
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

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const loadData = () => {
    suppliersApi.fetchSuppliers().then(setSuppliers).catch(() => toast('Failed to load suppliers', 'error'));
  };

  useEffect(() => { loadData(); }, []);

  const canManage = hasRole('ADMIN', 'PURCHASING');

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1>Suppliers</h1>
          <p className="text-muted">Approved raw material and packaging suppliers</p>
        </div>
        {canManage && <button className="btn" onClick={() => setModalOpen(true)}><Plus size={18} /> New Supplier</button>}
      </div>

      <div className="grid grid-cols-3">
        {suppliers.map((s) => (
          <div key={s.id} className="glass-panel" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => navigate(`/suppliers/${s.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h3>{s.name}</h3>
              {!s.active && <span className="badge badge-archived">Inactive</span>}
            </div>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>{s.code}</p>
            {s.rating && (
              <div style={{ display: 'flex', gap: '0.15rem', marginTop: '0.5rem' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill={i < s.rating! ? 'var(--warning)' : 'none'} color="var(--warning)" />
                ))}
              </div>
            )}
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{s.contactEmail}</p>
          </div>
        ))}
        {suppliers.length === 0 && <p className="text-muted">No suppliers yet.</p>}
      </div>

      <NewSupplierModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onCreated={loadData} />
    </div>
  );
}
