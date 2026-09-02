import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as ncApi from '../api/nonConformances';
import type { NonConformance } from '../types';
import { toast } from '../components/Toast';
import { formatDateTime } from '../utils';

const SEVERITY_COLOR: Record<string, string> = { MINOR: 'var(--warning)', MAJOR: '#f97316', CRITICAL: 'var(--danger)' };

export function NonConformances() {
  const [ncs, setNcs] = useState<NonConformance[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    ncApi.fetchNonConformances().then(setNcs).catch(() => toast('Failed to load non-conformances', 'error'));
    ncApi.fetchNcStats().then(setStats).catch(() => {});
  }, []);

  const filtered = filter ? ncs.filter((n) => n.status === filter) : ncs;

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1>Non-Conformances</h1>
          <p className="text-muted">Quality issues and their corrective actions (raise from a product's Quality tab)</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid var(--danger)' }}>
            <h3 className="text-muted">Open</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>{stats.open}</p>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid var(--warning)' }}>
            <h3 className="text-muted">In Progress</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>{stats.inProgress}</p>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid var(--success)' }}>
            <h3 className="text-muted">Closed</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.closed}</p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {filtered.length === 0 ? (
          <p className="text-muted">No non-conformances found.</p>
        ) : (
          filtered.map((nc) => (
            <div
              key={nc.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
              onClick={() => navigate(`/non-conformances/${nc.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: SEVERITY_COLOR[nc.severity] }} />
                <div>
                  <strong>{nc.title}</strong>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>{nc.product?.name} • {formatDateTime(nc.raisedAt)}</p>
                </div>
              </div>
              <span className={`badge ${nc.status === 'CLOSED' ? 'badge-validated' : 'badge-validation'}`}>{nc.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
