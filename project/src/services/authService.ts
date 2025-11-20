import api from './api';
import { LoginRequest, LoginResponse, User, ApiResponse } from '../types';
import { cache } from '../utils/cache';

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
      }
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  },

  /**
   * Logout user and clear stored data
   */
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
    return !!token;
  },
};
