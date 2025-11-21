import { useState, useCallback } from 'react';
import { getErrorMessage } from '../utils/errorHandler';
import { toast } from 'react-toastify';

interface UseErrorHandlerReturn {
  error: string | null;
  setError: (error: string | null) => void;
  handleError: (error: unknown, customMessage?: string) => void;
  clearError: () => void;
}

/**
 * Custom hook for consistent error handling across components
 */
export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    const errorMessage = customMessage || getErrorMessage(error);
    setError(errorMessage);
    toast.error(errorMessage);
    
    // Log error for debugging
    console.error('Error handled:', error);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    setError,
    handleError,
    clearError,
  };
};
