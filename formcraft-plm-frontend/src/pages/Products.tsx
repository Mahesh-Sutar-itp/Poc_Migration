import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import * as productsApi from '../api/products';
import type { CreateProductRequest } from '../api/products';
import type { Product, ProductType } from '../types';
import { productStateBadgeClass } from '../utils';
import { toast } from '../components/Toast';
import { ApiError } from '../api/client';

function NewProductModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState<CreateProductRequest>({
    code: '',
    name: '',
    description: '',
    productType: 'FINISHED_PRODUCT',
    unit: 'kg',
    formulaExpression: '',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await productsApi.createProduct(formData);
      toast('Product created successfully!', 'success');
      onCreated();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to create product', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Create New Product</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Code</label>
            <input
              className="form-input"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. BRW-001"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Chocolate Brownie"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Product Type</label>
            <select
              className="form-select"
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value as ProductType })}
            >
              <option value="FINISHED_PRODUCT">Finished Product</option>
              <option value="SEMI_FINISHED">Semi-Finished</option>
              <option value="RAW_MATERIAL">Raw Material</option>
              <option value="PACKAGING">Packaging</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <input
              className="form-input"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="kg"
            />
          </div>
          {formData.productType === 'RAW_MATERIAL' && (
            <div className="form-group">
              <label className="form-label">Cost per kg</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={formData.costPerKg ?? ''}
                onChange={(e) => setFormData({ ...formData, costPerKg: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          {formData.productType !== 'RAW_MATERIAL' && (
            <>
              <div className="form-group">
                <label className="form-label">Formula Expression (SPEL)</label>
                <input
                  className="form-input"
                  value={formData.formulaExpression}
                  onChange={(e) => setFormData({ ...formData, formulaExpression: e.target.value })}
                  placeholder="e.g. protein * 4 + fat * 9 + carbohydrates * 4"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Allergen Flags (comma-separated)</label>
                <input
                  className="form-input"
                  value={formData.allergenFlags || ''}
                  onChange={(e) => setFormData({ ...formData, allergenFlags: e.target.value })}
                  placeholder="e.g. GLUTEN,EGGS,MILK"
                />
              </div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const navigate = useNavigate();

  const loadData = () => {
    if (search || typeFilter) {
      productsApi
        .searchProducts({ name: search || undefined, type: typeFilter || undefined })
        .then(setProducts)
        .catch(() => toast('Failed to search products', 'error'));
    } else {
      productsApi
        .fetchProducts(0, 100)
        .then((p) => setProducts(p.content))
        .catch(() => toast('Failed to load products', 'error'));
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter]);

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1>Products</h1>
          <p className="text-muted">Manage your product portfolio</p>
        </div>
        <button className="btn" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> New Product
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.9rem', color: 'var(--text-secondary)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="FINISHED_PRODUCT">Finished Product</option>
          <option value="SEMI_FINISHED">Semi-Finished</option>
          <option value="RAW_MATERIAL">Raw Material</option>
          <option value="PACKAGING">Packaging</option>
        </select>
      </div>

      <div className="grid grid-cols-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="glass-panel"
            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer' }}
            onClick={() => navigate(`/products/${p.id}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3>{p.name}</h3>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                  {p.code} • {p.productType.replace('_', ' ')}
                </p>
              </div>
              <span className={`badge ${productStateBadgeClass(p.state)}`}>{p.state.replace('_', ' ')}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {p.description || 'No description provided.'}
            </p>
          </div>
        ))}
        {products.length === 0 && <p className="text-muted">No products found.</p>}
      </div>

      <NewProductModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onCreated={loadData} />
    </div>
  );
}
