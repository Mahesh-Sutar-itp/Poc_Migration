import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Plus, X } from 'lucide-react';
import * as ncApi from '../api/nonConformances';
import type { CorrectiveAction, NonConformance } from '../types';
import { toast } from '../components/Toast';
import { ApiError } from '../api/client';
import { formatDate, formatDateTime } from '../utils';
import { useAuth } from '../auth/AuthContext';

const SEVERITY_COLOR: Record<string, string> = { MINOR: 'var(--warning)', MAJOR: '#f97316', CRITICAL: 'var(--danger)' };

function AddCapaModal({ isOpen, onClose, ncId, onAdded }: { isOpen: boolean; onClose: () => void; ncId: number; onAdded: () => void }) {
  const [formData, setFormData] = useState({ description: '', owner: '', dueDate: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ncApi.addCorrectiveAction(ncId, {
        description: formData.description,
        owner: formData.owner || undefined,
        dueDate: formData.dueDate || undefined,
      });
      toast('Corrective action added', 'success');
      onAdded();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to add corrective action', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Add Corrective Action</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Owner</label>
              <input className="form-input" value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading}>Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function NonConformanceDetail() {
  const { id } = useParams();
  const ncId = Number(id);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [nc, setNc] = useState<NonConformance | null>(null);
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);

  const loadData = () => {
    ncApi.fetchNonConformance(ncId).then(setNc).catch(() => toast('Failed to load non-conformance', 'error'));
    ncApi.fetchCorrectiveActions(ncId).then(setActions).catch(() => {});
  };

  useEffect(() => { loadData(); }, [ncId]);

  const canManage = hasRole('ADMIN', 'QUALITY_MANAGER');

  const handleTransition = async (target: 'IN_PROGRESS') => {
    try {
      await ncApi.transitionNonConformance(ncId, target);
      toast('Status updated', 'success');
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to update status', 'error');
    }
  };

  const handleClose = async () => {
    try {
      await ncApi.closeNonConformance(ncId);
      toast('Non-conformance closed', 'success');
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to close non-conformance', 'error');
    }
  };

  const handleCloseAction = async (actionId: number) => {
    try {
      await ncApi.closeCorrectiveAction(ncId, actionId);
      toast('Corrective action closed', 'success');
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to close corrective action', 'error');
    }
  };

  if (!nc) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: SEVERITY_COLOR[nc.severity] }} />
              {nc.title}
            </h1>
            <p className="text-muted" style={{ marginTop: '0.5rem' }}>
              on{' '}
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/products/${nc.product.id}`)}>
                {nc.product.name}
              </span>{' '}
              • raised by {nc.raisedBy} • {formatDateTime(nc.raisedAt)}
            </p>
          </div>
          <span className={`badge ${nc.status === 'CLOSED' ? 'badge-validated' : 'badge-validation'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
            {nc.status}
          </span>
        </div>
        <p style={{ marginTop: '1rem' }}>{nc.description || 'No description provided.'}</p>

        {canManage && nc.status !== 'CLOSED' && (
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            {nc.status === 'OPEN' && (
              <button className="btn btn-secondary" onClick={() => handleTransition('IN_PROGRESS')}>Start Investigation</button>
            )}
            {nc.status === 'IN_PROGRESS' && (
              <button className="btn btn-success" onClick={handleClose}><CheckCircle size={16} /> Close Non-Conformance</button>
            )}
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: 0 }}>Corrective Actions (CAPA)</h2>
          {canManage && nc.status !== 'CLOSED' && (
            <button className="btn btn-secondary" onClick={() => setModalOpen(true)}><Plus size={16} /> Add Action</button>
          )}
        </div>
        {actions.length === 0 ? (
          <p className="text-muted">No corrective actions yet. {nc.status !== 'CLOSED' && 'The NC can only be closed once all actions are done (or none exist).'}</p>
        ) : (
          actions.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p>{a.description}</p>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>Owner: {a.owner || '—'} • Due: {formatDate(a.dueDate)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`badge ${a.status === 'DONE' ? 'badge-validated' : 'badge-validation'}`}>{a.status}</span>
                {canManage && a.status === 'OPEN' && (
                  <button className="btn btn-success" style={{ padding: '0.25rem 0.6rem' }} onClick={() => handleCloseAction(a.id)}>Mark Done</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <AddCapaModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} ncId={ncId} onAdded={loadData} />
    </div>
  );
}
