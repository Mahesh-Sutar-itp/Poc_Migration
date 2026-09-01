import { useEffect, useState } from 'react';
import { Minus, Plus, Settings2, X } from 'lucide-react';
import * as inventoryApi from '../api/inventory';
import * as productsApi from '../api/products';
import * as suppliersApi from '../api/suppliers';
import type { Product, StockLot, Supplier } from '../types';
import { toast } from '../components/Toast';
import { ApiError } from '../api/client';
import { formatDate } from '../utils';
import { useAuth } from '../auth/AuthContext';

function ReceiveLotModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: () => void }) {
  const [materials, setMaterials] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState({ productId: '', lotNumber: '', quantity: '', unit: 'kg', expiryDate: '', supplierId: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      productsApi.searchProducts({ type: 'RAW_MATERIAL' }).then(setMaterials).catch(() => {});
      suppliersApi.fetchSuppliers().then(setSuppliers).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.lotNumber || !formData.quantity) return toast('Fill in all required fields', 'error');
    setLoading(true);
    try {
      await inventoryApi.receiveLot(Number(formData.productId), {
        lotNumber: formData.lotNumber,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        expiryDate: formData.expiryDate || undefined,
        supplierId: formData.supplierId ? Number(formData.supplierId) : undefined,
      });
      toast('Stock lot received', 'success');
      onCreated();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to receive stock lot', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Receive Stock Lot</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Raw Material</label>
            <select className="form-select" value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })}>
              <option value="">-- Choose --</option>
              {materials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Lot Number</label>
              <input className="form-input" required value={formData.lotNumber} onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })} placeholder="e.g. LOT-2026-042" />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Quantity</label>
              <input type="number" step="0.01" className="form-input" required value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Unit</label>
              <input className="form-input" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Expiry Date</label>
              <input type="date" className="form-input" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Supplier</label>
              <select className="form-select" value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}>
                <option value="">-- None --</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading}>Receive</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MovementModal({
  isOpen,
  onClose,
  lot,
  mode,
  onDone,
}: {
  isOpen: boolean;
  onClose: () => void;
  lot: StockLot | null;
  mode: 'consume' | 'receive' | 'adjust';
  onDone: () => void;
}) {
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !lot) return null;

  const title = mode === 'consume' ? 'Consume Stock' : mode === 'receive' ? 'Receive More Stock' : 'Adjust Stock';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(quantity);
    if (!value) return toast('Enter a quantity', 'error');
    setLoading(true);
    try {
      if (mode === 'consume') await inventoryApi.consumeFromLot(lot.id, value, reference || undefined);
      else if (mode === 'receive') await inventoryApi.receiveIntoLot(lot.id, value, reference || undefined);
      else await inventoryApi.adjustLot(lot.id, value, reference || undefined);
      toast('Stock movement recorded', 'success');
      onDone();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to record movement', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>{title}: {lot.lotNumber}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <p className="text-muted" style={{ marginBottom: '1rem' }}>On hand: {lot.quantityOnHand} {lot.unit}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{mode === 'adjust' ? 'Delta (+/-)' : 'Quantity'}</label>
            <input type="number" step="0.01" className="form-input" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Reference / Note</label>
            <input className="form-input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. Batch #FP-001-042" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading}>Confirm</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Inventory() {
  const [lots, setLots] = useState<StockLot[]>([]);
  const [lowStock, setLowStock] = useState<StockLot[]>([]);
  const [isReceiveModalOpen, setReceiveModalOpen] = useState(false);
  const [movementLot, setMovementLot] = useState<StockLot | null>(null);
  const [movementMode, setMovementMode] = useState<'consume' | 'receive' | 'adjust'>('consume');
  const { hasRole } = useAuth();

  const loadData = () => {
    inventoryApi.fetchLots().then(setLots).catch(() => toast('Failed to load stock lots', 'error'));
    inventoryApi.fetchLowStock().then(setLowStock).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const canManage = hasRole('ADMIN', 'PURCHASING');
  const lowStockIds = new Set(lowStock.map((l) => l.id));

  const openMovement = (lot: StockLot, mode: 'consume' | 'receive' | 'adjust') => {
    setMovementLot(lot);
    setMovementMode(mode);
  };

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1>Inventory</h1>
          <p className="text-muted">Raw material lot tracking</p>
        </div>
        {canManage && <button className="btn" onClick={() => setReceiveModalOpen(true)}><Plus size={18} /> Receive Lot</button>}
      </div>

      {lowStock.length > 0 && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
          <strong style={{ color: 'var(--danger)' }}>{lowStock.length} lot(s) low on stock</strong>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {lots.length === 0 ? (
          <p className="text-muted">No stock lots yet.</p>
        ) : (
          <div className="table-responsive">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.75rem 0' }}>Material</th>
                <th>Lot #</th>
                <th>On Hand</th>
                <th>Expiry</th>
                <th>Supplier</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {lots.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0' }}>{l.product?.name}</td>
                  <td>{l.lotNumber}</td>
                  <td style={{ color: lowStockIds.has(l.id) ? 'var(--danger)' : undefined, fontWeight: lowStockIds.has(l.id) ? 700 : 400 }}>
                    {l.quantityOnHand} {l.unit}
                  </td>
                  <td>{formatDate(l.expiryDate)}</td>
                  <td>{l.supplier?.name || '—'}</td>
                  {canManage && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} title="Receive more" onClick={() => openMovement(l, 'receive')}>
                          <Plus size={14} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} title="Consume" onClick={() => openMovement(l, 'consume')}>
                          <Minus size={14} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} title="Adjust" onClick={() => openMovement(l, 'adjust')}>
                          <Settings2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <ReceiveLotModal isOpen={isReceiveModalOpen} onClose={() => setReceiveModalOpen(false)} onCreated={loadData} />
      <MovementModal isOpen={!!movementLot} onClose={() => setMovementLot(null)} lot={movementLot} mode={movementMode} onDone={loadData} />
    </div>
  );
}
