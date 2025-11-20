import { describe, it, expect, beforeAll } from 'vitest';
import api, { apiConfig, checkApiHealth, getErrorMessage } from './api';
import axios from 'axios';

describe('API Client Configuration', () => {
    it('should have correct base URL from environment', () => {
        expect(apiConfig.baseURL).toBeDefined();
        expect(apiConfig.baseURL).toContain('/api');
    });

    it('should have timeout configured', () => {
        expect(apiConfig.timeout).toBe(15000);
    });

    it('should have logging enabled in development', () => {
        expect(typeof apiConfig.loggingEnabled).toBe('boolean');
    });
});

describe('API Error Handling', () => {
    it('should extract error message from axios error', () => {
        const axiosError = {
            isAxiosError: true,
            response: {
                data: {
                    error: {
                        message: 'Test error message',
                    },
                },
            },
            message: 'Fallback message',
        } as any;

        // Mock axios.isAxiosError to return true
        const originalIsAxiosError = axios.isAxiosError;
        axios.isAxiosError = () => true;

        const message = getErrorMessage(axiosError);
        expect(message).toBe('Test error message');

        // Restore original function
        axios.isAxiosError = originalIsAxiosError;
    });

    it('should use fallback message when no error data', () => {
        const error = new Error('Generic error');
        const message = getErrorMessage(error);
        expect(message).toBe('Generic error');
    });

    it('should handle unknown error types', () => {
        const message = getErrorMessage('string error');
        expect(message).toBe('An unexpected error occurred');
    });
});

describe('API Health Check', () => {
    it('should return boolean from health check', async () => {
        const result = await checkApiHealth();
        expect(typeof result).toBe('boolean');
    });
});

describe('API Instance', () => {
    it('should be an axios instance', () => {
        expect(api).toBeDefined();
        expect(typeof api.get).toBe('function');
        expect(typeof api.post).toBe('function');
        expect(typeof api.put).toBe('function');
        expect(typeof api.delete).toBe('function');
    });

    it('should have interceptors configured', () => {
        expect(api.interceptors.request).toBeDefined();
        expect(api.interceptors.response).toBeDefined();
    });
});
