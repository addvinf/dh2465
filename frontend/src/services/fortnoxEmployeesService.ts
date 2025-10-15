import { apiService } from './apiService';

export interface BatchPushResult {
  processed: number;
  successes: number;
  failures: number;
  dryRun: boolean;
  items: BatchResultItem[];
}

export async function pushToFortnox(options?: { limit?: number; dryRun?: boolean }): Promise<BatchPushResult> {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) params.set('limit', String(options.limit));
  if (options?.dryRun !== undefined) params.set('dryRun', String(options.dryRun));

  const endpoint = `/fortnox-employees/batch${params.toString() ? `?${params.toString()}` : ''}`;
  
  return await apiService.post<BatchPushResult>(endpoint, {});
}

export interface BatchResultItem {
  id: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
  details?: any;
  dryRun?: boolean;
  created?: unknown;
  flagUpdated?: boolean;
  flagError?: string;
  fortnoxEmployeeId?: string | null;
}

export interface BatchResponse {
  processed: number;
  successes: number;
  failures: number;
  dryRun: boolean;
  items: BatchResultItem[];
}

export async function pushEmployeesBatch(options?: { limit?: number; dryRun?: boolean }): Promise<BatchResponse> {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) params.set('limit', String(options.limit));
  if (options?.dryRun !== undefined) params.set('dryRun', String(options.dryRun));

  const endpoint = `/fortnox-employees/batch${params.toString() ? `?${params.toString()}` : ''}`;
  
  return await apiService.post<BatchResponse>(endpoint, {});
}


