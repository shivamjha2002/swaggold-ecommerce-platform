import { AxiosError } from 'axios';
import showToast from './toast';

/**
 * Handle API errors and display appropriate toast notifications
 */
export const handleApiError = (error: unknown, customMessage?: string): string => {
  // Type guard for AxiosError
  const isAxiosError = (err: unknown): err is AxiosError => {
    return (err as AxiosError).isAxiosError === true;
  };

  // Extract the error message using the comprehensive getErrorMessage function
  const extractedMessage = getErrorMessage(error);
  const message = customMessage || extractedMessage;

  if (isAxiosError(error)) {
    // Don't show toast for 401 errors (handled by auth interceptor)
    if (error.response && error.response.status === 401) {
      return message;
    }
  }
  
  // Show toast for all other errors
  showToast.error(message);
  return message;
};

/**
 * Handle API success and display toast notification
 */
export const handleApiSuccess = (message: string) => {
  showToast.success(message);
};

/**
 * Extract error message from error object
 * Handles multiple error response formats from the backend
 */
export const getErrorMessage = (error: unknown): string => {
  // Type guard for AxiosError
  const isAxiosError = (err: unknown): err is AxiosError => {
    return (err as AxiosError).isAxiosError === true;
  };

  if (isAxiosError(error)) {
    // Server responded with an error status
    if (error.response) {
      const data = error.response.data as any;
      
      // Try multiple error message formats from backend
      // Format 1: { error: { message: "..." } }
      if (data?.error?.message && typeof data.error.message === 'string') {
        return data.error.message;
      }
      
      // Format 2: { message: "..." }
      if (data?.message && typeof data.message === 'string') {
        return data.message;
      }
      
      // Format 3: { error: "..." } (string error)
      if (data?.error && typeof data.error === 'string') {
        return data.error;
      }
      
      // Format 4: Handle validation errors with details
      if (data?.error?.details && typeof data.error.details === 'object') {
        const details = data.error.details;
        const fieldErrors = Object.entries(details)
          .map(([field, message]) => `${field}: ${message}`)
          .join(', ');
        if (fieldErrors) {
          return fieldErrors;
        }
      }
      
      // Format 5: Direct string response
      if (typeof data === 'string') {
        return data;
      }
      
      // Fallback with status code
      const statusText = error.response.statusText || 'Error';
      return `${statusText} (${error.response.status})`;
    }
    
    // Request was made but no response received (network error)
    if (error.request) {
      // Check if it's a timeout
      if (error.code === 'ECONNABORTED') {
        return 'Request timeout. Please try again.';
      }
      
      // Check if it's a network error
      if (error.message && error.message.toLowerCase().includes('network')) {
        return 'Network error. Please check your internet connection.';
      }
      
      return 'Unable to connect to server. Please check your connection and try again.';
    }
    
    // Error in setting up the request
    if (error.message) {
      return error.message;
    }
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Last resort fallback
  return 'An unexpected error occurred. Please try again.';
};

export default handleApiError;
