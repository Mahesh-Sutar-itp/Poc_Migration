import { api } from './client';
import type { ReportTemplate, TargetEntity } from '../types';

export interface CreateReportTemplateRequest {
  templateKey: string;
  name: string;
  targetEntity: TargetEntity;
  fields: string[];
  labels: Record<string, string>;
}

export function fetchReportTemplates() {
  return api.get<ReportTemplate[]>('/report-templates');
}

export function createReportTemplate(data: CreateReportTemplateRequest) {
  return api.post<ReportTemplate>('/report-templates', data);
}

export function runReportTemplate(key: string) {
  return api.get<Record<string, unknown>[]>(`/report-templates/${key}/run`);
}
