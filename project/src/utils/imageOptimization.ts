/**
 * Image optimization utilities
 */

/**
 * Generate optimized image URL with proper format and size
 * @param url - Original image URL
 * @param options - Optimization options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }
): string {
  // If URL is already optimized or is a data URL, return as is
  if (!url || url.startsWith('data:') || url.includes('optimized')) {
    return url;
  }

  // For external CDN URLs (e.g., Cloudinary, Imgix), add optimization parameters
  if (url.includes('cloudinary.com')) {
    const params = [];
    if (options?.width) params.push(`w_${options.width}`);
    if (options?.height) params.push(`h_${options.height}`);
    if (options?.quality) params.push(`q_${options.quality}`);
    if (options?.format) params.push(`f_${options.format}`);
    
    // Insert parameters before /upload/ in Cloudinary URLs
    return url.replace('/upload/', `/upload/${params.join(',')}/`);
  }

  // For other URLs, return as is (could be extended for other CDNs)
  return url;
}

/**
 * Preload critical images
 * @param urls - Array of image URLs to preload
 */
export function preloadImages(urls: string[]): void {
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Lazy load image with intersection observer
 * @param img - Image element
 * @param src - Image source URL
 */
export function lazyLoadImage(img: HTMLImageElement, src: string): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    observer.observe(img);
  } else {
    // Fallback for browsers without IntersectionObserver
    img.src = src;
  }
}

/**
 * Get responsive image srcset
 * @param baseUrl - Base image URL
 * @param sizes - Array of sizes to generate
 * @returns srcset string
 */
export function getResponsiveSrcSet(
  baseUrl: string,
  sizes: number[] = [320, 640, 960, 1280, 1920]
): string {
  return sizes
    .map((size) => {
      const optimizedUrl = getOptimizedImageUrl(baseUrl, { width: size, format: 'webp' });
      return `${optimizedUrl} ${size}w`;
    })
    .join(', ');
}

/**
 * Convert image to WebP format if supported
 * @param url - Original image URL
 * @returns WebP URL if supported, original URL otherwise
 */
export function getWebPUrl(url: string): string {
  // Check if browser supports WebP
  const supportsWebP = document.createElement('canvas')
    .toDataURL('image/webp')
    .indexOf('data:image/webp') === 0;

  if (!supportsWebP) {
    return url;
  }

  // If URL already has format, replace it with webp
  if (url.match(/\.(jpg|jpeg|png)$/i)) {
    return url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  return getOptimizedImageUrl(url, { format: 'webp' });
}
