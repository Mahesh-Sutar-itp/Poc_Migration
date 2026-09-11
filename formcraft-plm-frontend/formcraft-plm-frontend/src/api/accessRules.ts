import { api } from './client';
import type { AccessRule, RuleEffect, UserRole } from '../types';

export interface CreateAccessRuleRequest {
  role: UserRole;
  actionKey: string;
  effect: RuleEffect;
}

export function fetchAccessRules() {
  return api.get<AccessRule[]>('/access-rules');
}

export function createAccessRule(data: CreateAccessRuleRequest) {
  return api.post<AccessRule>('/access-rules', data);
}
