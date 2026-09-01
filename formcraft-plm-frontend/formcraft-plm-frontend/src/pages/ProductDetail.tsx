import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Beaker,
  CheckCircle,
  Package,
  Plus,
  X,
  BarChart3,
  Trash2,
  Upload,
  Download,
  FileText,
} from 'lucide-react';
import * as productsApi from '../api/products';
import * as suppliersApi from '../api/suppliers';
import * as specificationsApi from '../api/specifications';
import * as documentsApi from '../api/documents';
import * as changeRequestsApi from '../api/changeRequests';
import * as ncApi from '../api/nonConformances';
import type {
  AuditLog,
  ChangeRequest,
  CompositionLine,
  FCDocument,
  NonConformance,
  Product,
  Specification,
  SpecType,
  SupplierProduct,
} from '../types';
import { productStateBadgeClass, formatDateTime } from '../utils';
import { toast } from '../components/Toast';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

type Tab = 'overview' | 'bom' | 'formulation' | 'quality' | 'specifications' | 'documents' | 'changes' | 'nc' | 'audit';

function AddIngredientModal({ isOpen, onClose, productId, onAdded }: { isOpen: boolean; onClose: () => void; productId: number; onAdded: () => void }) {
  const [materials, setMaterials] = useState<Product[]>([]);
  const [formData, setFormData] = useState({ ingredientId: '', quantity: 1, unit: 'g' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      productsApi.searchProducts({ type: 'RAW_MATERIAL' }).then(setMaterials).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ingredientId) return toast('Select an ingredient', 'error');
    setLoading(true);
    try {
      await productsApi.addComposition(productId, {
        ingredientId: Number(formData.ingredientId),
        quantity: formData.quantity,
        unit: formData.unit,
      });
      toast('Ingredient added successfully!', 'success');
      onAdded();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to add ingredient', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Add Ingredient to BOM</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Raw Material</label>
            <select className="form-select" value={formData.ingredientId} onChange={(e) => setFormData({ ...formData, ingredientId: e.target.value })}>
              <option value="">-- Choose Ingredient --</option>
              {materials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Quantity</label>
              <input type="number" step="0.01" className="form-input" required value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Unit</label>
              <select className="form-select" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}>
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="%">Percent (%)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="L">Liters (L)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading}>Add to BOM</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SpecModal({ isOpen, onClose, productId, onSaved }: { isOpen: boolean; onClose: () => void; productId: number; onSaved: () => void }) {
  const [formData, setFormData] = useState({ parameter: '', specType: 'PHYSICAL' as SpecType, minValue: '', maxValue: '', targetValue: '', unit: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await specificationsApi.createSpecification(productId, {
        parameter: formData.parameter,
        specType: formData.specType,
        minValue: formData.minValue ? Number(formData.minValue) : undefined,
        maxValue: formData.maxValue ? Number(formData.maxValue) : undefined,
        targetValue: formData.targetValue ? Number(formData.targetValue) : undefined,
        unit: formData.unit || undefined,
      });
      toast('Specification added', 'success');
      onSaved();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to add specification', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Add Specification</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Parameter</label>
            <input className="form-input" required value={formData.parameter} onChange={(e) => setFormData({ ...formData, parameter: e.target.value })} placeholder="e.g. Moisture Content" />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={formData.specType} onChange={(e) => setFormData({ ...formData, specType: e.target.value as SpecType })}>
              <option value="PHYSICAL">Physical</option>
              <option value="CHEMICAL">Chemical</option>
              <option value="MICROBIOLOGICAL">Microbiological</option>
              <option value="NUTRITIONAL">Nutritional</option>
              <option value="PACKAGING">Packaging</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Min</label>
              <input type="number" step="0.01" className="form-input" value={formData.minValue} onChange={(e) => setFormData({ ...formData, minValue: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Max</label>
              <input type="number" step="0.01" className="form-input" value={formData.maxValue} onChange={(e) => setFormData({ ...formData, maxValue: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Unit</label>
              <input className="form-input" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="%" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangeRequestModal({ isOpen, onClose, productId, onSaved }: { isOpen: boolean; onClose: () => void; productId: number; onSaved: () => void }) {
  const [formData, setFormData] = useState({ title: '', description: '', reason: '', impact: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await changeRequestsApi.createChangeRequest(productId, formData);
      toast('Change request created', 'success');
      onSaved();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to create change request', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>New Change Request</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-input" rows={2} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Impact</label>
            <textarea className="form-input" rows={2} value={formData.impact} onChange={(e) => setFormData({ ...formData, impact: e.target.value })} />
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

function RaiseNcModal({ isOpen, onClose, productId, onSaved }: { isOpen: boolean; onClose: () => void; productId: number; onSaved: () => void }) {
  const [formData, setFormData] = useState({ title: '', description: '', severity: 'MINOR' as 'MINOR' | 'MAJOR' | 'CRITICAL' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ncApi.raiseNonConformance(productId, formData);
      toast('Non-conformance raised', 'success');
      onSaved();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to raise non-conformance', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Raise Non-Conformance</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Severity</label>
            <select className="form-select" value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value as 'MINOR' | 'MAJOR' | 'CRITICAL' })}>
              <option value="MINOR">Minor</option>
              <option value="MAJOR">Major</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-danger" disabled={loading}>Raise</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProductDetail() {
  const { id } = useParams();
  const productId = Number(id);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [composition, setComposition] = useState<CompositionLine[]>([]);
  const [specs, setSpecs] = useState<Specification[]>([]);
  const [documentsList, setDocumentsList] = useState<FCDocument[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [nonConformances, setNonConformances] = useState<NonConformance[]>([]);
  const [auditHistory, setAuditHistory] = useState<AuditLog[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierProduct[]>([]);
  const [tab, setTab] = useState<Tab>('overview');

  const [isBOMModalOpen, setBOMModalOpen] = useState(false);
  const [isSpecModalOpen, setSpecModalOpen] = useState(false);
  const [isCRModalOpen, setCRModalOpen] = useState(false);
  const [isNcModalOpen, setNcModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadCore = async () => {
    const [pData, cData] = await Promise.all([productsApi.fetchProduct(productId), productsApi.fetchComposition(productId)]);
    setProduct(pData);
    setComposition(cData);
  };

  useEffect(() => {
    loadCore().catch(() => toast('Failed to load product', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    if (tab === 'specifications') specificationsApi.fetchSpecifications(productId).then(setSpecs).catch(() => {});
    if (tab === 'documents') documentsApi.fetchDocuments('Product', productId).then(setDocumentsList).catch(() => {});
    if (tab === 'changes') changeRequestsApi.fetchChangeRequestsForProduct(productId).then(setChangeRequests).catch(() => {});
    if (tab === 'nc') ncApi.fetchNonConformancesForProduct(productId).then(setNonConformances).catch(() => {});
    if (tab === 'audit') productsApi.fetchAuditHistory(productId).then(setAuditHistory).catch(() => {});
    if (tab === 'overview' && product.productType === 'RAW_MATERIAL') {
      suppliersApi.fetchSuppliersForProduct(productId).then(setSuppliers).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, product]);

  const handleFormulate = async () => {
    try {
      await productsApi.runFormulation(productId);
      toast('Formulation computed successfully', 'success');
      loadCore();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Formulation failed', 'error');
    }
  };

  const handleQuality = async () => {
    try {
      await productsApi.runQualityChecks(productId);
      toast('Quality checks executed', 'success');
      loadCore();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Quality checks failed', 'error');
    }
  };

  const handleWorkflow = async (action: 'submit' | 'approve' | 'reject' | 'archive') => {
    try {
      const params = action === 'reject' ? { reason: window.prompt('Rejection reason?') || 'No reason given' } : undefined;
      await productsApi.transitionWorkflow(productId, action, params);
      toast(`Workflow transitioned: ${action}`, 'success');
      loadCore();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Workflow transition failed', 'error');
    }
  };

  const handleRemoveComposition = async (lineId: number) => {
    try {
      await productsApi.removeComposition(productId, lineId);
      toast('Ingredient removed', 'success');
      loadCore();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to remove ingredient', 'error');
    }
  };

  const handleUpload = async (file: File) => {
    try {
      await documentsApi.uploadDocument('Product', productId, file);
      toast('Document uploaded', 'success');
      documentsApi.fetchDocuments('Product', productId).then(setDocumentsList);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Upload failed', 'error');
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    try {
      await documentsApi.deleteDocument(docId);
      toast('Document deleted', 'success');
      documentsApi.fetchDocuments('Product', productId).then(setDocumentsList);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to delete document', 'error');
    }
  };

  const handleDeleteSpec = async (specId: number) => {
    try {
      await specificationsApi.deleteSpecification(specId);
      toast('Specification removed', 'success');
      specificationsApi.fetchSpecifications(productId).then(setSpecs);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to remove specification', 'error');
    }
  };

  const handleSubmitCR = async (crId: number) => {
    try {
      await changeRequestsApi.submitChangeRequest(crId);
      toast('Change request submitted for review', 'success');
      changeRequestsApi.fetchChangeRequestsForProduct(productId).then(setChangeRequests);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to submit change request', 'error');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await productsApi.deleteProduct(productId);
      toast('Product deleted', 'success');
      navigate('/products');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to delete product', 'error');
      setDeleting(false);
    }
  };

  if (!product) return <div style={{ padding: '2rem' }}>Loading...</div>;

  const chartData = (product.nutrientValues || [])
    .filter((n) => ['PROTEIN', 'FAT', 'CARBOHYDRATES'].includes(n.nutrientType))
    .map((n) => ({ name: n.nutrientType, value: n.valuePer100g }));

  const latestFormulation = product.formulationResults && product.formulationResults.length > 0 ? product.formulationResults[0] : null;
  const canManageWorkflow = hasRole('ADMIN', 'PLM_MANAGER');
  const canManageQuality = hasRole('ADMIN', 'QUALITY_MANAGER');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'bom', label: 'BOM' },
    { key: 'formulation', label: 'Formulation' },
    { key: 'quality', label: 'Quality' },
    { key: 'specifications', label: 'Specifications' },
    { key: 'documents', label: 'Documents' },
    { key: 'changes', label: 'Change Requests' },
    { key: 'nc', label: 'Non-Conformances' },
    { key: 'audit', label: 'Audit History' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Package size={28} /> {product.name}
          </h1>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>{product.code} • {product.productType.replace('_', ' ')}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <span className={`badge ${productStateBadgeClass(product.state)}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
            {product.state.replace('_', ' ')}
          </span>
          {canManageWorkflow && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              {product.state === 'DRAFT' && <button className="btn btn-secondary" onClick={() => handleWorkflow('submit')}>Submit for Validation</button>}
              {product.state === 'IN_VALIDATION' && (
                <>
                  <button className="btn btn-success" onClick={() => handleWorkflow('approve')}>Approve</button>
                  <button className="btn btn-danger" onClick={() => handleWorkflow('reject')}>Reject</button>
                </>
              )}
              {product.state === 'VALIDATED' && <button className="btn btn-secondary" onClick={() => handleWorkflow('archive')}>Archive</button>}
              {(product.state === 'DRAFT' || product.state === 'ARCHIVED') && (
                <button className="btn btn-danger" onClick={() => setDeleteConfirmOpen(true)}>
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={t.key === tab ? 'btn' : 'btn btn-secondary'}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2">
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h2>Details</h2>
            <p><strong>Description:</strong> {product.description || 'None'}</p>
            <p><strong>Unit:</strong> {product.unit || '—'}</p>
            <p><strong>Cost per kg:</strong> {product.costPerKg ?? '—'}</p>
            <p><strong>Allergens:</strong> {product.allergenFlags || 'None declared'}</p>
            <p><strong>Created:</strong> {formatDateTime(product.createdAt)}</p>
            <p><strong>Updated:</strong> {formatDateTime(product.updatedAt)}</p>
          </div>
          {product.productType === 'RAW_MATERIAL' && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2>Approved Suppliers</h2>
              {suppliers.length === 0 ? (
                <p className="text-muted">No suppliers linked yet. Link one from the Suppliers page.</p>
              ) : (
                suppliers.map((sp) => (
                  <div key={sp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span>{sp.supplier?.name} {sp.preferred && <span className="badge badge-validated">Preferred</span>}</span>
                    <span className="text-muted">${sp.pricePerKg}/kg • {sp.leadTimeDays}d lead time</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'bom' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: 0 }}>Bill of Materials</h2>
            {product.productType !== 'RAW_MATERIAL' && (
              <button className="btn btn-secondary" onClick={() => setBOMModalOpen(true)}><Plus size={16} /> Add Item</button>
            )}
          </div>
          {product.productType === 'RAW_MATERIAL' ? (
            <p className="text-muted">Raw materials do not have a Bill of Materials.</p>
          ) : composition.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-md)' }}>
              <p className="text-muted">No composition lines.</p>
            </div>
          ) : (
            <div className="table-responsive">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '0.75rem 0' }}>Ingredient</th>
                  <th>Qty</th>
                  <th>Allergen</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {composition.map((line) => (
                  <tr key={line.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0' }}>{line.ingredient ? line.ingredient.name : 'Unknown'}</td>
                    <td>{line.quantity} {line.unit}</td>
                    <td>{line.isAllergen ? <span style={{ color: 'var(--danger)' }}>Yes</span> : <span className="text-muted">No</span>}</td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleRemoveComposition(line.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {tab === 'formulation' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ marginBottom: 0 }}>Formulation Engine</h2>
            {product.productType !== 'RAW_MATERIAL' && (
              <button className="btn" onClick={handleFormulate}><Beaker size={18} /> Run Formula</button>
            )}
          </div>
          {latestFormulation ? (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>NutriScore</p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{latestFormulation.nutriScore || 'N/A'}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>Cost</p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>${latestFormulation.totalCost?.toFixed(2)}</p>
                </div>
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart3 size={16} /> Macros</h3>
              <div style={{ height: '200px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', color: 'white' }} />
                    <Bar dataKey="value" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-muted">No formulation results yet.</p>
          )}
        </div>
      )}

      {tab === 'quality' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ marginBottom: 0 }}>Quality Checks</h2>
            <button className="btn btn-secondary" onClick={handleQuality}><CheckCircle size={18} /> Run Checks</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {product.qualityChecks && product.qualityChecks.length > 0 ? product.qualityChecks.map((check) => (
              <div key={check.id} className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${check.status === 'PASSED' ? 'var(--success)' : 'var(--danger)'}` }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{check.checkType.replace(/_/g, ' ')}</span>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>{check.result}</p>
                </div>
                <span style={{ color: check.status === 'PASSED' ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>{check.status}</span>
              </div>
            )) : (
              <p className="text-muted">No quality checks run.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'specifications' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: 0 }}>Specifications</h2>
            {canManageQuality && <button className="btn btn-secondary" onClick={() => setSpecModalOpen(true)}><Plus size={16} /> Add Spec</button>}
          </div>
          {specs.length === 0 ? (
            <p className="text-muted">No specifications defined.</p>
          ) : (
            <div className="table-responsive">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '0.75rem 0' }}>Parameter</th>
                  <th>Type</th>
                  <th>Range</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {specs.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0' }}>{s.parameter}</td>
                    <td>{s.specType}</td>
                    <td>{s.minValue ?? '—'} to {s.maxValue ?? '—'} {s.unit}</td>
                    <td>{canManageQuality && (
                      <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDeleteSpec(s.id)}>
                        <Trash2 size={14} />
                      </button>
                    )}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: 0 }}>Documents</h2>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <Upload size={16} /> Upload
              <input type="file" style={{ display: 'none' }} onChange={(e) => e.target.files && handleUpload(e.target.files[0])} />
            </label>
          </div>
          {documentsList.length === 0 ? (
            <p className="text-muted">No documents uploaded.</p>
          ) : (
            documentsList.map((d) => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={16} /> {d.fileName}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => documentsApi.downloadDocument(d.id, d.fileName)}>
                    <Download size={14} />
                  </button>
                  <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDeleteDocument(d.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'changes' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: 0 }}>Change Requests</h2>
            <button className="btn btn-secondary" onClick={() => setCRModalOpen(true)}><Plus size={16} /> New Request</button>
          </div>
          {changeRequests.length === 0 ? (
            <p className="text-muted">No change requests for this product.</p>
          ) : (
            changeRequests.map((cr) => (
              <div key={cr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => navigate(`/change-requests/${cr.id}`)}>
                <div>
                  <strong>{cr.title}</strong>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>by {cr.requestedBy}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="badge badge-validation">{cr.status}</span>
                  {cr.status === 'DRAFT' && (
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.6rem' }} onClick={(e) => { e.stopPropagation(); handleSubmitCR(cr.id); }}>
                      Submit
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'nc' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: 0 }}>Non-Conformances</h2>
            <button className="btn btn-danger" onClick={() => setNcModalOpen(true)}><Plus size={16} /> Raise NC</button>
          </div>
          {nonConformances.length === 0 ? (
            <p className="text-muted">No non-conformances raised for this product.</p>
          ) : (
            nonConformances.map((nc) => (
              <div key={nc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => navigate(`/non-conformances/${nc.id}`)}>
                <div>
                  <strong>{nc.title}</strong>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>{nc.severity}</p>
                </div>
                <span className={`badge ${nc.status === 'CLOSED' ? 'badge-validated' : 'badge-validation'}`}>{nc.status}</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'audit' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2>Audit History</h2>
          {auditHistory.length === 0 ? (
            <p className="text-muted">No audit entries yet.</p>
          ) : (
            auditHistory.map((a) => (
              <div key={a.id} style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div><strong>{a.action}</strong> — {a.details}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{a.performedBy || 'system'} • {formatDateTime(a.performedAt)}</div>
              </div>
            ))
          )}
        </div>
      )}

      <AddIngredientModal isOpen={isBOMModalOpen} onClose={() => setBOMModalOpen(false)} productId={product.id} onAdded={loadCore} />
      <SpecModal isOpen={isSpecModalOpen} onClose={() => setSpecModalOpen(false)} productId={product.id} onSaved={() => specificationsApi.fetchSpecifications(productId).then(setSpecs)} />
      <ChangeRequestModal isOpen={isCRModalOpen} onClose={() => setCRModalOpen(false)} productId={product.id} onSaved={() => changeRequestsApi.fetchChangeRequestsForProduct(productId).then(setChangeRequests)} />
      <RaiseNcModal isOpen={isNcModalOpen} onClose={() => setNcModalOpen(false)} productId={product.id} onSaved={() => ncApi.fetchNonConformancesForProduct(productId).then(setNonConformances)} />
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete product?"
        message={`This will permanently delete "${product.name}" and all its related data (composition, formulation history, quality checks, etc.). This cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
