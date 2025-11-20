/**
 * Performance monitoring utilities
 */

/**
 * Measure the execution time of a function
 */
export const measurePerformance = async <T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (import.meta.env.DEV) {
      console.log(`⏱️ ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (import.meta.env.DEV) {
      console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms`, error);
    }
    
    throw error;
  }
};

/**
 * Debounce function to limit how often a function can be called
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * Throttle function to ensure a function is called at most once in a specified time period
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Log component render performance (use in development only)
 */
export const logRenderPerformance = (componentName: string): void => {
  if (import.meta.env.DEV) {
    console.log(`🔄 ${componentName} rendered at ${new Date().toISOString()}`);
  }
};
