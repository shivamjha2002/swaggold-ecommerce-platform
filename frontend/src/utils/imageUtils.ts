/**
 * Utility functions for handling image URLs
 */

/**
 * Get the full image URL, converting relative paths to absolute URLs
 * @param imageUrl - The image URL (can be relative or absolute)
 * @returns Full image URL
 */
export const getImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) {
    return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop';
  }

  // If it's already an absolute URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // If it's a relative URL (starts with /), prepend the backend base URL
  if (imageUrl.startsWith('/')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${imageUrl}`;
  }

  // Otherwise, return as is
  return imageUrl;
};
