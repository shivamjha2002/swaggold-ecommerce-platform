import { AxiosError } from 'axios';

/**
 * Get user-friendly error message for prediction-related errors
 * Maps HTTP status codes and error types to helpful messages
 */
export const getPredictionErrorMessage = (error: unknown): string => {
    // Type guard for AxiosError
    const isAxiosError = (err: unknown): err is AxiosError => {
        return (err as AxiosError).isAxiosError === true;
    };

    if (isAxiosError(error)) {
        // Server responded with an error status
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data as any;

            // Extract backend error message if available
            const backendMessage =
                data?.error?.message ||
                data?.message ||
                data?.error;

            // Handle specific status codes with prediction-specific messages
            switch (status) {
                case 503:
                    return 'Prediction models are currently being trained. Please try again in a few minutes.';

                case 400:
                    // Use backend message for validation errors, or provide default
                    if (typeof backendMessage === 'string') {
                        return backendMessage;
                    }
                    return 'Invalid input. Please check your data and try again.';

                case 500:
                    return 'Server error occurred while generating prediction. Please contact support if the issue persists.';

                case 404:
                    return 'Prediction service not found. Please contact support.';

                default:
                    // Use backend message if available
                    if (typeof backendMessage === 'string') {
                        return backendMessage;
                    }
                    return `Prediction failed with status ${status}. Please try again.`;
            }
        }

        // Request was made but no response received (network error)
        if (error.request) {
            // Check if it's a timeout
            if (error.code === 'ECONNABORTED') {
                return 'Prediction request timed out. The server may be busy training models. Please try again.';
            }

            // Check if it's a network error
            if (error.message && error.message.toLowerCase().includes('network')) {
                return 'Network error. Please check your internet connection and try again.';
            }

            return 'Unable to connect to prediction service. Please check your connection and try again.';
        }

        // Error in setting up the request
        if (error.message) {
            return `Request error: ${error.message}`;
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
    return 'An unexpected error occurred while generating prediction. Please try again.';
};

/**
 * Check if error indicates models need training
 */
export const isModelNotTrainedError = (error: unknown): boolean => {
    const isAxiosError = (err: unknown): err is AxiosError => {
        return (err as AxiosError).isAxiosError === true;
    };

    if (isAxiosError(error) && error.response) {
        const status = error.response.status;
        const data = error.response.data as any;
        const message = data?.error?.message || data?.message || '';

        // Check for 503 status or specific message about training
        return (
            status === 503 ||
            (typeof message === 'string' &&
                (message.toLowerCase().includes('not trained') ||
                    message.toLowerCase().includes('training')))
        );
    }

    return false;
};

/**
 * Check if error is a network/connection error
 */
export const isNetworkError = (error: unknown): boolean => {
    const isAxiosError = (err: unknown): err is AxiosError => {
        return (err as AxiosError).isAxiosError === true;
    };

    if (isAxiosError(error)) {
        // No response received
        if (error.request && !error.response) {
            return true;
        }

        // Network-related error message
        if (error.message && error.message.toLowerCase().includes('network')) {
            return true;
        }

        // Timeout
        if (error.code === 'ECONNABORTED') {
            return true;
        }
    }

    return false;
};
