import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RateLimitWarningProps {
    /** Number of attempts remaining */
    attemptsRemaining?: number;
    /** Maximum number of attempts allowed */
    maxAttempts?: number;
    /** Time until reset in seconds */
    resetTime?: number;
    /** Custom message */
    message?: string;
    /** Show warning even if not rate limited */
    alwaysShow?: boolean;
}

export const RateLimitWarning: React.FC<RateLimitWarningProps> = ({
    attemptsRemaining,
    maxAttempts = 5,
    resetTime,
    message,
    alwaysShow = false,
}) => {
    const [timeRemaining, setTimeRemaining] = useState(resetTime || 0);

    useEffect(() => {
        if (!resetTime || resetTime <= 0) return;

        setTimeRemaining(resetTime);

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [resetTime]);

    // Don't show if not rate limited and alwaysShow is false
    if (!alwaysShow && attemptsRemaining === undefined && !resetTime) {
        return null;
    }

    // Show warning if attempts are low
    const showWarning = attemptsRemaining !== undefined && attemptsRemaining <= 2;
    const isBlocked = attemptsRemaining === 0 || (resetTime && resetTime > 0);

    if (!showWarning && !isBlocked && !alwaysShow) {
        return null;
    }

    const formatTime = (seconds: number): string => {
        if (seconds < 60) {
            return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (remainingSeconds === 0) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <div
            className={`rounded-lg p-4 mb-4 border ${isBlocked
                    ? 'bg-red-900/20 border-red-500/50'
                    : 'bg-yellow-900/20 border-yellow-500/50'
                }`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start">
                <AlertTriangle
                    className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${isBlocked ? 'text-red-400' : 'text-yellow-400'
                        }`}
                    aria-hidden="true"
                />
                <div className="flex-1">
                    {message ? (
                        <p className="text-sm text-gray-200">{message}</p>
                    ) : isBlocked ? (
                        <>
                            <p className="text-sm font-semibold text-red-400 mb-1">
                                Too Many Attempts
                            </p>
                            <p className="text-sm text-gray-300">
                                You have exceeded the maximum number of attempts. Please try again in{' '}
                                <span className="font-semibold text-red-400">
                                    {formatTime(timeRemaining)}
                                </span>
                                .
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-semibold text-yellow-400 mb-1">
                                Limited Attempts Remaining
                            </p>
                            <p className="text-sm text-gray-300">
                                You have{' '}
                                <span className="font-semibold text-yellow-400">
                                    {attemptsRemaining} of {maxAttempts}
                                </span>{' '}
                                attempts remaining. Please ensure your information is correct.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RateLimitWarning;
