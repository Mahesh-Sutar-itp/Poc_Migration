import { api } from './client';
import type { AppNotification } from '../types';

export function fetchNotifications() {
  return api.get<AppNotification[]>('/notifications');
}

export function fetchUnreadNotifications() {
  return api.get<AppNotification[]>('/notifications/unread');
}

export function fetchUnreadCount() {
  return api.get<{ count: number }>('/notifications/unread-count');
}

export function markRead(id: number) {
  return api.post<AppNotification>(`/notifications/${id}/read`);
}

export function markAllRead() {
  return api.post<void>('/notifications/read-all');
}
