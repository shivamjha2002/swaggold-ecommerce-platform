import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={text || "Loading"}
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} aria-hidden="true" />
      {text && <p className="text-sm text-gray-600">{text}</p>}
      {!text && <span className="sr-only">Loading...</span>}
    </div>
  );
};

export default LoadingSpinner;
