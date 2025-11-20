import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

/**
 * Reusable Button Component
 * 
 * Supports multiple variants, sizes, loading states, and icons.
 * Follows Swati Gold brand design system.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            fullWidth = false,
            loading = false,
            leftIcon,
            rightIcon,
            children,
            className = '',
            disabled,
            ...props
        },
        ref
    ) => {
        const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation no-select';

        const variantClasses = {
            primary: 'bg-gradient-to-r from-gold-500 to-accent-500 text-white hover:from-gold-600 hover:to-accent-600 focus:ring-gold-500 shadow-md hover:shadow-gold active:scale-95',
            secondary: 'bg-neutral-800 text-white hover:bg-neutral-700 focus:ring-neutral-500 shadow-md active:scale-95',
            outline: 'border-2 border-gold-500 text-gold-700 hover:bg-gold-50 focus:ring-gold-500 active:scale-95',
            ghost: 'text-gold-700 hover:bg-gold-50 focus:ring-gold-500 active:scale-95',
            danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md active:scale-95',
        };

        const sizeClasses = {
            sm: 'px-3 py-2 text-sm rounded-md gap-1.5 min-h-[40px]',
            md: 'px-4 py-2.5 text-base rounded-lg gap-2 min-h-[44px]',
            lg: 'px-6 py-3 text-lg rounded-lg gap-2.5 min-h-[48px]',
        };

        const widthClass = fullWidth ? 'w-full' : '';

        const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;

        return (
            <button
                ref={ref}
                className={combinedClasses}
                disabled={disabled || loading}
                aria-busy={loading}
                aria-disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <>
                        <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>Loading...</span>
                    </>
                ) : (
                    <>
                        {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
                        {children}
                        {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
