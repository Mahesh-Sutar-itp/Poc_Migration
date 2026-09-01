import { api, getToken } from './client';
import type { FCDocument } from '../types';

export function fetchDocuments(entityType: string, entityId: number) {
  return api.get<FCDocument[]>(`/documents?entityType=${entityType}&entityId=${entityId}`);
}

export function uploadDocument(entityType: string, entityId: number, file: File) {
  const form = new FormData();
  form.append('file', file);
  return api.postForm<FCDocument>(`/documents?entityType=${entityType}&entityId=${entityId}`, form);
}

export function deleteDocument(id: number) {
  return api.del<void>(`/documents/${id}`);
}

export async function downloadDocument(id: number, fileName: string) {
  const token = getToken();
  const res = await fetch(`/api/documents/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to download document');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
