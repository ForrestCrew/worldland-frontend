/**
 * API client for Hub backend communication
 * Configured for CORS with credentials
 */

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

interface ApiOptions extends RequestInit {
  /** Skip JSON parsing (for text responses like nonce) */
  rawResponse?: boolean;
}

class HubApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<T> {
    const { rawResponse, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      ...fetchOptions.headers,
    };

    // Add content-type for requests with body
    if (fetchOptions.body && typeof fetchOptions.body === 'string') {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    // Add auth token if available
    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // Include cookies for session
    });

    // Handle raw response (e.g., nonce endpoint returns plain text)
    if (rawResponse) {
      if (!response.ok) {
        throw new ApiError(response.status, await response.text());
      }
      return (await response.text()) as T;
    }

    // Handle JSON response
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.error?.message || data.error || data.message || 'Request failed',
        data.error?.code
      );
    }

    return data.data ?? data;
  }

  // Auth endpoints
  async getNonce(): Promise<{ nonce: string; expires_at: string }> {
    return this.request('/api/v1/auth/nonce');
  }

  async login(params: {
    message: string;
    signature: string;
  }): Promise<{ token: string; provider_id?: string }> {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async logout(): Promise<void> {
    return this.request('/api/v1/auth/logout', {
      method: 'POST',
    });
  }

  // Provider endpoints (for future use)
  async getNodes(): Promise<unknown[]> {
    return this.request('/api/v1/nodes');
  }

  // Rental endpoints (for future use)
  async findProviders(params: unknown): Promise<unknown[]> {
    return this.request('/api/v1/rentals/providers', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// Export singleton instance
export const hubApi = new HubApiClient(HUB_API_URL);

// Export for direct use
export { HubApiClient };
