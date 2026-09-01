import { api } from './client';
import type { StockLot, StockMovement } from '../types';

export function fetchLots() {
  return api.get<StockLot[]>('/inventory/lots');
}

export function fetchLot(id: number) {
  return api.get<StockLot>(`/inventory/lots/${id}`);
}

export function fetchLotsForProduct(productId: number) {
  return api.get<StockLot[]>(`/inventory/products/${productId}/lots`);
}

export function receiveLot(
  productId: number,
  data: { lotNumber: string; quantity: number; unit?: string; expiryDate?: string; supplierId?: number }
) {
  return api.post<StockLot>(`/inventory/products/${productId}/lots`, data);
}

export function receiveIntoLot(id: number, quantity: number, reference?: string) {
  return api.post<StockMovement>(`/inventory/lots/${id}/receive`, { quantity, reference });
}

export function consumeFromLot(id: number, quantity: number, reference?: string) {
  return api.post<StockMovement>(`/inventory/lots/${id}/consume`, { quantity, reference });
}

export function adjustLot(id: number, delta: number, reference?: string) {
  return api.post<StockMovement>(`/inventory/lots/${id}/adjust`, { delta, reference });
}

export function fetchMovements(lotId: number) {
  return api.get<StockMovement[]>(`/inventory/lots/${lotId}/movements`);
}

export function fetchLowStock() {
  return api.get<StockLot[]>('/inventory/low-stock');
}
