import { api } from './client';
import type { AppUser, UserRole } from '../types';

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName?: string;
  email?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  role: UserRole;
  enabled: boolean;
}

export function fetchUsers() {
  return api.get<AppUser[]>('/users');
}

export function fetchUser(id: number) {
  return api.get<AppUser>(`/users/${id}`);
}

export function createUser(data: CreateUserRequest) {
  return api.post<AppUser>('/users', data);
}

export function updateUser(id: number, data: UpdateUserRequest) {
  return api.put<AppUser>(`/users/${id}`, data);
}

export function resetPassword(id: number, newPassword: string) {
  return api.post<void>(`/users/${id}/reset-password`, { newPassword });
}
