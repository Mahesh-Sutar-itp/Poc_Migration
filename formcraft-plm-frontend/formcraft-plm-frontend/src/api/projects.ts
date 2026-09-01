import { api } from './client';
import type { MilestoneStatus, Project, ProjectMilestone, ProjectStatus } from '../types';

export function fetchProjects() {
  return api.get<Project[]>('/projects');
}

export function fetchProject(id: number) {
  return api.get<Project>(`/projects/${id}`);
}

export function createProject(data: { name: string; description?: string; owner?: string; targetLaunchDate?: string }) {
  return api.post<Project>('/projects', data);
}

export function updateProjectStatus(id: number, status: ProjectStatus) {
  return api.put<Project>(`/projects/${id}/status?status=${status}`);
}

export function linkProductToProject(id: number, productId: number) {
  return api.post<void>(`/projects/${id}/products/${productId}`);
}

export function unlinkProductFromProject(id: number, productId: number) {
  return api.del<void>(`/projects/${id}/products/${productId}`);
}

export function addMilestone(id: number, data: { name: string; gateNumber: number; dueDate?: string }) {
  return api.post<ProjectMilestone>(`/projects/${id}/milestones`, data);
}

export function updateMilestoneStatus(id: number, milestoneId: number, status: MilestoneStatus) {
  return api.put<ProjectMilestone>(`/projects/${id}/milestones/${milestoneId}/status?status=${status}`);
}

export function deleteProject(id: number) {
  return api.del<void>(`/projects/${id}`);
}
