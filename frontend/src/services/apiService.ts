const API_BASE_URL = 'http://localhost:3000';

const getAuthToken = async (): Promise<string | null> => {
  try {
    // Try to get token from secure storage first
    const { SecureTokenStorage } = await import('../utils/secureTokenStorage');
    const token = await SecureTokenStorage.getAccessToken();
    
    if (token) {
      return token;
    }

    // Fallback to development token storage
    const fallbackToken = SecureTokenStorage.getFallbackAccessToken();
    if (fallbackToken) {
      return fallbackToken;
    }

    // Last resort: check old localStorage (for migration)
    const session = localStorage.getItem('authSession');
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        return sessionData.access_token;
      } catch (error) {
        console.error('Error parsing session:', error);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

class ApiService {
  private async getAuthHeaders() {
    const token = await getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      credentials: 'include', // Include httpOnly cookies
      headers: await this.getAuthHeaders(),
      ...options,
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
      // Token expired or invalid, clear session and throw error
      // Let the auth context handle the redirect to avoid hard page reloads
      localStorage.removeItem('authSession');
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Convenience methods
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();