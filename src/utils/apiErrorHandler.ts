import { AxiosError } from 'axios';
import showToast from './toast';
import { getErrorMessage } from './errorHandler';

/**
 * Configuration options for API error handling
 */
export interface ApiErrorHandlerOptions {
    /** Whether to show a toast notification for the error */
    showToast?: boolean;
    /** Custom error message to display instead of the extracted one */
    customMessage?: string;
    /** Callback function to execute on error */
    onError?: (error: string) => void;
    /** Whether to suppress 401 errors (handled by auth interceptor) */
    suppress401?: boolean;
}

/**
 * Enhanced API error handler with configurable options
 * 
 * Extracts user-friendly error messages and optionally displays toast notifications.
 * Provides consistent error handling across the application.
 * 
 * @param error - The error object from the API call
 * @param options - Configuration options for error handling
 * @returns The extracted error message
 * 
 * @example
 * ```tsx
 * try {
 *   await api.post('/products', data);
 * } catch (error) {
 *   const message = handleApiErrorWithOptions(error, {
 *     showToast: true,
 *     customMessage: 'Failed to create product',
 *     onError: (msg) => setError(msg)
 *   });
 * }
 * ```
 */
export function handleApiErrorWithOptions(
    error: unknown,
    options: ApiErrorHandlerOptions = {}
): string {
    const {
        showToast: shouldShowToast = true,
        customMessage,
        onError,
        suppress401 = true,
    } = options;

    // Extract the error message
    const extractedMessage = getErrorMessage(error);
    const finalMessage = customMessage || extractedMessage;

    // Check if it's a 401 error
    const isAxiosError = (err: unknown): err is AxiosError => {
        return (err as AxiosError).isAxiosError === true;
    };

    const is401Error = isAxiosError(error) && error.response?.status === 401;

    // Show toast if enabled and not a 401 error (or if 401 suppression is disabled)
    if (shouldShowToast && (!is401Error || !suppress401)) {
        showToast.error(finalMessage);
    }

    // Execute callback if provided
    if (onError) {
        onError(finalMessage);
    }

    return finalMessage;
}

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
    /** Maximum number of retry attempts */
    maxRetries?: number;
    /** Delay between retries in milliseconds */
    retryDelay?: number;
    /** Whether to use exponential backoff for retry delays */
    exponentialBackoff?: boolean;
    /** Function to determine if an error should trigger a retry */
    shouldRetry?: (error: unknown, attemptNumber: number) => boolean;
}

/**
 * Execute an API call with automatic retry logic
 * 
 * Automatically retries failed API calls based on the provided configuration.
 * Useful for handling transient network errors.
 * 
 * @param apiCall - The async function to execute
 * @param config - Retry configuration options
 * @returns Promise resolving to the API call result
 * 
 * @example
 * ```tsx
 * const data = await executeWithRetry(
 *   () => productService.getProducts(),
 *   { maxRetries: 3, retryDelay: 1000, exponentialBackoff: true }
 * );
 * ```
 */
export async function executeWithRetry<T>(
    apiCall: () => Promise<T>,
    config: RetryConfig = {}
): Promise<T> {
    const {
        maxRetries = 3,
        retryDelay = 1000,
        exponentialBackoff = true,
        shouldRetry = defaultShouldRetry,
    } = config;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            lastError = error;

            // Check if we should retry
            if (attempt < maxRetries && shouldRetry(error, attempt)) {
                // Calculate delay with optional exponential backoff
                const delay = exponentialBackoff
                    ? retryDelay * Math.pow(2, attempt)
                    : retryDelay;

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // No more retries or shouldn't retry this error
            throw error;
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError;
}

/**
 * Default function to determine if an error should trigger a retry
 * 
 * Retries on network errors and 5xx server errors, but not on client errors (4xx)
 */
function defaultShouldRetry(error: unknown, attemptNumber: number): boolean {
    const isAxiosError = (err: unknown): err is AxiosError => {
        return (err as AxiosError).isAxiosError === true;
    };

    if (!isAxiosError(error)) {
        return false;
    }

    // Don't retry on client errors (4xx)
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
        return false;
    }

    // Retry on network errors
    if (!error.response) {
        return true;
    }

    // Retry on server errors (5xx)
    if (error.response.status >= 500) {
        return true;
    }

    return false;
}

/**
 * Create a retry wrapper for a service method
 * 
 * Returns a new function that automatically retries the original function on failure.
 * 
 * @param serviceMethod - The service method to wrap
 * @param config - Retry configuration
 * @returns Wrapped function with retry logic
 * 
 * @example
 * ```tsx
 * const getProductsWithRetry = withRetry(
 *   productService.getProducts,
 *   { maxRetries: 3 }
 * );
 * 
 * const products = await getProductsWithRetry();
 * ```
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
    serviceMethod: T,
    config: RetryConfig = {}
): T {
    return ((...args: any[]) => {
        return executeWithRetry(() => serviceMethod(...args), config);
    }) as T;
}

export default handleApiErrorWithOptions;
