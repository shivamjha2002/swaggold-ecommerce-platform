import React from 'react';

interface LogoProps {
    variant?: 'full' | 'icon' | 'text';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showText?: boolean;
}

/**
 * Swati Gold Logo Component
 * 
 * Features a stylized S and G intertwined with a gold leaf motif.
 * Can be displayed as icon only, text only, or full logo.
 */
export const Logo: React.FC<LogoProps> = ({
    variant = 'full',
    size = 'md',
    className = '',
    showText = true,
}) => {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
    };

    const textSizeClasses = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-3xl',
        xl: 'text-4xl',
    };

    const iconSize = {
        sm: 24,
        md: 32,
        lg: 48,
        xl: 64,
    };

    const renderIcon = () => (
        <svg
            width={iconSize[size]}
            height={iconSize[size]}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={sizeClasses[size]}
            aria-label="Swati Gold Logo"
        >
            <defs>
                {/* Gold gradient definition */}
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#B8860B" />
                </linearGradient>

                {/* Shine effect */}
                <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFD700" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#FFD700" stopOpacity="0.3" />
                </linearGradient>
            </defs>

            {/* Background circle with subtle glow */}
            <circle
                cx="50"
                cy="50"
                r="48"
                fill="url(#goldGradient)"
                opacity="0.1"
            />

            {/* Stylized 'S' - flowing curve */}
            <path
                d="M 35 25 Q 25 25 25 35 Q 25 45 35 45 L 50 45 Q 60 45 60 55 Q 60 65 50 65 L 40 65"
                stroke="url(#goldGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
            />

            {/* Stylized 'G' - intertwined with S */}
            <path
                d="M 75 35 Q 75 25 65 25 L 55 25 Q 50 25 50 30 L 50 70 Q 50 75 55 75 L 65 75 Q 75 75 75 65 L 75 55 L 60 55"
                stroke="url(#goldGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
            />

            {/* Gold leaf motif - decorative element */}
            <path
                d="M 50 15 Q 45 20 50 25 Q 55 20 50 15 Z"
                fill="url(#goldGradient)"
            />
            <path
                d="M 50 85 Q 45 80 50 75 Q 55 80 50 85 Z"
                fill="url(#goldGradient)"
            />

            {/* Shine effect overlay */}
            <ellipse
                cx="35"
                cy="30"
                rx="8"
                ry="12"
                fill="url(#shineGradient)"
                opacity="0.4"
                transform="rotate(-30 35 30)"
            />
        </svg>
    );

    const renderText = () => (
        <div className="flex flex-col leading-none">
            <span
                className={`font-heading font-bold bg-gradient-to-r from-gold-500 via-gold-600 to-gold-700 bg-clip-text text-transparent ${textSizeClasses[size]}`}
            >
                Swati Gold
            </span>
            {size !== 'sm' && (
                <span className="text-xs text-neutral-600 font-body tracking-wider uppercase">
                    Premium Jewellery
                </span>
            )}
        </div>
    );

    if (variant === 'icon') {
        return <div className={className}>{renderIcon()}</div>;
    }

    if (variant === 'text') {
        return <div className={className}>{renderText()}</div>;
    }

    // Full logo (icon + text)
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {renderIcon()}
            {showText && renderText()}
        </div>
    );
};

export default Logo;
