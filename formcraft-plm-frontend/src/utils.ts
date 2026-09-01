import type { ProductState } from './types';

const STATE_BADGE_CLASS: Record<ProductState, string> = {
  DRAFT: 'badge-draft',
  IN_VALIDATION: 'badge-validation',
  VALIDATED: 'badge-validated',
  ARCHIVED: 'badge-archived',
};

export function productStateBadgeClass(state: ProductState): string {
  return STATE_BADGE_CLASS[state] || 'badge-draft';
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function formatMoney(value?: number | null): string {
  if (value === undefined || value === null) return '—';
  return `$${value.toFixed(2)}`;
}
