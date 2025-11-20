import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    loading?: 'lazy' | 'eager';
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

/**
 * OptimizedImage component with lazy loading and WebP support
 * Automatically uses WebP format when available and falls back to original format
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    className = '',
    width,
    height,
    loading = 'lazy',
    objectFit = 'cover',
}) => {
    const [imageSrc, setImageSrc] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        // Check if browser supports WebP
        const checkWebPSupport = async () => {
            const webpData = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';

            try {
                const img = new Image();
                img.src = webpData;
                await img.decode();
                return true;
            } catch {
                return false;
            }
        };

        const loadImage = async () => {
            const supportsWebP = await checkWebPSupport();

            // If src already includes a format or is a data URL, use it as-is
            if (src.includes('data:') || src.includes('.webp')) {
                setImageSrc(src);
                return;
            }

            // Try to use WebP version if supported
            if (supportsWebP && (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png'))) {
                const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');

                // Check if WebP version exists
                const img = new Image();
                img.src = webpSrc;

                img.onload = () => setImageSrc(webpSrc);
                img.onerror = () => setImageSrc(src); // Fallback to original
            } else {
                setImageSrc(src);
            }
        };

        loadImage();
    }, [src]);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    return (
        <div className={`relative ${className}`} style={{ width, height }}>
            {isLoading && (
                <div
                    className="absolute inset-0 bg-gray-200 animate-pulse rounded"
                    aria-label="Loading image"
                />
            )}

            {hasError ? (
                <div
                    className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400 rounded"
                    role="img"
                    aria-label={`Failed to load image: ${alt}`}
                >
                    <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                </div>
            ) : (
                <img
                    ref={imgRef}
                    src={imageSrc}
                    alt={alt}
                    className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                    width={width}
                    height={height}
                    loading={loading}
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{ objectFit }}
                />
            )}
        </div>
    );
};
