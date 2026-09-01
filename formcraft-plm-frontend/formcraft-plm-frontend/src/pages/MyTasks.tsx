import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardList } from 'lucide-react';
import * as productsApi from '../api/products';
import type { WorkflowTask } from '../types';
import { toast } from '../components/Toast';
import { ApiError } from '../api/client';
import { formatDateTime } from '../utils';

export function MyTasks() {
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const navigate = useNavigate();

  const loadData = () => {
    productsApi.fetchMyTasks().then(setTasks).catch(() => toast('Failed to load tasks', 'error'));
  };

  useEffect(() => { loadData(); }, []);

  const handleComplete = async (task: WorkflowTask) => {
    if (!task.productId) return toast('This task has no linked product', 'error');
    try {
      await productsApi.completeTask(task.productId, task.id);
      toast('Task marked complete', 'success');
      loadData();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to complete task', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1>My Tasks</h1>
          <p className="text-muted">Workflow review tasks assigned to you</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {tasks.length === 0 ? (
          <p className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={18} /> No pending tasks assigned to you.
          </p>
        ) : (
          tasks.map((t) => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ cursor: t.productId ? 'pointer' : 'default' }} onClick={() => t.productId && navigate(`/products/${t.productId}`)}>
                <strong>{t.taskName}</strong>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>{t.description}</p>
                <p className="text-muted" style={{ fontSize: '0.75rem' }}>Due {formatDateTime(t.dueDate)}</p>
              </div>
              {t.status === 'PENDING' ? (
                <button className="btn btn-success" style={{ padding: '0.35rem 0.75rem' }} onClick={() => handleComplete(t)}>
                  <CheckCircle2 size={14} /> Complete
                </button>
              ) : (
                <span className="badge badge-validated">{t.status}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
