import { useState, useCallback } from 'react';
import { getErrorMessage } from '../utils/errorHandler';

interface ApiCallState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

interface UseApiCallReturn<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    execute: (...args: any[]) => Promise<T | null>;
    retry: () => Promise<T | null>;
    reset: () => void;
}

/**
 * Custom hook for managing API call states
 * 
 * Provides loading, error, and data states along with retry functionality.
 * Automatically extracts user-friendly error messages from API errors.
 * 
 * @param apiFunction - The async function to execute (API call)
 * @param options - Configuration options
 * @returns Object containing data, loading, error states and control functions
 * 
 * @example
 * ```tsx
 * const { data, loading, error, execute, retry } = useApiCall(
 *   productService.getProducts
 * );
 * 
 * useEffect(() => {
 *   execute();
 * }, []);
 * 
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error} onRetry={retry} />;
 * return <div>{data}</div>;
 * ```
 */
export function useApiCall<T>(
    apiFunction: (...args: any[]) => Promise<T>,
    options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: string) => void;
        showToast?: boolean;
    }
): UseApiCallReturn<T> {
    const [state, setState] = useState<ApiCallState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const [lastArgs, setLastArgs] = useState<any[]>([]);

    const execute = useCallback(
        async (...args: any[]): Promise<T | null> => {
            setState((prev) => ({ ...prev, loading: true, error: null }));
            setLastArgs(args);

            try {
                const result = await apiFunction(...args);
                setState({ data: result, loading: false, error: null });

                if (options?.onSuccess) {
                    options.onSuccess(result);
                }

                return result;
            } catch (err) {
                const errorMessage = getErrorMessage(err);
                setState({ data: null, loading: false, error: errorMessage });

                if (options?.onError) {
                    options.onError(errorMessage);
                }

                return null;
            }
        },
        [apiFunction, options]
    );

    const retry = useCallback(async (): Promise<T | null> => {
        return execute(...lastArgs);
    }, [execute, lastArgs]);

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null });
        setLastArgs([]);
    }, []);

    return {
        data: state.data,
        loading: state.loading,
        error: state.error,
        execute,
        retry,
        reset,
    };
}

export default useApiCall;
