import { api } from './client';
import type { ExtensionInfo } from '../types';

export function fetchChangeRequestTransitionHandlers() {
  return api.get<ExtensionInfo[]>('/extensions/change-request-transition-handlers');
}
