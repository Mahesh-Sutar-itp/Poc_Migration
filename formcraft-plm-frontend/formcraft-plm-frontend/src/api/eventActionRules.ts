import { api } from './client';
import type { EventActionRule, EventType, EventActionType, NotificationCategory, ProductType, UserRole } from '../types';

export interface CreateEventActionRuleRequest {
  eventType: EventType;
  conditionProductType?: ProductType;
  actionType: EventActionType;
  targetRole?: UserRole;
  notificationTitle: string;
  messageTemplate: string;
  notificationCategory: NotificationCategory;
}

export function fetchEventActionRules() {
  return api.get<EventActionRule[]>('/event-action-rules');
}

export function createEventActionRule(data: CreateEventActionRuleRequest) {
  return api.post<EventActionRule>('/event-action-rules', data);
}

export function setEventActionRuleEnabled(id: number, enabled: boolean) {
  return api.patch<EventActionRule>(`/event-action-rules/${id}`, { enabled });
}

export function deleteEventActionRule(id: number) {
  return api.del<void>(`/event-action-rules/${id}`);
}
