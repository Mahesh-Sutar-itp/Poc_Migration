import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, X } from 'lucide-react';
import * as suppliersApi from '../api/suppliers';
import * as productsApi from '../api/products';
import type { Product, Supplier, SupplierProduct } from '../types';
import { toast } from '../components/Toast';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

function LinkProductModal({ isOpen, onClose, supplierId, onLinked }: { isOpen: boolean; onClose: () => void; supplierId: number; onLinked: () => void }) {
  const [rawMaterials, setRawMaterials] = useState<Product[]>([]);
  const [formData, setFormData] = useState({ productId: '', pricePerKg: '', leadTimeDays: '', moq: '', preferred: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) productsApi.searchProducts({ type: 'RAW_MATERIAL' }).then(setRawMaterials).catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) return toast('Select a raw material', 'error');
    setLoading(true);
    try {
      await suppliersApi.linkProduct(supplierId, {
        productId: Number(formData.productId),
        pricePerKg: formData.pricePerKg ? Number(formData.pricePerKg) : undefined,
        leadTimeDays: formData.leadTimeDays ? Number(formData.leadTimeDays) : undefined,
        moq: formData.moq ? Number(formData.moq) : undefined,
        preferred: formData.preferred,
      });
      toast('Raw material linked', 'success');
      onLinked();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to link product', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Link Raw Material</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Raw Material</label>
            <select className="form-select" value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })}>
              <option value="">-- Choose --</option>
              {rawMaterials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Price / kg</label>
              <input type="number" step="0.01" className="form-input" value={formData.pricePerKg} onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Lead Time (days)</label>
              <input type="number" className="form-input" value={formData.leadTimeDays} onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">MOQ</label>
              <input type="number" className="form-input" value={formData.moq} onChange={(e) => setFormData({ ...formData, moq: e.target.value })} />
            </div>
          </div>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={formData.preferred} onChange={(e) => setFormData({ ...formData, preferred: e.target.checked })} />
            <label className="form-label" style={{ margin: 0 }}>Preferred supplier for this material</label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading}>Link</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SupplierDetail() {
  const { id } = useParams();
  const supplierId = Number(id);
  const { hasRole } = useAuth();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [links, setLinks] = useState<SupplierProduct[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);

  const loadData = () => {
    suppliersApi.fetchSupplier(supplierId).then(setSupplier).catch(() => toast('Failed to load supplier', 'error'));
    suppliersApi.fetchSupplierProducts(supplierId).then(setLinks).catch(() => {});
  };

  useEffect(() => { loadData(); }, [supplierId]);

  const handleUnlink = async (productId: number) => {
    try {
      await suppliersApi.unlinkProduct(supplierId, productId);
      toast('Product unlinked', 'success');
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to unlink product', 'error');
    }
  };

  const canManage = hasRole('ADMIN', 'PURCHASING');

  if (!supplier) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h1>{supplier.name}</h1>
        <p className="text-muted">{supplier.code}</p>
        <div className="grid grid-cols-2" style={{ marginTop: '1rem' }}>
          <p><strong>Contact:</strong> {supplier.contactName} ({supplier.contactEmail})</p>
          <p><strong>Phone:</strong> {supplier.phone || '—'}</p>
          <p><strong>Address:</strong> {supplier.address || '—'}</p>
          <p><strong>Rating:</strong> {supplier.rating ?? '—'} / 5</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: 0 }}>Approved Raw Materials</h2>
          {canManage && <button className="btn btn-secondary" onClick={() => setModalOpen(true)}><Plus size={16} /> Link Material</button>}
        </div>
        {links.length === 0 ? (
          <p className="text-muted">No raw materials linked to this supplier yet.</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.75rem 0' }}>Material</th>
                <th>Price/kg</th>
                <th>Lead Time</th>
                <th>MOQ</th>
                <th>Preferred</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0' }}>{l.product?.name}</td>
                  <td>${l.pricePerKg}</td>
                  <td>{l.leadTimeDays} days</td>
                  <td>{l.moq}</td>
                  <td>{l.preferred ? <span className="badge badge-validated">Yes</span> : <span className="text-muted">No</span>}</td>
                  <td>{canManage && l.product && (
                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleUnlink(l.product!.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <LinkProductModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} supplierId={supplierId} onLinked={loadData} />
    </div>
  );
}
