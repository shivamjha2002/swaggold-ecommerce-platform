import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { cacheService, withCache } from './cacheService';

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_TIMEOUT = 15000; // 15 seconds
const ENABLE_LOGGING = import.meta.env.DEV; // Enable logging in development mode

// Cacheable endpoints configuration (GET requests only)
const CACHEABLE_ENDPOINTS = [
  { pattern: /\/products(\?.*)?$/, ttl: 5 * 60 * 1000 }, // 5 minutes
  { pattern: /\/products\/[^/]+$/, ttl: 10 * 60 * 1000 }, // 10 minutes
  { pattern: /\/prices\/gold\/live/, ttl: 2 * 60 * 1000 }, // 2 minutes
  { pattern: /\/prices\/gold\/history/, ttl: 5 * 60 * 1000 }, // 5 minutes
];

// Logger utility for debugging
const logger = {
  request: (config: InternalAxiosRequestConfig) => {
    if (ENABLE_LOGGING) {
      console.group(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log('Base URL:', config.baseURL);
      console.log('Headers:', config.headers);
      if (config.params) console.log('Params:', config.params);
      if (config.data && !(config.data instanceof FormData)) {
        console.log('Data:', config.data);
      } else if (config.data instanceof FormData) {
        console.log('Data: FormData (binary)');
      }
      console.groupEnd();
    }
  },
  response: (response: AxiosResponse) => {
    if (ENABLE_LOGGING) {
      console.group(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
      console.log('Status:', response.status, response.statusText);
      console.log('Data:', response.data);
      console.log('Duration:', response.config.headers?.['X-Request-Duration'] || 'N/A');
      console.groupEnd();
    }
  },
  error: (error: AxiosError) => {
    if (ENABLE_LOGGING) {
      console.group(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.log('Status:', error.response?.status);
      console.log('Message:', error.message);
      console.log('Response Data:', error.response?.data);
      console.groupEnd();
    }
  },
};

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to determine if error is retryable
const isRetryableError = (error: AxiosError): boolean => {
  // Retry on network errors or 5xx server errors
  if (!error.response) {
    return true; // Network error
  }

  const status = error.response.status;
  return status >= 500 && status < 600;
};

// List of endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/signup',
  '/auth/verify',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/products',
  '/prices/current',
  '/prices/gold/live',
  '/cart',
  '/health',
];

// Helper function to check if endpoint requires authentication
const requiresAuth = (url?: string): boolean => {
  if (!url) return false;

  // Remove query parameters for matching
  const cleanUrl = url.split('?')[0];

  // Check if URL starts with any public endpoint
  // But exclude admin endpoints
  if (cleanUrl.includes('/admin')) {
    return true;
  }

  // Check if URL matches any public endpoint
  return !PUBLIC_ENDPOINTS.some(endpoint => cleanUrl.startsWith(endpoint) || cleanUrl.includes(endpoint));
};

// Request interceptor to add JWT token and logging
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add request timestamp for duration tracking
    config.headers['X-Request-Start-Time'] = Date.now().toString();

    const token = localStorage.getItem('token');

    // Verify token exists for authenticated endpoints
    if (requiresAuth(config.url) && !token) {
      console.warn('Attempted to make authenticated API call without token:', config.url);
      // Don't redirect immediately - let the response interceptor handle it
      // This prevents redirect loops during token verification
      return Promise.reject(new Error('Authentication required'));
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add retry count to config
    if (!config.headers['X-Retry-Count']) {
      config.headers['X-Retry-Count'] = '0';
    }

    // Remove Content-Type for FormData to let browser set it with boundary
    if (config.data instanceof FormData && config.headers['Content-Type']) {
      delete config.headers['Content-Type'];
    }

    // Log request details
    logger.request(config);

    return config;
  },
  (error: AxiosError) => {
    logger.error(error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and retry logic
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate request duration
    const startTime = response.config.headers?.['X-Request-Start-Time'];
    if (startTime) {
      const duration = Date.now() - parseInt(startTime as string);
      response.config.headers['X-Request-Duration'] = `${duration}ms`;
    }

    // Cache GET requests for cacheable endpoints
    if (response.config.method?.toLowerCase() === 'get' && response.config.url) {
      const cacheConfig = CACHEABLE_ENDPOINTS.find(config =>
        config.pattern.test(response.config.url || '')
      );

      if (cacheConfig) {
        const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
        cacheService.set(cacheKey, response.data, cacheConfig.ttl);
      }
    }

    // Log successful response
    logger.response(response);

    return response;
  },
  async (error: AxiosError) => {
    // Check if config exists
    if (!error.config) {
      return Promise.reject(error);
    }

    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      console.log('Authentication failed (401) - clearing auth state and redirecting to login');

      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Clear all cached data
      // Import cache dynamically to avoid circular dependency
      import('../utils/cache').then(({ cache }) => {
        cache.clearAll();
      });

      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }

    // Initialize retry count
    if (!config._retryCount) {
      config._retryCount = 0;
    }

    // Check if we should retry
    if (config._retryCount < MAX_RETRIES && isRetryableError(error)) {
      config._retryCount += 1;

      // Update retry count header
      if (config.headers) {
        config.headers['X-Retry-Count'] = config._retryCount.toString();
      }

      // Log retry attempt
      console.warn(
        `Retrying request (${config._retryCount}/${MAX_RETRIES}):`,
        config.url
      );

      // Wait before retrying (exponential backoff)
      await delay(RETRY_DELAY * config._retryCount);

      // Retry the request
      return api(config);
    }

    // Log error after all retries exhausted
    logger.error(error);

    interface ApiErrorResponse {
      error?: {
        message?: string;
      };
    }
    const errorData = error.response?.data as ApiErrorResponse | undefined;
    const errorMessage = errorData?.error?.message ||
      error.message ||
      'An unexpected error occurred';

    console.error('API Error:', errorMessage, {
      url: config?.url,
      method: config?.method,
      retries: config._retryCount,
    });

    return Promise.reject(error);
  }
);

// Export API instance and configuration
export default api;

// Export configuration for testing and debugging
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  loggingEnabled: ENABLE_LOGGING,
};

// Helper function to make cached GET requests
export const cachedGet = async <T>(url: string, params?: any): Promise<T> => {
  const cacheKey = `${url}${JSON.stringify(params || {})}`;

  // Check if this endpoint is cacheable
  const cacheConfig = CACHEABLE_ENDPOINTS.find(config => config.pattern.test(url));

  if (cacheConfig) {
    return withCache(
      cacheKey,
      async () => {
        const response = await api.get<T>(url, { params });
        return response.data;
      },
      cacheConfig.ttl
    );
  }

  // Not cacheable, make regular request
  const response = await api.get<T>(url, { params });
  return response.data;
};

// Export helper function to check API health
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

// Export helper to get formatted error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiErrorResponse | undefined;
    return apiError?.error?.message || error.message || 'An unexpected error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Type for API error response
interface ApiErrorResponse {
  error?: {
    message?: string;
    code?: number;
    details?: unknown;
  };
}
