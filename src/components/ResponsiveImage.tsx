import React, { useState, memo, useEffect } from 'react';
import { generateSrcSet, getOptimizedImageUrl } from '../utils/imageOptimization';
import { useNetworkStatus } from '../hooks/useResponsive';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  aspectRatio?: string; // e.g., '1/1', '16/9', '4/3'
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  priority?: boolean; // For above-the-fold images
}

const ResponsiveImageComponent: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  loading = 'lazy',
  aspectRatio,
  objectFit = 'cover',
  priority = false,
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { shouldReduceData, isSlowConnection } = useNetworkStatus();

  // Update image source when prop changes
  useEffect(() => {
    setImgSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Generate srcset with quality adjustment based on network
  const getSrcSet = (baseSrc: string) => {
    if (!baseSrc) return '';

    // Adjust quality based on network conditions
    const quality = shouldReduceData || isSlowConnection ? 60 : 80;

    if (baseSrc.includes('unsplash')) {
      // For Unsplash images, use their URL parameters
      return `
        ${baseSrc}?w=400&q=${quality}&auto=format 400w,
        ${baseSrc}?w=800&q=${quality}&auto=format 800w,
        ${baseSrc}?w=1200&q=${quality}&auto=format 1200w,
        ${baseSrc}?w=1600&q=${quality}&auto=format 1600w
      `.trim();
    }

    // For other images, use the utility function
    return generateSrcSet(baseSrc);
  };

  // Container styles for aspect ratio
  const containerStyle = aspectRatio
    ? { aspectRatio }
    : {};

  // Image styles
  const imageClasses = `
    w-full h-full
    ${objectFit === 'cover' ? 'object-cover' : ''}
    ${objectFit === 'contain' ? 'object-contain' : ''}
    ${objectFit === 'fill' ? 'object-fill' : ''}
    ${objectFit === 'none' ? 'object-none' : ''}
    ${objectFit === 'scale-down' ? 'object-scale-down' : ''}
    ${isLoading ? 'opacity-0' : 'opacity-100'}
    transition-opacity duration-500
    ${className}
  `.trim();

  return (
    <div
      className={`relative overflow-hidden ${aspectRatio ? '' : className}`}
      style={containerStyle}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border-2 sm:border-3 md:border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* Actual image */}
      <img
        src={imgSrc}
        srcSet={getSrcSet(imgSrc)}
        sizes={sizes}
        alt={alt}
        className={imageClasses}
        onError={handleError}
        onLoad={handleLoad}
        loading={priority ? 'eager' : loading}
        decoding={priority ? 'sync' : 'async'}
        // Add fetchpriority for priority images (modern browsers)
        {...(priority && { fetchpriority: 'high' as any })}
      />

      {/* Error indicator (optional) */}
      {hasError && (
        <div className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-75">
          Failed to load
        </div>
      )}
    </div>
  );
};

export const ResponsiveImage = memo(ResponsiveImageComponent);
