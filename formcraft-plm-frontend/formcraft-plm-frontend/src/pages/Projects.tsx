import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, X } from 'lucide-react';
import * as projectsApi from '../api/projects';
import type { Project, ProjectStatus } from '../types';
import { toast } from '../components/Toast';
import { ApiError } from '../api/client';
import { formatDate } from '../utils';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../auth/AuthContext';

const STATUS_BADGE: Record<ProjectStatus, string> = {
  PLANNING: 'badge-draft',
  IN_PROGRESS: 'badge-validation',
  ON_HOLD: 'badge-archived',
  COMPLETED: 'badge-validated',
  CANCELLED: 'badge-archived',
};

function NewProjectModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState({ name: '', description: '', owner: '', targetLaunchDate: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await projectsApi.createProject({
        name: formData.name,
        description: formData.description || undefined,
        owner: formData.owner || undefined,
        targetLaunchDate: formData.targetLaunchDate || undefined,
      });
      toast('Project created', 'success');
      onCreated();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to create project', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>New NPD Project</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Owner</label>
              <input className="form-input" value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Target Launch Date</label>
              <input type="date" className="form-input" value={formData.targetLaunchDate} onChange={(e) => setFormData({ ...formData, targetLaunchDate: e.target.value })} />
            </div>
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

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canDelete = hasRole('ADMIN', 'PLM_MANAGER');

  const loadData = () => {
    projectsApi.fetchProjects().then(setProjects).catch(() => toast('Failed to load projects', 'error'));
  };

  useEffect(() => { loadData(); }, []);

  const filtered = statusFilter ? projects.filter((p) => p.status === statusFilter) : projects;

  const isDeletable = (status: ProjectStatus) => status === 'PLANNING' || status === 'CANCELLED';

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await projectsApi.deleteProject(deleteTarget.id);
      toast('Project deleted', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to delete project', 'error');
    }
    setDeleting(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1>Projects</h1>
          <p className="text-muted">NPD stage-gate projects</p>
        </div>
        <button className="btn" onClick={() => setModalOpen(true)}><Plus size={18} /> New Project</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Stages</option>
          <option value="PLANNING">Planning</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="grid grid-cols-3">
        {filtered.map((p) => (
          <div key={p.id} className="glass-panel" style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onClick={() => navigate(`/projects/${p.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h3>{p.name}</h3>
              <span className={`badge ${STATUS_BADGE[p.status]}`}>{p.status.replace('_', ' ')}</span>
            </div>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>{p.description || 'No description'}</p>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Owner: {p.owner || '—'} • Target: {formatDate(p.targetLaunchDate)}
            </p>
            {canDelete && isDeletable(p.status) && (
              <button
                className="btn btn-danger"
                style={{ alignSelf: 'flex-end', padding: '0.25rem 0.5rem' }}
                title="Delete project"
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-muted">No projects found.</p>}
      </div>

      <NewProjectModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onCreated={loadData} />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete project?"
        message={`This will permanently delete "${deleteTarget?.name}" and all its related data (milestones, linked products). This cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
