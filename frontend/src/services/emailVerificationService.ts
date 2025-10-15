const API_BASE_URL = 'http://localhost:3000';

export interface ResendVerificationResponse {
  message: string;
  success: boolean;
}

export const emailVerificationService = {
  async resendVerification(email: string): Promise<ResendVerificationResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to resend verification email');
    }

    return response.json();
  },
};