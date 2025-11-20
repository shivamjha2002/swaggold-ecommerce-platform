import React from 'react';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';

interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
    variant?: 'inline' | 'card' | 'banner';
    className?: string;
    showIcon?: boolean;
}

/**
 * ErrorMessage Component
 * 
 * Displays user-friendly error messages with optional retry functionality.
 * Supports multiple display variants for different use cases.
 * 
 * @param message - The error message to display (user-friendly, not technical)
 * @param onRetry - Optional callback function to retry the failed operation
 * @param variant - Display style: 'inline' (compact), 'card' (boxed), or 'banner' (full-width)
 * @param className - Additional CSS classes
 * @param showIcon - Whether to show the error icon (default: true)
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
    message,
    onRetry,
    variant = 'inline',
    className = '',
    showIcon = true,
}) => {
    const baseClasses = 'flex items-start gap-3';

    const variantClasses = {
        inline: 'text-sm',
        card: 'p-4 bg-red-50 border border-red-200 rounded-lg',
        banner: 'p-4 bg-red-50 border-l-4 border-red-500 w-full',
    };

    const iconClasses = {
        inline: 'w-4 h-4 mt-0.5',
        card: 'w-5 h-5 mt-0.5',
        banner: 'w-6 h-6',
    };

    const textClasses = {
        inline: 'text-red-600',
        card: 'text-red-700',
        banner: 'text-red-800',
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            role="alert"
            aria-live="polite"
        >
            {showIcon && (
                <AlertCircle
                    className={`${iconClasses[variant]} text-red-500 flex-shrink-0`}
                    aria-hidden="true"
                />
            )}

            <div className="flex-1 min-w-0">
                <p className={`${textClasses[variant]} break-words`}>
                    {message}
                </p>

                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded px-2 py-1 transition-colors"
                        aria-label="Retry failed operation"
                    >
                        <RefreshCw className="w-4 h-4" aria-hidden="true" />
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * ErrorMessageCard Component
 * 
 * A pre-configured ErrorMessage with 'card' variant for common use cases.
 */
export const ErrorMessageCard: React.FC<Omit<ErrorMessageProps, 'variant'>> = (props) => {
    return <ErrorMessage {...props} variant="card" />;
};

/**
 * ErrorMessageBanner Component
 * 
 * A pre-configured ErrorMessage with 'banner' variant for page-level errors.
 */
export const ErrorMessageBanner: React.FC<Omit<ErrorMessageProps, 'variant'>> = (props) => {
    return <ErrorMessage {...props} variant="banner" />;
};

/**
 * ErrorMessageInline Component
 * 
 * A pre-configured ErrorMessage with 'inline' variant for form field errors.
 */
export const ErrorMessageInline: React.FC<Omit<ErrorMessageProps, 'variant'>> = (props) => {
    return <ErrorMessage {...props} variant="inline" />;
};

export default ErrorMessage;
