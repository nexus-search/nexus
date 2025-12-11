/**
 * HTTP client utility for API requests
 * Handles authentication, retries, and error transformation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
  timeout?: number;
}

/**
 * Get access token from localStorage
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nexus_access_token');
}

/**
 * Get refresh token from localStorage
 */
function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nexus_refresh_token');
}

/**
 * Set tokens in localStorage
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nexus_access_token', accessToken);
  localStorage.setItem('nexus_refresh_token', refreshToken);
}

/**
 * Clear tokens from localStorage
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('nexus_access_token');
  localStorage.removeItem('nexus_refresh_token');
  localStorage.removeItem('nexus_user');
}

/**
 * Refresh the access token
 */
async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

/**
 * Make an HTTP request with automatic token refresh on 401
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    requireAuth = false,
    timeout = 30000,
    headers = {},
    ...fetchOptions
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    ...headers as Record<string, string>,
  };

  // Add auth header if required
  if (requireAuth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401 - try to refresh token
    if (response.status === 401 && requireAuth) {
      try {
        const newToken = await refreshAccessToken();

        // Retry the request with new token
        requestHeaders['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, {
          ...fetchOptions,
          headers: requestHeaders,
        });

        if (!retryResponse.ok) {
          throw new ApiError(
            await extractErrorMessage(retryResponse),
            retryResponse.status,
            await retryResponse.json().catch(() => null)
          );
        }

        return await retryResponse.json();
      } catch (refreshError) {
        clearTokens();
        throw new ApiError('Authentication failed. Please login again.', 401);
      }
    }

    // Handle other error responses
    if (!response.ok) {
      const errorMessage = await extractErrorMessage(response);
      throw new ApiError(errorMessage, response.status, await response.json().catch(() => null));
    }

    // Handle no-content responses
    if (response.status === 204) {
      return null as T;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      throw new ApiError(error.message, 0);
    }

    throw new ApiError('An unexpected error occurred', 500);
  }
}

/**
 * Extract error message from response
 */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.detail || data.message || `HTTP ${response.status}: ${response.statusText}`;
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`;
  }
}

/**
 * GET request
 */
export async function get<T = any>(
  endpoint: string,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
export async function post<T = any>(
  endpoint: string,
  body?: any,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<T> {
  const headers: Record<string, string> = { ...(options?.headers as Record<string, string> || {}) };

  let requestBody: any = body;

  // Only add Content-Type for non-FormData bodies
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    headers,
    body: requestBody,
  });
}

/**
 * PUT request
 */
export async function put<T = any>(
  endpoint: string,
  body?: any,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<T> {
  const headers: Record<string, string> = { ...(options?.headers as Record<string, string> || {}) };

  let requestBody: any = body;

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    headers,
    body: requestBody,
  });
}

/**
 * PATCH request
 */
export async function patch<T = any>(
  endpoint: string,
  body?: any,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<T> {
  const headers: Record<string, string> = { ...(options?.headers as Record<string, string> || {}) };

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PATCH',
    headers,
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

/**
 * DELETE request
 */
export async function del<T = any>(
  endpoint: string,
  options?: Omit<RequestOptions, 'method' | 'body'>
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}
