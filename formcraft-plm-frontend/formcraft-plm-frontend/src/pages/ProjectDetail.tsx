import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Plus, Trash2, X } from 'lucide-react';
import * as projectsApi from '../api/projects';
import * as productsApi from '../api/products';
import type { MilestoneStatus, Product, Project, ProjectStatus } from '../types';
import { toast } from '../components/Toast';
import { ApiError } from '../api/client';
import { formatDate } from '../utils';

function AddMilestoneModal({ isOpen, onClose, projectId, nextGate, onAdded }: { isOpen: boolean; onClose: () => void; projectId: number; nextGate: number; onAdded: () => void }) {
  const [formData, setFormData] = useState({ name: '', gateNumber: nextGate, dueDate: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => setFormData((f) => ({ ...f, gateNumber: nextGate })), [nextGate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await projectsApi.addMilestone(projectId, { name: formData.name, gateNumber: formData.gateNumber, dueDate: formData.dueDate || undefined });
      toast('Milestone added', 'success');
      onAdded();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to add milestone', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Add Milestone</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Gate 2: Formulation & Costing" />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Gate Number</label>
              <input type="number" min={1} className="form-input" required value={formData.gateNumber} onChange={(e) => setFormData({ ...formData, gateNumber: Number(e.target.value) })} />
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

function LinkProductModal({ isOpen, onClose, projectId, onLinked }: { isOpen: boolean; onClose: () => void; projectId: number; onLinked: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) productsApi.fetchProducts(0, 200).then((p) => setProducts(p.content)).catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return toast('Select a product', 'error');
    setLoading(true);
    try {
      await projectsApi.linkProductToProject(projectId, Number(productId));
      toast('Product linked', 'success');
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
          <h2>Link Product</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product</label>
            <select className="form-select" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">-- Choose --</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
            </select>
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

export function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [isMilestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [isLinkModalOpen, setLinkModalOpen] = useState(false);

  const loadData = () => {
    projectsApi.fetchProject(projectId).then(setProject).catch(() => toast('Failed to load project', 'error'));
  };

  useEffect(() => { loadData(); }, [projectId]);

  const handleStatusChange = async (status: ProjectStatus) => {
    try {
      await projectsApi.updateProjectStatus(projectId, status);
      toast('Project status updated', 'success');
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to update status', 'error');
    }
  };

  const handleMilestoneStatus = async (milestoneId: number, status: MilestoneStatus) => {
    try {
      await projectsApi.updateMilestoneStatus(projectId, milestoneId, status);
      toast('Milestone updated', 'success');
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to update milestone', 'error');
    }
  };

  const handleUnlink = async (productId: number) => {
    try {
      await projectsApi.unlinkProductFromProject(projectId, productId);
      toast('Product unlinked', 'success');
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to unlink product', 'error');
    }
  };

  if (!project) return <div style={{ padding: '2rem' }}>Loading...</div>;

  const nextGate = (project.milestones?.reduce((max, m) => Math.max(max, m.gateNumber), 0) || 0) + 1;

  return (
    <div className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>{project.name}</h1>
            <p className="text-muted" style={{ marginTop: '0.5rem' }}>{project.description}</p>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Owner: {project.owner || '—'} • Target launch: {formatDate(project.targetLaunchDate)}
            </p>
          </div>
          <select className="form-select" value={project.status} onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}>
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: 0 }}>Stage Gates</h2>
            <button className="btn btn-secondary" onClick={() => setMilestoneModalOpen(true)}><Plus size={16} /> Add Gate</button>
          </div>
          {(project.milestones || []).length === 0 ? (
            <p className="text-muted">No milestones yet.</p>
          ) : (
            (project.milestones || []).map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <strong>Gate {m.gateNumber}: {m.name}</strong>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>Due {formatDate(m.dueDate)}</p>
                </div>
                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                  value={m.status}
                  onChange={(e) => handleMilestoneStatus(m.id, e.target.value as MilestoneStatus)}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
            ))
          )}
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: 0 }}>Linked Products</h2>
            <button className="btn btn-secondary" onClick={() => setLinkModalOpen(true)}><Plus size={16} /> Link</button>
          </div>
          {(project.products || []).length === 0 ? (
            <p className="text-muted">No products linked yet.</p>
          ) : (
            (project.products || []).map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/products/${p.id}`)}>
                  <CheckCircle size={14} style={{ marginRight: '0.4rem', display: 'inline' }} />{p.name}
                </span>
                <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleUnlink(p.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <AddMilestoneModal isOpen={isMilestoneModalOpen} onClose={() => setMilestoneModalOpen(false)} projectId={projectId} nextGate={nextGate} onAdded={loadData} />
      <LinkProductModal isOpen={isLinkModalOpen} onClose={() => setLinkModalOpen(false)} projectId={projectId} onLinked={loadData} />
    </div>
  );
}
