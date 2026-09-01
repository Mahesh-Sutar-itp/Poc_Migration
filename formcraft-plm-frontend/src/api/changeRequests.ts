import { api } from './client';
import type { ChangeRequest } from '../types';

export function fetchChangeRequests() {
  return api.get<ChangeRequest[]>('/change-requests');
}

export function fetchChangeRequest(id: number) {
  return api.get<ChangeRequest>(`/change-requests/${id}`);
}

export function fetchChangeRequestsForProduct(productId: number) {
  return api.get<ChangeRequest[]>(`/products/${productId}/change-requests`);
}

export function createChangeRequest(
  productId: number,
  data: { title: string; description?: string; reason?: string; impact?: string }
) {
  return api.post<ChangeRequest>(`/products/${productId}/change-requests`, data);
}

export function submitChangeRequest(id: number) {
  return api.post<ChangeRequest>(`/change-requests/${id}/submit`);
}

export function decideChangeRequest(id: number, approve: boolean, comment?: string) {
  return api.post<ChangeRequest>(`/change-requests/${id}/decide`, { approve, comment });
}

export function implementChangeRequest(id: number) {
  return api.post<ChangeRequest>(`/change-requests/${id}/implement`);
}
