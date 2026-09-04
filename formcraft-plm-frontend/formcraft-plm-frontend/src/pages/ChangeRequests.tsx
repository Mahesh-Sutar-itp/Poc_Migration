import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as changeRequestsApi from '../api/changeRequests';
import type { ChangeRequest, ChangeRequestStatus } from '../types';
import { toast } from '../components/Toast';
import { formatDateTime } from '../utils';

const STATUS_BADGE: Record<ChangeRequestStatus, string> = {
  DRAFT: 'badge-draft',
  SUBMITTED: 'badge-validation',
  UNDER_REVIEW: 'badge-validation',
  APPROVED: 'badge-validated',
  REJECTED: 'badge-archived',
  IMPLEMENTED: 'badge-validated',
};

export function ChangeRequests() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    changeRequestsApi.fetchChangeRequests().then(setRequests).catch(() => toast('Failed to load change requests', 'error'));
  }, []);

  const filtered = filter ? requests.filter((r) => r.status === filter) : requests;

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1>Change Requests</h1>
          <p className="text-muted">Engineering/formulation change requests (ECR/ECO) — create from a product's Change Requests tab</p>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="IMPLEMENTED">Implemented</option>
        </select>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {filtered.length === 0 ? (
          <p className="text-muted">No change requests found.</p>
        ) : (
          filtered.map((cr) => (
            <div
              key={cr.id}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
              onClick={() => navigate(`/change-requests/${cr.id}`)}
            >
              <div>
                <strong>{cr.title}</strong>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>{cr.product?.name} • by {cr.requestedBy} • {formatDateTime(cr.requestedAt)}</p>
              </div>
              <span className={`badge ${STATUS_BADGE[cr.status]}`}>{cr.status.replace('_', ' ')}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
