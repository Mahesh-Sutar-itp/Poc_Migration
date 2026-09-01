import { api } from './client';
import type { CorrectiveAction, NcSeverity, NcStatus, NonConformance } from '../types';

export function fetchNonConformances() {
  return api.get<NonConformance[]>('/non-conformances');
}

export function fetchNonConformance(id: number) {
  return api.get<NonConformance>(`/non-conformances/${id}`);
}

export function fetchNonConformancesForProduct(productId: number) {
  return api.get<NonConformance[]>(`/products/${productId}/non-conformances`);
}

export function raiseNonConformance(
  productId: number,
  data: { title: string; description?: string; severity: NcSeverity; qualityCheckId?: number }
) {
  return api.post<NonConformance>(`/products/${productId}/non-conformances`, data);
}

export function transitionNonConformance(id: number, target: NcStatus) {
  return api.post<NonConformance>(`/non-conformances/${id}/transition?target=${target}`);
}

export function closeNonConformance(id: number) {
  return api.post<NonConformance>(`/non-conformances/${id}/close`);
}

export function fetchCorrectiveActions(ncId: number) {
  return api.get<CorrectiveAction[]>(`/non-conformances/${ncId}/actions`);
}

export function addCorrectiveAction(ncId: number, data: { description: string; owner?: string; dueDate?: string }) {
  return api.post<CorrectiveAction>(`/non-conformances/${ncId}/actions`, data);
}

export function closeCorrectiveAction(ncId: number, actionId: number) {
  return api.post<CorrectiveAction>(`/non-conformances/${ncId}/actions/${actionId}/close`);
}

export function fetchNcStats() {
  return api.get<Record<string, number>>('/non-conformances/stats');
}
