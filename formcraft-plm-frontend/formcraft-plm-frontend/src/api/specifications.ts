import { api } from './client';
import type { SpecType, Specification } from '../types';

export interface SpecRequest {
  parameter: string;
  specType: SpecType;
  minValue?: number;
  maxValue?: number;
  targetValue?: number;
  unit?: string;
}

export function fetchSpecifications(productId: number) {
  return api.get<Specification[]>(`/products/${productId}/specifications`);
}

export function createSpecification(productId: number, data: SpecRequest) {
  return api.post<Specification>(`/products/${productId}/specifications`, data);
}

export function deleteSpecification(id: number) {
  return api.del<void>(`/specifications/${id}`);
}
