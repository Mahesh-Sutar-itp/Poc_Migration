import { api } from './client';
import type {
  AuditLog,
  CompositionLine,
  FormulationResult,
  Page,
  Product,
  ProductType,
  QualityCheck,
  WorkflowTask,
} from '../types';

export interface CreateProductRequest {
  code: string;
  name: string;
  description?: string;
  productType: ProductType;
  unit?: string;
  costPerKg?: number;
  formulaExpression?: string;
  allergenFlags?: string;
}

export function fetchProducts(page = 0, size = 20, sortBy = 'name') {
  return api.get<Page<Product>>(`/products?page=${page}&size=${size}&sortBy=${sortBy}`);
}

export function fetchProduct(id: number) {
  return api.get<Product>(`/products/${id}`);
}

export function searchProducts(params: Record<string, string | undefined>) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][]
  ).toString();
  return api.get<Product[]>(`/products/search${query ? `?${query}` : ''}`);
}

export function createProduct(data: CreateProductRequest) {
  return api.post<Product>('/products', data);
}

export function updateProduct(id: number, data: Partial<CreateProductRequest>) {
  return api.put<Product>(`/products/${id}`, data);
}

export function deleteProduct(id: number) {
  return api.del<void>(`/products/${id}`);
}

export function fetchComposition(id: number) {
  return api.get<CompositionLine[]>(`/products/${id}/composition`);
}

export function addComposition(productId: number, data: { ingredientId: number; quantity: number; unit: string }) {
  return api.post<Product>(`/products/${productId}/composition`, data);
}

export function removeComposition(productId: number, lineId: number) {
  return api.del<Product>(`/products/${productId}/composition/${lineId}`);
}

export function runFormulation(id: number, chainId = 'default') {
  return api.post<{ productId: number; productName: string; chainId: string; result: FormulationResult }>(
    `/products/${id}/formulate?chainId=${chainId}`
  );
}

export function fetchFormulationHistory(id: number) {
  return api.get<FormulationResult[]>(`/products/${id}/formulate/history`);
}

export function runQualityChecks(id: number) {
  return api.post<QualityCheck[]>(`/products/${id}/quality/run-all`);
}

export function transitionWorkflow(
  id: number,
  action: 'submit' | 'approve' | 'reject' | 'archive',
  params?: Record<string, string>
) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return api.post<Product>(`/products/${id}/workflow/${action}${query}`);
}

export function fetchMyTasks() {
  return api.get<WorkflowTask[]>('/workflow/my-tasks');
}

export function completeTask(productId: number, taskId: number) {
  return api.post<WorkflowTask>(`/products/${productId}/workflow/tasks/${taskId}/complete`);
}

export function getStats() {
  return api.get<Record<string, number>>('/products/stats');
}

export function fetchAuditHistory(id: number) {
  return api.get<AuditLog[]>(`/products/${id}/audit-history`);
}
