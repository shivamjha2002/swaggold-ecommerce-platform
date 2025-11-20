import React from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface LoadingStateProps {
    loading: boolean;
    error: string | null;
    onRetry?: () => void;
    children: React.ReactNode;
    loadingText?: string;
    errorVariant?: 'inline' | 'card' | 'banner';
    className?: string;
}

/**
 * LoadingState Component
 * 
 * A wrapper component that handles loading, error, and success states.
 * Simplifies the common pattern of showing loading spinners and error messages.
 * 
 * @param loading - Whether the content is currently loading
 * @param error - Error message to display (null if no error)
 * @param onRetry - Optional callback to retry the failed operation
 * @param children - Content to display when not loading and no error
 * @param loadingText - Optional text to show with the loading spinner
 * @param errorVariant - Style variant for error display
 * @param className - Additional CSS classes for the container
 * 
 * @example
 * ```tsx
 * <LoadingState loading={loading} error={error} onRetry={retry}>
 *   <ProductList products={products} />
 * </LoadingState>
 * ```
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
    loading,
    error,
    onRetry,
    children,
    loadingText,
    errorVariant = 'card',
    className = '',
}) => {
    if (loading) {
        return (
            <div className={`flex items-center justify-center py-12 ${className}`}>
                <LoadingSpinner size="lg" text={loadingText} />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`py-8 ${className}`}>
                <ErrorMessage
                    message={error}
                    onRetry={onRetry}
                    variant={errorVariant}
                />
            </div>
        );
    }

    return <>{children}</>;
};

export default LoadingState;
