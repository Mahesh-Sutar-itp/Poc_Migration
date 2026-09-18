import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Send, ThumbsDown, ThumbsUp, Wrench } from 'lucide-react';
import * as changeRequestsApi from '../api/changeRequests';
import type { ChangeRequest, ChangeRequestStatus } from '../types';
import { toast } from '../components/Toast';
import { ApiError } from '../api/client';
import { formatDateTime } from '../utils';
import { useAuth } from '../auth/AuthContext';

const STATUS_BADGE: Record<ChangeRequestStatus, string> = {
  DRAFT: 'badge-draft',
  SUBMITTED: 'badge-validation',
  UNDER_REVIEW: 'badge-validation',
  APPROVED: 'badge-validated',
  REJECTED: 'badge-archived',
  IMPLEMENTED: 'badge-validated',
};

export function ChangeRequestDetail() {
  const { id } = useParams();
  const crId = Number(id);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [cr, setCr] = useState<ChangeRequest | null>(null);

  const loadData = () => {
    changeRequestsApi.fetchChangeRequest(crId).then(setCr).catch(() => toast('Failed to load change request', 'error'));
  };

  useEffect(() => { loadData(); }, [crId]);

  const canDecide = hasRole('ADMIN', 'PLM_MANAGER');
  const canSubmit = hasRole('ADMIN', 'PLM_MANAGER', 'QUALITY_MANAGER');

  const handleSubmit = async () => {
    try {
      await changeRequestsApi.submitChangeRequest(crId);
      toast('Change request submitted for review', 'success');
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to submit', 'error');
    }
  };

  const handleDecide = async (approve: boolean) => {
    const comment = window.prompt(approve ? 'Approval comment (optional):' : 'Rejection reason:') || undefined;
    if (!approve && !comment) return toast('A rejection reason is required', 'error');
    try {
      await changeRequestsApi.decideChangeRequest(crId, approve, comment);
      toast(`Change request ${approve ? 'approved' : 'rejected'}`, 'success');
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to record decision', 'error');
    }
  };

  const handleImplement = async () => {
    try {
      await changeRequestsApi.implementChangeRequest(crId);
      toast('Change request marked as implemented', 'success');
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to mark implemented', 'error');
    }
  };

  if (!cr) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>{cr.title}</h1>
            <p className="text-muted" style={{ marginTop: '0.5rem' }}>
              on{' '}
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/products/${cr.product.id}`)}>
                {cr.product.name}
              </span>{' '}
              • requested by {cr.requestedBy} • {formatDateTime(cr.requestedAt)}
            </p>
          </div>
          <span className={`badge ${STATUS_BADGE[cr.status]}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
            {cr.status.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2" style={{ marginTop: '1.5rem' }}>
          <div>
            <h3>Description</h3>
            <p className="text-muted">{cr.description || 'None'}</p>
          </div>
          <div>
            <h3>Reason</h3>
            <p className="text-muted">{cr.reason || 'None'}</p>
          </div>
          <div>
            <h3>Impact</h3>
            <p className="text-muted">{cr.impact || 'None'}</p>
          </div>
          {cr.decidedBy && (
            <div>
              <h3>Decision</h3>
              <p className="text-muted">{cr.decidedBy} • {formatDateTime(cr.decidedAt)}</p>
              {cr.decisionComment && <p className="text-muted">"{cr.decisionComment}"</p>}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
          {cr.status === 'DRAFT' && canSubmit && (
            <button className="btn btn-secondary" onClick={handleSubmit}><Send size={16} /> Submit for Review</button>
          )}
          {cr.status === 'UNDER_REVIEW' && canDecide && (
            <>
              <button className="btn btn-success" onClick={() => handleDecide(true)}><ThumbsUp size={16} /> Approve</button>
              <button className="btn btn-danger" onClick={() => handleDecide(false)}><ThumbsDown size={16} /> Reject</button>
            </>
          )}
          {cr.status === 'APPROVED' && canDecide && (
            <button className="btn" onClick={handleImplement}><Wrench size={16} /> Mark Implemented</button>
          )}
          {cr.status === 'IMPLEMENTED' && (
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
              <CheckCircle size={18} /> This change has been implemented.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
