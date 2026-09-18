import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ClipboardList, FolderKanban, GitPullRequest, Package, Warehouse } from 'lucide-react';
import * as reportsApi from '../api/reports';
import * as productsApi from '../api/products';
import type { DashboardSummary, ActivityRow } from '../api/reports';
import type { Product } from '../types';
import { toast } from '../components/Toast';
import { productStateBadgeClass } from '../utils';

function StatCard({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: React.ReactNode }) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderTop: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color }}>{icon}</div>
      <h3 className="text-muted">{label}</h3>
      <p style={{ fontSize: '2.25rem', fontWeight: 'bold', color }}>{value}</p>
    </div>
  );
}

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const navigate = useNavigate();

  const loadData = () => {
    reportsApi.fetchDashboardSummary().then(setSummary).catch(() => toast('Failed to load dashboard summary', 'error'));
    productsApi.fetchProducts(0, 6).then((p) => setProducts(p.content)).catch(() => {});
    reportsApi.fetchRecentActivity(10).then(setActivity).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!summary) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Cross-module overview of your PLM portfolio</p>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: '1.5rem' }}>
        <StatCard label="Draft Products" value={summary.productsByState.draft} color="#94a3b8" icon={<Package />} />
        <StatCard label="In Validation" value={summary.productsByState.inValidation} color="var(--warning)" icon={<Package />} />
        <StatCard label="Validated" value={summary.productsByState.validated} color="var(--success)" icon={<Package />} />
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: '2.5rem' }}>
        <StatCard label="Open Non-Conformances" value={summary.openNonConformances} color="var(--danger)" icon={<AlertTriangle />} />
        <StatCard label="Active Change Requests" value={summary.activeChangeRequests} color="var(--accent-primary)" icon={<GitPullRequest />} />
        <StatCard label="Projects In Progress" value={summary.projectsInProgress} color="#a78bfa" icon={<FolderKanban />} />
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: '2.5rem' }}>
        <StatCard label="Pending Corrective Actions" value={summary.pendingCorrectiveActions} color="var(--warning)" icon={<ClipboardList />} />
        <StatCard label="Low Stock Lots" value={summary.lowStockLots} color="var(--danger)" icon={<Warehouse />} />
        <StatCard label="Unread Notifications" value={summary.unreadNotifications} color="var(--accent-primary)" icon={<AlertTriangle />} />
      </div>

      <div className="grid grid-cols-2">
        <div>
          <h2>Recent Products</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {products.map((p) => (
              <div
                key={p.id}
                className="glass-panel"
                style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => navigate(`/products/${p.id}`)}
              >
                <div>
                  <strong>{p.name}</strong>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>{p.code}</p>
                </div>
                <span className={`badge ${productStateBadgeClass(p.state)}`}>{p.state.replace('_', ' ')}</span>
              </div>
            ))}
            {products.length === 0 && <p className="text-muted">No products yet.</p>}
          </div>
        </div>

        <div>
          <h2>Recent Activity</h2>
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
            {activity.length === 0 ? (
              <p className="text-muted">No activity recorded yet.</p>
            ) : (
              activity.map((a, idx) => (
                <div key={idx} style={{ padding: '0.6rem 0', borderBottom: idx < activity.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong>{a.entityType}</strong> #{a.entityId} — {a.action}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {a.performedBy || 'system'} • {new Date(a.performedAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
