import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import * as attributeDefinitionsApi from '../api/attributeDefinitions';
import * as extensionsApi from '../api/extensions';
import type { CreateAttributeDefinitionRequest } from '../api/attributeDefinitions';
import type { CustomAttributeDataType, CustomAttributeDefinition, CustomAttributeManifest, ExtensionInfo, ProductType } from '../types';
import { toast } from '../components/Toast';
import { ApiError } from '../api/client';
import { formatDateTime } from '../utils';

const DATA_TYPES: CustomAttributeDataType[] = ['STRING', 'NUMBER', 'BOOLEAN', 'DATE'];
const PRODUCT_TYPES: ProductType[] = ['FINISHED_PRODUCT', 'SEMI_FINISHED', 'RAW_MATERIAL', 'PACKAGING'];

const EMPTY_FORM: CreateAttributeDefinitionRequest = {
  attributeKey: '',
  label: '',
  dataType: 'STRING',
  required: false,
  appliesToProductType: undefined,
  validationRegex: '',
};

function NewAttributeDefinitionModal({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState<CreateAttributeDefinitionRequest>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await attributeDefinitionsApi.createAttributeDefinition({
        ...formData,
        validationRegex: formData.validationRegex || undefined,
      });
      toast('Attribute defined', 'success');
      setFormData(EMPTY_FORM);
      onCreated();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to define attribute', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>New Custom Attribute</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Attribute Key</label>
              <input
                className="form-input"
                required
                placeholder="batch_number"
                value={formData.attributeKey}
                onChange={(e) => setFormData({ ...formData, attributeKey: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Label</label>
              <input
                className="form-input"
                required
                placeholder="Batch Number"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Data Type</label>
              <select
                className="form-select"
                value={formData.dataType}
                onChange={(e) => setFormData({ ...formData, dataType: e.target.value as CustomAttributeDataType })}
              >
                {DATA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Applies To</label>
              <select
                className="form-select"
                value={formData.appliesToProductType || ''}
                onChange={(e) => setFormData({ ...formData, appliesToProductType: (e.target.value || undefined) as ProductType | undefined })}
              >
                <option value="">Every product type</option>
                {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Validation Regex (optional)</label>
            <input
              className="form-input"
              placeholder="^[A-Z]{2}-\\d{4}$"
              value={formData.validationRegex}
              onChange={(e) => setFormData({ ...formData, validationRegex: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="attr-required"
              checked={formData.required}
              onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
            />
            <label htmlFor="attr-required" className="form-label" style={{ margin: 0 }}>Required</label>
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

export function Customizations() {
  const [definitions, setDefinitions] = useState<CustomAttributeDefinition[]>([]);
  const [manifest, setManifest] = useState<CustomAttributeManifest | null>(null);
  const [handlers, setHandlers] = useState<ExtensionInfo[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);

  const loadDefinitions = () => {
    attributeDefinitionsApi.fetchAttributeDefinitions().then(setDefinitions).catch(() => toast('Failed to load attribute definitions', 'error'));
    attributeDefinitionsApi.fetchAttributeManifest().then(setManifest).catch(() => setManifest(null));
  };

  useEffect(() => {
    loadDefinitions();
    extensionsApi.fetchChangeRequestTransitionHandlers().then(setHandlers).catch(() => toast('Failed to load extensions', 'error'));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1>Customizations</h1>
          <p className="text-muted">The two customization gates: config-driven attributes and code-level workflow extensions</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Gate 2 — Custom Attributes</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              Config-driven. Each attribute becomes a real <code>products</code> column and is tracked in the
              customization repo — takes effect immediately on Product create/update, no redeploy.
            </p>
            <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0.35rem 0 0' }}>
              {manifest?.path
                ? <>Tracked in <code>{manifest.path}</code></>
                : 'No customization repo mounted — attributes will not be tracked in a manifest.'}
            </p>
          </div>
          <button className="btn" onClick={() => setModalOpen(true)}><Plus size={18} /> New Attribute</button>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.75rem 0' }}>Key</th>
                <th>Column</th>
                <th>Label</th>
                <th>Type</th>
                <th>Required</th>
                <th>Applies To</th>
                <th>Validation Regex</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {definitions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-muted" style={{ padding: '1rem 0' }}>No custom attributes defined yet.</td>
                </tr>
              ) : (
                definitions.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0' }}><code>{d.attributeKey}</code></td>
                    <td className="text-muted"><code>products.{d.columnName || `x_${d.attributeKey}`}</code></td>
                    <td>{d.label}</td>
                    <td>{d.dataType}</td>
                    <td>{d.required ? <span className="badge badge-validation">Required</span> : '—'}</td>
                    <td>{d.appliesToProductType || 'Every product type'}</td>
                    <td className="text-muted">{d.validationRegex || '—'}</td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>{formatDateTime(d.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Gate 1 — Workflow Extensions</h2>
        <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 1rem' }}>
          Code-driven. A handler implementing <code>ChangeRequestTransitionHandler</code> is dropped into the
          customization repo's <code>addons/</code> directory and loaded at startup — read-only here by design;
          adding one requires a developer and a deploy, not a form.
        </p>

        <div className="table-responsive">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.75rem 0' }}>Handler</th>
                <th>Package</th>
              </tr>
            </thead>
            <tbody>
              {handlers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-muted" style={{ padding: '1rem 0' }}>No handlers deployed on this instance.</td>
                </tr>
              ) : (
                handlers.map((h) => (
                  <tr key={h.className} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0' }}>{h.className}</td>
                    <td className="text-muted">{h.packageName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewAttributeDefinitionModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onCreated={loadDefinitions} />
    </div>
  );
}
