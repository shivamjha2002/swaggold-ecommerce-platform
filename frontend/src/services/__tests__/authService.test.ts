import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../authService';
import api from '../api';

// Mock the api module
vi.mock('../api');

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should login user and store token', async () => {
      const credentials = {
        username: 'admin',
        password: 'password123',
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'test-token-123',
            user: {
              id: '1',
              username: 'admin',
              email: 'admin@test.com',
              role: 'admin' as const,
              is_active: true,
            },
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authService.login(credentials);

      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result.success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token-123');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockResponse.data.data.user)
      );
    });
  });

  describe('logout', () => {
    it('should clear stored data', () => {
      authService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from localStorage', () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@test.com',
        role: 'admin' as const,
        is_active: true,
      };

      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockUser));

      const user = authService.getCurrentUser();

      expect(localStorage.getItem).toHaveBeenCalledWith('user');
      expect(user).toEqual(mockUser);
    });

    it('should return null if no user in localStorage', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const user = authService.getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      const mockToken = 'test-token-123';
      vi.mocked(localStorage.getItem).mockReturnValue(mockToken);

      const token = authService.getToken();

      expect(localStorage.getItem).toHaveBeenCalledWith('token');
      expect(token).toBe(mockToken);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if token exists', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('test-token-123');

      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    it('should return false if no token', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const isAuth = authService.isAuthenticated();

      expect(isAuth).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true if user is admin', () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@test.com',
        role: 'admin' as const,
        is_active: true,
      };

      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockUser));

      const isAdmin = authService.isAdmin();

      expect(isAdmin).toBe(true);
    });

    it('should return false if user is not admin', () => {
      const mockUser = {
        id: '2',
        username: 'staff',
        email: 'staff@test.com',
        role: 'staff' as const,
        is_active: true,
      };

      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockUser));

      const isAdmin = authService.isAdmin();

      expect(isAdmin).toBe(false);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'password123',
        role: 'staff' as const,
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '3',
            username: 'newuser',
            email: 'newuser@test.com',
            role: 'staff' as const,
            is_active: true,
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authService.register(newUser);

      expect(api.post).toHaveBeenCalledWith('/auth/register', newUser);
      expect(result.success).toBe(true);
      expect(result.data.username).toBe('newuser');
    });
  });
});
