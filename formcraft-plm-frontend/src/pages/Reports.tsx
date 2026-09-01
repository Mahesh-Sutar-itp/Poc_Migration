import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as reportsApi from '../api/reports';
import * as productsApi from '../api/products';
import type { AllergenMatrix, ActivityRow, CostBreakdownRow, QualityPassRate } from '../api/reports';
import type { Product } from '../types';
import { toast } from '../components/Toast';
import { formatDateTime } from '../utils';

const PIE_COLORS = ['#3b82f6', '#10b981'];

export function Reports() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdownRow[]>([]);
  const [allergenMatrix, setAllergenMatrix] = useState<AllergenMatrix | null>(null);
  const [passRate, setPassRate] = useState<QualityPassRate | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);

  useEffect(() => {
    productsApi.fetchProducts(0, 200).then((p) => setProducts(p.content.filter((x) => x.productType !== 'RAW_MATERIAL'))).catch(() => {});
    reportsApi.fetchAllergenMatrix().then(setAllergenMatrix).catch(() => toast('Failed to load allergen matrix', 'error'));
    reportsApi.fetchQualityPassRate().then(setPassRate).catch(() => toast('Failed to load quality pass rate', 'error'));
    reportsApi.fetchRecentActivity(30).then(setActivity).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      reportsApi.fetchCostBreakdown(Number(selectedProductId)).then(setCostBreakdown).catch(() => toast('Failed to load cost breakdown', 'error'));
    } else {
      setCostBreakdown([]);
    }
  }, [selectedProductId]);

  const passRateData = passRate ? [{ name: 'Passed', value: passRate.passed }, { name: 'Failed', value: passRate.failed }] : [];

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1>Reports</h1>
          <p className="text-muted">Cross-module analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2>Cost Breakdown by Ingredient</h2>
          <select className="form-select" style={{ marginBottom: '1rem' }} value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
            <option value="">-- Select a product --</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {costBreakdown.length > 0 ? (
            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="ingredientName" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', color: 'white' }} />
                  <Bar dataKey="contribution" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted">Select a product to see its cost breakdown.</p>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2>Quality Pass Rate</h2>
          {passRate ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ height: '200px', width: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={passRateData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                      {passRateData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', color: 'white' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{passRate.passRate}%</p>
                <p className="text-muted">{passRate.passed} passed / {passRate.failed} failed</p>
              </div>
            </div>
          ) : (
            <p className="text-muted">No quality check data yet.</p>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2>Allergen Matrix</h2>
        {allergenMatrix && allergenMatrix.products.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Product</th>
                  {allergenMatrix.allergens.map((a) => <th key={a} style={{ padding: '0.5rem 0.75rem' }}>{a}</th>)}
                </tr>
              </thead>
              <tbody>
                {allergenMatrix.products.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{String(row.productName)}</td>
                    {allergenMatrix.allergens.map((a) => (
                      <td key={a} style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                        {row[a] ? <span style={{ color: 'var(--danger)' }}>●</span> : <span className="text-muted">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted">No products to display.</p>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2>Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-muted">No activity recorded yet.</p>
        ) : (
          activity.map((a, idx) => (
            <div key={idx} style={{ padding: '0.6rem 0', borderBottom: idx < activity.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', fontSize: '0.85rem' }}>
              <strong>{a.entityType}</strong> #{a.entityId} — {a.action}
              <span className="text-muted"> • {a.performedBy || 'system'} • {formatDateTime(a.performedAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
