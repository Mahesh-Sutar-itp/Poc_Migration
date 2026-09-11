import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import * as attributeDefinitionsApi from '../api/attributeDefinitions';
import * as extensionsApi from '../api/extensions';
import * as eventActionRulesApi from '../api/eventActionRules';
import * as accessRulesApi from '../api/accessRules';
import * as reportTemplatesApi from '../api/reportTemplates';
import type { CreateAttributeDefinitionRequest } from '../api/attributeDefinitions';
import type { CreateEventActionRuleRequest } from '../api/eventActionRules';
import type { CreateAccessRuleRequest } from '../api/accessRules';
import type {
  CustomAttributeDataType, CustomAttributeDefinition, ExtensionInfo, ProductType, UserRole,
  EventActionRule, EventType, EventActionType, NotificationCategory,
  AccessRule, RuleEffect,
  ReportTemplate, TargetEntity,
} from '../types';
import { toast } from '../components/Toast';
import { ApiError } from '../api/client';
import { formatDateTime } from '../utils';

const DATA_TYPES: CustomAttributeDataType[] = ['STRING', 'NUMBER', 'BOOLEAN', 'DATE'];
const PRODUCT_TYPES: ProductType[] = ['FINISHED_PRODUCT', 'SEMI_FINISHED', 'RAW_MATERIAL', 'PACKAGING'];
const ROLES: UserRole[] = ['ADMIN', 'PLM_MANAGER', 'QUALITY_MANAGER', 'PURCHASING', 'VIEWER'];
const EVENT_TYPES: EventType[] = ['CHANGE_REQUEST_SUBMITTED', 'CHANGE_REQUEST_APPROVED',
  'CHANGE_REQUEST_REJECTED', 'NON_CONFORMANCE_OPENED', 'INVENTORY_LOW_STOCK'];
const ACTION_TYPES: EventActionType[] = ['NOTIFY_ROLE', 'NOTIFY_INITIATING_USER'];
const NOTIFICATION_CATEGORIES: NotificationCategory[] = ['TASK', 'WORKFLOW', 'QUALITY', 'CHANGE_REQUEST', 'INVENTORY', 'SYSTEM'];
const ACTION_KEYS = ['CHANGE_REQUEST_DECIDE', 'NON_CONFORMANCE_CLOSE'];
const EFFECTS: RuleEffect[] = ['ALLOW', 'DENY'];

const EMPTY_FORM: CreateAttributeDefinitionRequest = {
  attributeKey: '',
  label: '',
  dataType: 'STRING',
  required: false,
  appliesToProductType: undefined,
  validationRegex: '',
};

const EMPTY_EVENT_RULE_FORM: CreateEventActionRuleRequest = {
  eventType: 'CHANGE_REQUEST_SUBMITTED',
  conditionProductType: undefined,
  actionType: 'NOTIFY_ROLE',
  targetRole: 'PLM_MANAGER',
  notificationTitle: '',
  messageTemplate: '',
  notificationCategory: 'CHANGE_REQUEST',
};

const EMPTY_ACCESS_RULE_FORM: CreateAccessRuleRequest = {
  role: 'VIEWER',
  actionKey: '',
  effect: 'DENY',
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function NewAttributeDefinitionModal({ isOpen, onClose, onCreated }: ModalProps) {
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

function NewEventActionRuleModal({ isOpen, onClose, onCreated }: ModalProps) {
  const [formData, setFormData] = useState<CreateEventActionRuleRequest>(EMPTY_EVENT_RULE_FORM);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await eventActionRulesApi.createEventActionRule(formData);
      toast('Event-action rule created', 'success');
      setFormData(EMPTY_EVENT_RULE_FORM);
      onCreated();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to create rule', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>New Event-Action Rule</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
              <label className="form-label">Event</label>
              <select className="form-select" value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value as EventType })}>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
              <label className="form-label">Product Type Condition (optional)</label>
              <select className="form-select" value={formData.conditionProductType || ''}
                onChange={(e) => setFormData({ ...formData, conditionProductType: (e.target.value || undefined) as ProductType | undefined })}>
                <option value="">Every product type</option>
                {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
              <label className="form-label">Action</label>
              <select className="form-select" value={formData.actionType}
                onChange={(e) => setFormData({ ...formData, actionType: e.target.value as EventActionType })}>
                {ACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {formData.actionType === 'NOTIFY_ROLE' && (
              <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                <label className="form-label">Target Role</label>
                <select className="form-select" value={formData.targetRole || ''}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value as UserRole })}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Notification Title</label>
            <input className="form-input" required placeholder="Non-conformance also needs PLM review"
              value={formData.notificationTitle}
              onChange={(e) => setFormData({ ...formData, notificationTitle: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Message Template</label>
            <input className="form-input" required placeholder='"{title}" flagged: {detail}'
              value={formData.messageTemplate}
              onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={formData.notificationCategory}
              onChange={(e) => setFormData({ ...formData, notificationCategory: e.target.value as NotificationCategory })}>
              {NOTIFICATION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
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

function NewAccessRuleModal({ isOpen, onClose, onCreated }: ModalProps) {
  const [formData, setFormData] = useState<CreateAccessRuleRequest>(EMPTY_ACCESS_RULE_FORM);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await accessRulesApi.createAccessRule(formData);
      toast('Access rule created', 'success');
      setFormData(EMPTY_ACCESS_RULE_FORM);
      onCreated();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to create rule', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>New Access Rule</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Role</label>
              <select className="form-select" value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
              <label className="form-label">Action</label>
              <select className="form-select" value={formData.actionKey}
                onChange={(e) => setFormData({ ...formData, actionKey: e.target.value })}>
                <option value="">Select action…</option>
                {ACTION_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
              <label className="form-label">Effect</label>
              <select className="form-select" value={formData.effect}
                onChange={(e) => setFormData({ ...formData, effect: e.target.value as RuleEffect })}>
                {EFFECTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
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

function NewReportTemplateModal({ isOpen, onClose, onCreated }: ModalProps) {
  const [formData, setFormData] = useState<{ templateKey: string; name: string; targetEntity: TargetEntity; fieldsCsv: string }>({
    templateKey: '', name: '', targetEntity: 'PRODUCT', fieldsCsv: '',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fields = formData.fieldsCsv.split(',').map((f) => f.trim()).filter(Boolean);
      await reportTemplatesApi.createReportTemplate({
        templateKey: formData.templateKey,
        name: formData.name,
        targetEntity: formData.targetEntity,
        fields,
        labels: Object.fromEntries(fields.map((f) => [f, f])),
      });
      toast('Report template created', 'success');
      setFormData({ templateKey: '', name: '', targetEntity: 'PRODUCT', fieldsCsv: '' });
      onCreated();
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to create template', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>New Report Template</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Template Key</label>
              <input className="form-input" required placeholder="cost_by_type"
                value={formData.templateKey} onChange={(e) => setFormData({ ...formData, templateKey: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
              <label className="form-label">Name</label>
              <input className="form-input" required placeholder="Cost by Product Type"
                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Entity</label>
            <select className="form-select" value={formData.targetEntity}
              onChange={(e) => setFormData({ ...formData, targetEntity: e.target.value as TargetEntity })}>
              <option value="PRODUCT">Product</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fields (comma-separated)</label>
            <input className="form-input" required placeholder="name, productType, costPerKg, allergenFlags"
              value={formData.fieldsCsv} onChange={(e) => setFormData({ ...formData, fieldsCsv: e.target.value })} />
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
  const [handlers, setHandlers] = useState<ExtensionInfo[]>([]);
  const [eventRules, setEventRules] = useState<EventActionRule[]>([]);
  const [accessRules, setAccessRules] = useState<AccessRule[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [reportResults, setReportResults] = useState<{ key: string; rows: Record<string, unknown>[] } | null>(null);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isEventRuleModalOpen, setEventRuleModalOpen] = useState(false);
  const [isAccessRuleModalOpen, setAccessRuleModalOpen] = useState(false);
  const [isReportTemplateModalOpen, setReportTemplateModalOpen] = useState(false);

  const loadDefinitions = () => {
    attributeDefinitionsApi.fetchAttributeDefinitions().then(setDefinitions).catch(() => toast('Failed to load attribute definitions', 'error'));
  };
  const loadEventRules = () => {
    eventActionRulesApi.fetchEventActionRules().then(setEventRules).catch(() => toast('Failed to load event-action rules', 'error'));
  };
  const loadAccessRules = () => {
    accessRulesApi.fetchAccessRules().then(setAccessRules).catch(() => toast('Failed to load access rules', 'error'));
  };
  const loadReportTemplates = () => {
    reportTemplatesApi.fetchReportTemplates().then(setReportTemplates).catch(() => toast('Failed to load report templates', 'error'));
  };

  useEffect(() => {
    loadDefinitions();
    extensionsApi.fetchChangeRequestTransitionHandlers().then(setHandlers).catch(() => toast('Failed to load extensions', 'error'));
    loadEventRules();
    loadAccessRules();
    loadReportTemplates();
  }, []);

  const toggleEventRuleEnabled = async (rule: EventActionRule) => {
    try {
      await eventActionRulesApi.setEventActionRuleEnabled(rule.id, !rule.enabled);
      loadEventRules();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to update rule', 'error');
    }
  };

  const runTemplate = async (key: string) => {
    try {
      const rows = await reportTemplatesApi.runReportTemplate(key);
      setReportResults({ key, rows });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to run report', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1>Customizations</h1>
          <p className="text-muted">Five customization gates, mirroring Teamcenter-style extensibility mechanisms</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Gate 2 — Custom Attributes</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              Config-driven. Takes effect immediately on Product create/update — no redeploy.
            </p>
          </div>
          <button className="btn" onClick={() => setModalOpen(true)}><Plus size={18} /> New Attribute</button>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.75rem 0' }}>Key</th>
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
                  <td colSpan={7} className="text-muted" style={{ padding: '1rem 0' }}>No custom attributes defined yet.</td>
                </tr>
              ) : (
                definitions.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0' }}><code>{d.attributeKey}</code></td>
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

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Gate 1 — Workflow Extensions</h2>
        <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 1rem' }}>
          Code-driven. Registered by deploying a class that implements <code>ChangeRequestTransitionHandler</code> — read-only here by design; adding one requires a developer and a deploy, not a form.
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

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Gate 3 — Event-Action Rules</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              Config-driven. Binds a domain event to a notification action — takes effect immediately, no redeploy.
            </p>
          </div>
          <button className="btn" onClick={() => setEventRuleModalOpen(true)}><Plus size={18} /> New Rule</button>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.75rem 0' }}>Event</th>
                <th>Condition</th>
                <th>Action</th>
                <th>Title / Template</th>
                <th>Category</th>
                <th>Enabled</th>
              </tr>
            </thead>
            <tbody>
              {eventRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted" style={{ padding: '1rem 0' }}>No event-action rules defined yet.</td>
                </tr>
              ) : (
                eventRules.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0' }}><code>{r.eventType}</code></td>
                    <td className="text-muted">{r.conditionProductType || 'Every product type'}</td>
                    <td>{r.actionType}{r.targetRole ? ` → ${r.targetRole}` : ''}</td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>{r.notificationTitle}</td>
                    <td>{r.notificationCategory}</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem' }}
                        onClick={() => toggleEventRuleEnabled(r)}>
                        {r.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Gate 4 — Access Rules</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              Config-driven. Role/action ACL overrides layered on top of the static security config — no matching rule means allow.
            </p>
          </div>
          <button className="btn" onClick={() => setAccessRuleModalOpen(true)}><Plus size={18} /> New Rule</button>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.75rem 0' }}>Role</th>
                <th>Action</th>
                <th>Effect</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {accessRules.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted" style={{ padding: '1rem 0' }}>No access rules defined yet — every role uses the default security config.</td>
                </tr>
              ) : (
                accessRules.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0' }}>{r.role}</td>
                    <td><code>{r.actionKey}</code></td>
                    <td>
                      <span className={`badge ${r.effect === 'ALLOW' ? 'badge-validation' : 'badge-danger'}`}>{r.effect}</span>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>{formatDateTime(r.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Gate 5 — Report Builder</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              Config-driven. Declares a field projection over Product — run it below, no redeploy.
            </p>
          </div>
          <button className="btn" onClick={() => setReportTemplateModalOpen(true)}><Plus size={18} /> New Template</button>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.75rem 0' }}>Key</th>
                <th>Name</th>
                <th>Entity</th>
                <th>Fields</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reportTemplates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted" style={{ padding: '1rem 0' }}>No report templates defined yet.</td>
                </tr>
              ) : (
                reportTemplates.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0' }}><code>{t.templateKey}</code></td>
                    <td>{t.name}</td>
                    <td>{t.targetEntity}</td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>{t.fields.join(', ')}</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem' }}
                        onClick={() => runTemplate(t.templateKey)}>Run</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {reportResults && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Results — {reportResults.key}</h3>
              <button onClick={() => setReportResults(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div className="table-responsive" style={{ marginTop: '0.5rem' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    {reportResults.rows[0] && Object.keys(reportResults.rows[0]).map((col) => <th key={col} style={{ padding: '0.5rem 0.75rem 0.5rem 0' }}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {reportResults.rows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {Object.values(row).map((val, j) => <td key={j} style={{ padding: '0.5rem 0.75rem 0.5rem 0' }}>{String(val ?? '—')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <NewAttributeDefinitionModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onCreated={loadDefinitions} />
      <NewEventActionRuleModal isOpen={isEventRuleModalOpen} onClose={() => setEventRuleModalOpen(false)} onCreated={loadEventRules} />
      <NewAccessRuleModal isOpen={isAccessRuleModalOpen} onClose={() => setAccessRuleModalOpen(false)} onCreated={loadAccessRules} />
      <NewReportTemplateModal isOpen={isReportTemplateModalOpen} onClose={() => setReportTemplateModalOpen(false)} onCreated={loadReportTemplates} />
    </div>
  );
}
