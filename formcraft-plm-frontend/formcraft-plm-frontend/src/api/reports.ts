import { api } from './client';

export interface DashboardSummary {
  productsByState: { draft: number; inValidation: number; validated: number; archived: number };
  openNonConformances: number;
  pendingCorrectiveActions: number;
  activeChangeRequests: number;
  projectsInProgress: number;
  lowStockLots: number;
  unreadNotifications: number;
}

export interface CostBreakdownRow {
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  costPerKg: number | null;
  contribution: number;
}

export interface AllergenMatrix {
  allergens: string[];
  products: Record<string, unknown>[];
}

export interface QualityPassRate {
  passed: number;
  failed: number;
  passRate: number;
}

export interface ActivityRow {
  entityType: string;
  entityId: number;
  action: string;
  performedBy?: string;
  details?: string;
  performedAt: string;
}

export function fetchDashboardSummary() {
  return api.get<DashboardSummary>('/reports/dashboard-summary');
}

export function fetchCostBreakdown(productId: number) {
  return api.get<CostBreakdownRow[]>(`/reports/cost-breakdown/${productId}`);
}

export function fetchAllergenMatrix() {
  return api.get<AllergenMatrix>('/reports/allergen-matrix');
}

export function fetchQualityPassRate() {
  return api.get<QualityPassRate>('/reports/quality-pass-rate');
}

export function fetchRecentActivity(limit = 20) {
  return api.get<ActivityRow[]>(`/reports/activity?limit=${limit}`);
}
