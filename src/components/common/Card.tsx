import React from 'react';

export interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'elevated' | 'outlined' | 'gold';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

/**
 * Reusable Card Component
 * 
 * Provides consistent container styling with multiple variants.
 * Supports hover effects and click handlers.
 */
export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    padding = 'md',
    className = '',
    onClick,
    hoverable = false,
}) => {
    const baseClasses = 'rounded-lg transition-all duration-200';

    const variantClasses = {
        default: 'bg-white shadow-md',
        elevated: 'bg-white shadow-lg',
        outlined: 'bg-white border-2 border-neutral-200',
        gold: 'bg-gradient-to-br from-gold-50 to-accent-50 border border-gold-200 shadow-gold',
    };

    const paddingClasses = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
    };

    const hoverClasses = hoverable || onClick
        ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
        : '';

    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`;

    const Component = onClick ? 'button' : 'div';

    return (
        <Component
            className={combinedClasses}
            onClick={onClick}
            type={onClick ? 'button' : undefined}
        >
            {children}
        </Component>
    );
};

/**
 * Card Header Component
 */
export const CardHeader: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => {
    return (
        <div className={`border-b border-neutral-200 pb-3 mb-4 ${className}`}>
            {children}
        </div>
    );
};

/**
 * Card Title Component
 */
export const CardTitle: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => {
    return (
        <h3 className={`text-xl font-heading font-semibold text-neutral-900 ${className}`}>
            {children}
        </h3>
    );
};

/**
 * Card Description Component
 */
export const CardDescription: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => {
    return (
        <p className={`text-sm text-neutral-600 mt-1 ${className}`}>
            {children}
        </p>
    );
};

/**
 * Card Content Component
 */
export const CardContent: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => {
    return <div className={className}>{children}</div>;
};

/**
 * Card Footer Component
 */
export const CardFooter: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => {
    return (
        <div className={`border-t border-neutral-200 pt-3 mt-4 ${className}`}>
            {children}
        </div>
    );
};

export default Card;
