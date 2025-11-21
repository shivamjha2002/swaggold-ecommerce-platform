import { useState, useEffect, useRef } from 'react';
import { getOptimizedImageUrl } from '../utils/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  lazy?: boolean;
  placeholder?: string;
}

/**
 * Optimized image component with lazy loading and format optimization
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  quality = 80,
  lazy = true,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3C/svg%3E',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [lazy]);

  // Get optimized image URL
  const optimizedSrc = getOptimizedImageUrl(src, {
    width,
    height,
    quality,
    format: 'webp',
  });

  // Fallback to JPEG if WebP fails
  const fallbackSrc = getOptimizedImageUrl(src, {
    width,
    height,
    quality,
    format: 'jpeg',
  });

  return (
    <picture>
      {/* WebP format for modern browsers */}
      <source srcSet={optimizedSrc} type="image/webp" />
      
      {/* JPEG fallback */}
      <source srcSet={fallbackSrc} type="image/jpeg" />
      
      {/* Actual image element */}
      <img
        ref={imgRef}
        src={isInView ? fallbackSrc : placeholder}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          // Fallback to original src if optimized version fails
          const target = e.target as HTMLImageElement;
          if (target.src !== src) {
            target.src = src;
          }
        }}
      />
    </picture>
  );
};

export default OptimizedImage;
