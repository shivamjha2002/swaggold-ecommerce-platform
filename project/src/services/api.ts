import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
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
  '/products',
  '/prices/current',
];

// Helper function to check if endpoint requires authentication
const requiresAuth = (url?: string): boolean => {
  if (!url) return false;
  
  // Check if URL matches any public endpoint
  return !PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    
    // Verify token exists for authenticated endpoints
    if (requiresAuth(config.url) && !token) {
      console.warn('Attempted to make authenticated API call without token:', config.url);
      // Redirect to login if trying to access authenticated endpoint without token
      window.location.href = '/login';
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
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and retry logic
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
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

export default api;
