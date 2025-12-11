/**
 * Authentication service
 * Handles login, register, logout, token management
 */

import { post, clearTokens, setTokens } from '../utils/api-client';
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserResponse,
} from '../types/api';

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<UserResponse> {
    return post<UserResponse>('/api/v1/auth/register', data);
  }

  /**
   * Login user and store tokens
   */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await post<TokenResponse>('/api/v1/auth/login', credentials);

    // Store tokens
    setTokens(response.accessToken, response.refreshToken);

    // Store user info from JWT payload
    try {
      const payload = this.decodeJWT(response.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexus_user', JSON.stringify({
          userId: payload.user_id || payload.sub,
          email: payload.email,
          username: payload.username || payload.email?.split('@')[0],
        }));
      }
    } catch (error) {
      console.error('Failed to decode JWT:', error);
    }

    return response;
  }

  /**
   * Logout user and clear tokens
   */
  async logout(): Promise<void> {
    try {
      await post('/api/v1/auth/logout', undefined, { requireAuth: true });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      clearTokens();
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<UserResponse> {
    return post<UserResponse>('/api/v1/auth/me', undefined, { requireAuth: true });
  }

  /**
   * Decode JWT token payload
   */
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return {};
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('nexus_access_token');
  }

  /**
   * Get stored user info
   */
  getStoredUser(): UserResponse | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('nexus_user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
