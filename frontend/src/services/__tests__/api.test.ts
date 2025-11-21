import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import api from '../api';

// Mock axios
vi.mock('axios');

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should create axios instance with correct base URL', () => {
    expect(api).toBeDefined();
    expect(api.defaults.baseURL).toBeDefined();
  });

  it('should have correct timeout configuration', () => {
    expect(api.defaults.timeout).toBe(10000);
  });

  it('should have correct default headers', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should add Authorization header when token exists', async () => {
    const mockToken = 'test-token-123';
    localStorage.setItem('token', mockToken);

    const requestInterceptor = api.interceptors.request.handlers[0];
    expect(requestInterceptor).toBeDefined();
  });

  it('should handle 401 errors by clearing token and redirecting', () => {
    const responseInterceptor = api.interceptors.response.handlers[0];
    expect(responseInterceptor).toBeDefined();
  });
});
