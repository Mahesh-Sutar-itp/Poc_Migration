import { api } from './client';
import type { CustomAttributeDataType, CustomAttributeDefinition, CustomAttributeManifest, ProductType } from '../types';

export interface CreateAttributeDefinitionRequest {
  attributeKey: string;
  label: string;
  dataType: CustomAttributeDataType;
  required: boolean;
  appliesToProductType?: ProductType;
  validationRegex?: string;
}

export function fetchAttributeDefinitions() {
  return api.get<CustomAttributeDefinition[]>('/attribute-definitions');
}

export function createAttributeDefinition(data: CreateAttributeDefinitionRequest) {
  return api.post<CustomAttributeDefinition>('/attribute-definitions', data);
}

export function fetchAttributeManifest() {
  return api.get<CustomAttributeManifest>('/attribute-definitions/manifest');
}
