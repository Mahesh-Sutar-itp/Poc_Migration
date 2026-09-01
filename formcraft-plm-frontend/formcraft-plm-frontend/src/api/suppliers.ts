import { api } from './client';
import type { Supplier, SupplierProduct } from '../types';

export interface SupplierRequest {
  code: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  rating?: number;
  active?: boolean;
}

export function fetchSuppliers() {
  return api.get<Supplier[]>('/suppliers');
}

export function fetchSupplier(id: number) {
  return api.get<Supplier>(`/suppliers/${id}`);
}

export function createSupplier(data: SupplierRequest) {
  return api.post<Supplier>('/suppliers', data);
}

export function updateSupplier(id: number, data: SupplierRequest) {
  return api.put<Supplier>(`/suppliers/${id}`, data);
}

export function deleteSupplier(id: number) {
  return api.del<void>(`/suppliers/${id}`);
}

export function fetchSupplierProducts(id: number) {
  return api.get<SupplierProduct[]>(`/suppliers/${id}/products`);
}

export function fetchSuppliersForProduct(productId: number) {
  return api.get<SupplierProduct[]>(`/suppliers/for-product/${productId}`);
}

export function linkProduct(
  supplierId: number,
  data: { productId: number; pricePerKg?: number; leadTimeDays?: number; moq?: number; preferred: boolean }
) {
  return api.post<SupplierProduct>(`/suppliers/${supplierId}/products`, data);
}

export function unlinkProduct(supplierId: number, productId: number) {
  return api.del<void>(`/suppliers/${supplierId}/products/${productId}`);
}
