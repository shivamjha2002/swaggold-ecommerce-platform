/**
 * Performance monitoring utilities
 * Tracks page load times, component render times, and API call durations
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 100;

  /**
   * Measure the duration of a function execution
   */
  async measure<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      this.recordMetric(name, duration);

      if (import.meta.env.DEV) {
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name} (error)`, duration);
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(name: string, duration: number): void {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    // Keep only the last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name pattern
   */
  getMetricsByName(pattern: string | RegExp): PerformanceMetric[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return this.metrics.filter(metric => regex.test(metric.name));
  }

  /**
   * Get average duration for a metric name
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get Web Vitals metrics
   */
  getWebVitals(): {
    FCP?: number; // First Contentful Paint
    LCP?: number; // Largest Contentful Paint
    FID?: number; // First Input Delay
    CLS?: number; // Cumulative Layout Shift
    TTFB?: number; // Time to First Byte
  } {
    const vitals: any = {};

    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      vitals.TTFB = navigation.responseStart - navigation.requestStart;
    }

    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcp) {
      vitals.FCP = fcp.startTime;
    }

    // LCP, FID, and CLS require PerformanceObserver which should be set up separately
    // These are just placeholders for the structure

    return vitals;
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    if (!import.meta.env.DEV) return;

    console.group('📊 Performance Summary');

    const webVitals = this.getWebVitals();
    console.log('Web Vitals:', webVitals);

    const uniqueNames = [...new Set(this.metrics.map(m => m.name))];
    uniqueNames.forEach(name => {
      const avg = this.getAverageDuration(name);
      const count = this.getMetricsByName(name).length;
      console.log(`${name}: ${avg.toFixed(2)}ms (${count} calls)`);
    });

    console.groupEnd();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render time
 */
export function useMeasureRender(componentName: string) {
  if (import.meta.env.DEV) {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.measure(`Render: ${componentName}`, () => duration);
    };
  }

  return () => { }; // No-op in production
}

/**
 * Setup Web Vitals monitoring
 */
export function setupWebVitalsMonitoring(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;

      if (import.meta.env.DEV) {
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // LCP not supported
  }

  // First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const fid = entry.processingStart - entry.startTime;

        if (import.meta.env.DEV) {
          console.log('FID:', fid);
        }
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    // FID not supported
  }

  // Cumulative Layout Shift (CLS)
  try {
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      });

      if (import.meta.env.DEV) {
        console.log('CLS:', clsScore);
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // CLS not supported
  }
}
