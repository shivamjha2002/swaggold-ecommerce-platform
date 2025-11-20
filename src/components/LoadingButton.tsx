import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  children,
  loadingText,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center gap-2 ${className} ${
        loading || disabled ? 'opacity-70 cursor-not-allowed' : ''
      }`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
};

export default LoadingButton;