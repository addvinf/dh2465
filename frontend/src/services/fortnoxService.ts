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
  const response = await fetch(`${API_BASE_URL}/fortnox-auth/status`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to check Fortnox authentication status');
  }
  
  return response.json();
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
  const response = await fetch(`${API_BASE_URL}/fortnox-auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to refresh token');
  }
  
  return response.json();
}
