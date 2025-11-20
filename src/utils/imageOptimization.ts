/**
 * Image Optimization Utilities
 * 
 * Provides utilities for responsive image loading and optimization
 * across different screen sizes and devices.
 */

export interface ImageSizeConfig {
  width: number;
  height?: number;
  quality?: number;
}

export interface ResponsiveImageSizes {
  mobile: ImageSizeConfig;
  tablet: ImageSizeConfig;
  desktop: ImageSizeConfig;
}

/**
 * Generate srcset string for responsive images
 * Supports Unsplash and other image services
 */
export const generateSrcSet = (
  baseUrl: string,
  sizes: number[] = [400, 800, 1200, 1600]
): string => {
  if (!baseUrl) return '';

  // Check if it's an Unsplash URL
  if (baseUrl.includes('unsplash.com')) {
    return sizes
      .map((size) => `${baseUrl}?w=${size}&q=80&auto=format ${size}w`)
      .join(', ');
  }

  // For other URLs, return as-is (could be extended for other services)
  return baseUrl;
};

/**
 * Generate sizes attribute for responsive images
 * Defines how much of the viewport width the image should take
 */
export const generateSizesAttribute = (
  mobileVw: number = 100,
  tabletVw: number = 50,
  desktopVw: number = 33
): string => {
  return `(max-width: 639px) ${mobileVw}vw, (max-width: 1023px) ${tabletVw}vw, ${desktopVw}vw`;
};

/**
 * Get optimized image URL for specific dimensions
 * Useful for product images, thumbnails, etc.
 */
export const getOptimizedImageUrl = (
  baseUrl: string,
  width: number,
  height?: number,
  quality: number = 80
): string => {
  if (!baseUrl) return '';

  // Unsplash optimization
  if (baseUrl.includes('unsplash.com')) {
    let url = `${baseUrl}?w=${width}&q=${quality}&auto=format`;
    if (height) {
      url += `&h=${height}&fit=crop`;
    }
    return url;
  }

  // Return original URL for other sources
  return baseUrl;
};

/**
 * Preload critical images for better performance
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Check if device supports WebP format
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Get device pixel ratio for high-DPI displays
 */
export const getDevicePixelRatio = (): number => {
  return window.devicePixelRatio || 1;
};

/**
 * Calculate optimal image dimensions based on container and device
 */
export const calculateOptimalDimensions = (
  containerWidth: number,
  containerHeight?: number
): ImageSizeConfig => {
  const dpr = getDevicePixelRatio();
  const width = Math.ceil(containerWidth * dpr);
  const height = containerHeight ? Math.ceil(containerHeight * dpr) : undefined;

  return {
    width,
    height,
    quality: dpr > 1 ? 75 : 80, // Lower quality for high-DPI to save bandwidth
  };
};

/**
 * Lazy load images using Intersection Observer
 */
export const lazyLoadImage = (
  img: HTMLImageElement,
  options: IntersectionObserverInit = {}
): void => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01,
    ...options,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLImageElement;
        const src = target.dataset.src;
        const srcset = target.dataset.srcset;

        if (src) {
          target.src = src;
        }
        if (srcset) {
          target.srcset = srcset;
        }

        target.classList.remove('lazy');
        observer.unobserve(target);
      }
    });
  }, defaultOptions);

  observer.observe(img);
};

/**
 * Common responsive image configurations
 */
export const RESPONSIVE_IMAGE_CONFIGS = {
  productCard: {
    mobile: { width: 400, height: 400 },
    tablet: { width: 600, height: 600 },
    desktop: { width: 800, height: 800 },
  },
  productDetail: {
    mobile: { width: 600, height: 600 },
    tablet: { width: 800, height: 800 },
    desktop: { width: 1200, height: 1200 },
  },
  thumbnail: {
    mobile: { width: 100, height: 100 },
    tablet: { width: 150, height: 150 },
    desktop: { width: 200, height: 200 },
  },
  hero: {
    mobile: { width: 800, height: 600 },
    tablet: { width: 1200, height: 800 },
    desktop: { width: 1920, height: 1080 },
  },
};
