import React, { useState, memo } from 'react';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

const ResponsiveImageComponent: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  loading = 'lazy',
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Generate srcset for different sizes
  const generateSrcSet = (baseSrc: string) => {
    if (!baseSrc || baseSrc.includes('unsplash')) {
      // For Unsplash images, use their URL parameters
      return `
        ${baseSrc}?w=400 400w,
        ${baseSrc}?w=800 800w,
        ${baseSrc}?w=1200 1200w
      `.trim();
    }
    // For other images, return the original
    return baseSrc;
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
      <img
        src={imgSrc}
        srcSet={generateSrcSet(imgSrc)}
        sizes={sizes}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        onError={handleError}
        onLoad={handleLoad}
        loading={loading}
      />
    </div>
  );
};

export const ResponsiveImage = memo(ResponsiveImageComponent);
