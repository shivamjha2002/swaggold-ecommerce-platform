import api from './api';
import { LoginRequest, LoginResponse, User, ApiResponse } from '../types';
import { cache } from '../utils/cache';

// Token refresh interval (15 minutes before expiration)
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
let refreshTokenTimer: NodeJS.Timeout | null = null;

/**
 * Decode JWT token to extract payload
 */
const decodeToken = (token: string): { exp?: number;[key: string]: unknown } | null => {
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
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired or will expire soon
 */
const isTokenExpired = (token: string, bufferSeconds: number = 60): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp - currentTime < bufferSeconds;
};

/**
 * Get token expiration time in milliseconds
 */
const getTokenExpirationTime = (token: string): number | null => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }
  return decoded.exp * 1000; // Convert to milliseconds
};

export const authService = {
  /**
   * Login user and get JWT token
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);

    // Store token and user data in localStorage
    if (response.data.success && response.data.data) {
      // Handle both 'token' and 'access_token' from backend
      const token = response.data.data.token || response.data.data.access_token;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('tokenTimestamp', Date.now().toString());

        // Start automatic token refresh
        authService.startTokenRefresh();
      }
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data;
  },

  /**
   * Logout user and clear stored data
   */
  logout: async (): Promise<void> => {
    try {
      // Optional: Call backend logout endpoint for token invalidation
      // This is a best-effort call - we'll clear local data regardless of success
      const token = authService.getToken();
      if (token) {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          // Ignore errors from logout endpoint - we'll clear local data anyway
          console.warn('Backend logout call failed, continuing with local cleanup:', error);
        }
      }
    } finally {
      // Always clear local data, even if backend call fails
      // Stop token refresh timer
      authService.stopTokenRefresh();

      // Clear stored data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenTimestamp');
    }
  },

  /**
   * Register a new user (public signup)
   */
  register: async (data: {
    username: string;
    email: string;
    password: string;
    role?: 'admin' | 'staff';
  }): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/auth/signup', data);
    return response.data;
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  },

  /**
   * Get stored JWT token
   */
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },

  /**
   * Check if user is admin
   */
  isAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === 'admin';
  },

  /**
   * Verify token validity by fetching current user
   */
  verifyToken: async (): Promise<ApiResponse<{ valid: boolean; user?: User }>> => {
    try {
      const token = authService.getToken();

      // If no token exists, return invalid immediately
      if (!token) {
        return {
          success: false,
          data: { valid: false },
        };
      }

      // Use /auth/me endpoint to verify token and get user data
      const response = await api.get<ApiResponse<User>>('/auth/me');

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: {
            valid: true,
            user: response.data.data,
          },
        };
      }

      return {
        success: false,
        data: { valid: false },
      };
    } catch (error) {
      // If verification fails, token is invalid
      return {
        success: false,
        data: { valid: false },
      };
    }
  },

  /**
   * Clear all cached data when authentication state changes
   */
  clearAuthCache: (): void => {
    // Clear all cache entries to ensure fresh data after auth state change
    cache.clearAll();
  },

  /**
   * Check if token exists before making authenticated API call
   */
  hasValidToken: (): boolean => {
    const token = authService.getToken();
    if (!token) {
      return false;
    }

    // Check if token is expired
    return !isTokenExpired(token);
  },

  /**
   * Check if token is expired
   */
  isTokenExpired: (): boolean => {
    const token = authService.getToken();
    if (!token) {
      return true;
    }
    return isTokenExpired(token);
  },

  /**
   * Get token expiration timestamp
   */
  getTokenExpiration: (): Date | null => {
    const token = authService.getToken();
    if (!token) {
      return null;
    }

    const expirationTime = getTokenExpirationTime(token);
    return expirationTime ? new Date(expirationTime) : null;
  },

  /**
   * Refresh the authentication token
   */
  refreshToken: async (): Promise<boolean> => {
    try {
      const currentToken = authService.getToken();
      if (!currentToken) {
        return false;
      }

      // Check if token is expired
      if (isTokenExpired(currentToken, 0)) {
        console.log('Token already expired, cannot refresh');
        authService.logout();
        return false;
      }

      // Call the /auth/me endpoint to verify and potentially refresh the token
      const response = await api.get<ApiResponse<User>>('/auth/me');

      if (response.data.success && response.data.data) {
        // Update user data
        localStorage.setItem('user', JSON.stringify(response.data.data));

        // If backend returns a new token in headers, update it
        const newToken = response.headers['x-new-token'];
        if (newToken) {
          localStorage.setItem('token', newToken);
          localStorage.setItem('tokenTimestamp', Date.now().toString());
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  },

  /**
   * Start automatic token refresh
   */
  startTokenRefresh: (): void => {
    // Clear any existing timer
    authService.stopTokenRefresh();

    const token = authService.getToken();
    if (!token) {
      return;
    }

    const expirationTime = getTokenExpirationTime(token);
    if (!expirationTime) {
      return;
    }

    // Calculate when to refresh (15 minutes before expiration)
    const currentTime = Date.now();
    const timeUntilRefresh = expirationTime - currentTime - TOKEN_REFRESH_INTERVAL;

    // If token expires in less than 15 minutes, refresh immediately
    if (timeUntilRefresh <= 0) {
      authService.refreshToken();
      return;
    }

    // Set timer to refresh token
    refreshTokenTimer = setTimeout(async () => {
      const success = await authService.refreshToken();
      if (success) {
        // Start next refresh cycle
        authService.startTokenRefresh();
      }
    }, timeUntilRefresh);

    console.log(`Token refresh scheduled in ${Math.floor(timeUntilRefresh / 1000 / 60)} minutes`);
  },

  /**
   * Stop automatic token refresh
   */
  stopTokenRefresh: (): void => {
    if (refreshTokenTimer) {
      clearTimeout(refreshTokenTimer);
      refreshTokenTimer = null;
    }
  },
};
