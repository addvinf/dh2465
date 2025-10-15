/**
 * Utility functions for handling Supabase authentication tokens
 */

export interface SupabaseTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * Extracts tokens from URL parameters (both query and hash)
 * Handles different Supabase token formats
 */
export function extractSupabaseTokens(searchParams: URLSearchParams): SupabaseTokens {
  // Try to get tokens from query parameters first
  let accessToken = searchParams.get('access_token');
  let refreshToken = searchParams.get('refresh_token');

  // If not in query params, check hash parameters (Supabase format)
  if (!accessToken && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    accessToken = hashParams.get('access_token');
    refreshToken = hashParams.get('refresh_token');
  }

  // Also check for 'token' parameter (alternative Supabase format)
  if (!accessToken) {
    accessToken = searchParams.get('token');
  }

  return {
    accessToken,
    refreshToken
  };
}

/**
 * Validates that required tokens are present
 */
export function validateTokens(tokens: SupabaseTokens): { isValid: boolean; error?: string } {
  if (!tokens.accessToken) {
    return {
      isValid: false,
      error: 'Invalid or expired reset link. Please request a new password reset.'
    };
  }

  return { isValid: true };
}