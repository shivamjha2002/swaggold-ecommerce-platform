import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import React from 'react';

// Mock the authService
vi.mock('../services/authService', () => ({
    authService: {
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        getCurrentUser: vi.fn(),
        getToken: vi.fn(),
        verifyToken: vi.fn(),
        clearAuthCache: vi.fn(),
        isTokenExpired: vi.fn(),
        startTokenRefresh: vi.fn(),
        stopTokenRefresh: vi.fn(),
    },
}));

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should provide auth context with initial state', async () => {
        vi.mocked(authService.getCurrentUser).mockReturnValue(null);
        vi.mocked(authService.getToken).mockReturnValue(null);

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isAdmin).toBe(false);
    });

    it('should handle login successfully', async () => {
        const mockUser = {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            role: 'staff' as const,
            is_active: true,
        };

        vi.mocked(authService.getCurrentUser).mockReturnValue(null);
        vi.mocked(authService.getToken).mockReturnValue(null);
        vi.mocked(authService.login).mockResolvedValue({
            success: true,
            data: {
                token: 'test-token',
                user: mockUser,
            },
        });

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        await result.current.login({ username: 'testuser', password: 'password' });

        expect(authService.login).toHaveBeenCalledWith({
            username: 'testuser',
            password: 'password',
        });
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle signup successfully', async () => {
        const mockUser = {
            id: '1',
            username: 'newuser',
            email: 'new@example.com',
            role: 'staff' as const,
            is_active: true,
        };

        vi.mocked(authService.getCurrentUser).mockReturnValue(null);
        vi.mocked(authService.getToken).mockReturnValue(null);
        vi.mocked(authService.register).mockResolvedValue({
            success: true,
            data: mockUser,
        });

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        await result.current.signup({
            username: 'newuser',
            email: 'new@example.com',
            password: 'password123',
        });

        expect(authService.register).toHaveBeenCalledWith({
            username: 'newuser',
            email: 'new@example.com',
            password: 'password123',
        });
    });

    it('should handle logout', async () => {
        const mockUser = {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            role: 'staff' as const,
            is_active: true,
        };

        vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
        vi.mocked(authService.getToken).mockReturnValue('test-token');
        vi.mocked(authService.isTokenExpired).mockReturnValue(false);
        vi.mocked(authService.verifyToken).mockResolvedValue({
            success: true,
            data: { valid: true, user: mockUser },
        });

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(true);

        result.current.logout();

        expect(authService.logout).toHaveBeenCalled();
        expect(authService.clearAuthCache).toHaveBeenCalled();
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('should detect admin role', async () => {
        const mockAdminUser = {
            id: '1',
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin' as const,
            is_active: true,
        };

        vi.mocked(authService.getCurrentUser).mockReturnValue(mockAdminUser);
        vi.mocked(authService.getToken).mockReturnValue('admin-token');
        vi.mocked(authService.isTokenExpired).mockReturnValue(false);
        vi.mocked(authService.verifyToken).mockResolvedValue({
            success: true,
            data: { valid: true, user: mockAdminUser },
        });

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAdmin).toBe(true);
    });

    it('should clear auth state when token is expired on init', async () => {
        const mockUser = {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            role: 'staff' as const,
            is_active: true,
        };

        vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
        vi.mocked(authService.getToken).mockReturnValue('expired-token');
        vi.mocked(authService.isTokenExpired).mockReturnValue(true);

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <AuthProvider>{children}</AuthProvider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(authService.logout).toHaveBeenCalled();
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });
});
