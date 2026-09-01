import { api } from './client';
import type { CurrentUser } from '../types';

export interface LoginResponse {
  token: string;
  user: CurrentUser;
}

export function login(username: string, password: string) {
  return api.post<LoginResponse>('/auth/login', { username, password });
}

export function me() {
  return api.get<CurrentUser>('/auth/me');
}
