import { apiService } from './apiService';

const API_BASE_URL = 'http://localhost:3000';

export interface FortnoxAuthStatus {
  authorized: boolean;
  expiresAt: number | null;
  expiresInMs: number | null;
}

/**
 * Check the current Fortnox authentication status
 */
export async function checkFortnoxAuthStatus(): Promise<FortnoxAuthStatus> {
  return await apiService.get<FortnoxAuthStatus>('/fortnox-auth/status');
}

/**
 * Initiate Fortnox OAuth login flow
 * Opens the login page in the current window
 */
export function initiateFortnoxLogin(): void {
  window.location.href = `${API_BASE_URL}/fortnox-auth/login`;
}

/**
 * Refresh the Fortnox access token
 */
export async function refreshFortnoxToken(): Promise<{ refreshed: boolean; expiresAt: number }> {
  return await apiService.post<{ refreshed: boolean; expiresAt: number }>('/fortnox-auth/refresh', {});
}
