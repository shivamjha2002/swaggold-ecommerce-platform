import { useState, useEffect } from 'react';

/**
 * Device type based on screen width
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Breakpoint values matching Tailwind config
 */
export const BREAKPOINTS = {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

/**
 * Hook to detect current device type and screen size
 * Returns device type, screen width, and boolean flags for each breakpoint
 */
export const useResponsive = () => {
    const [screenWidth, setScreenWidth] = useState<number>(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Call handler right away so state gets updated with initial window size
        handleResize();

        // Remove event listener on cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Determine device type
    const getDeviceType = (): DeviceType => {
        if (screenWidth < BREAKPOINTS.sm) return 'mobile';
        if (screenWidth < BREAKPOINTS.lg) return 'tablet';
        return 'desktop';
    };

    return {
        // Device type
        deviceType: getDeviceType(),

        // Screen width
        screenWidth,

        // Boolean flags for each breakpoint
        isMobile: screenWidth < BREAKPOINTS.sm,
        isTablet: screenWidth >= BREAKPOINTS.sm && screenWidth < BREAKPOINTS.lg,
        isDesktop: screenWidth >= BREAKPOINTS.lg,

        // Specific breakpoint checks
        isXs: screenWidth >= BREAKPOINTS.xs,
        isSm: screenWidth >= BREAKPOINTS.sm,
        isMd: screenWidth >= BREAKPOINTS.md,
        isLg: screenWidth >= BREAKPOINTS.lg,
        isXl: screenWidth >= BREAKPOINTS.xl,
        is2Xl: screenWidth >= BREAKPOINTS['2xl'],

        // Orientation
        isPortrait: typeof window !== 'undefined' && window.innerHeight > window.innerWidth,
        isLandscape: typeof window !== 'undefined' && window.innerWidth > window.innerHeight,
    };
};

/**
 * Hook to detect if device supports touch
 */
export const useTouch = () => {
    const [isTouch, setIsTouch] = useState<boolean>(false);

    useEffect(() => {
        const checkTouch = () => {
            setIsTouch(
                'ontouchstart' in window ||
                navigator.maxTouchPoints > 0 ||
                // @ts-ignore - for older browsers
                navigator.msMaxTouchPoints > 0
            );
        };

        checkTouch();
    }, []);

    return isTouch;
};

/**
 * Hook to detect device pixel ratio (for retina displays)
 */
export const useDevicePixelRatio = () => {
    const [dpr, setDpr] = useState<number>(
        typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    );

    useEffect(() => {
        const updateDpr = () => {
            setDpr(window.devicePixelRatio || 1);
        };

        // Listen for DPR changes (e.g., when moving window between displays)
        const mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', updateDpr);
            return () => mediaQuery.removeEventListener('change', updateDpr);
        }
    }, []);

    return {
        dpr,
        isRetina: dpr > 1,
        isHighDensity: dpr >= 2,
    };
};

/**
 * Hook to detect network connection quality
 * Useful for adaptive image loading
 */
export const useNetworkStatus = () => {
    const [networkStatus, setNetworkStatus] = useState<{
        online: boolean;
        effectiveType?: string;
        downlink?: number;
        saveData?: boolean;
    }>({
        online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    });

    useEffect(() => {
        const updateOnlineStatus = () => {
            setNetworkStatus((prev) => ({
                ...prev,
                online: navigator.onLine,
            }));
        };

        const updateConnectionInfo = () => {
            // @ts-ignore - NetworkInformation API
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

            if (connection) {
                setNetworkStatus({
                    online: navigator.onLine,
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    saveData: connection.saveData,
                });
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // @ts-ignore
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            connection.addEventListener('change', updateConnectionInfo);
        }

        // Initial check
        updateConnectionInfo();

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
            if (connection) {
                connection.removeEventListener('change', updateConnectionInfo);
            }
        };
    }, []);

    return {
        ...networkStatus,
        isSlowConnection: networkStatus.effectiveType === '2g' || networkStatus.effectiveType === 'slow-2g',
        isFastConnection: networkStatus.effectiveType === '4g',
        shouldReduceData: networkStatus.saveData || networkStatus.effectiveType === '2g',
    };
};

/**
 * Hook to detect if user prefers reduced motion
 * Important for accessibility
 */
export const usePrefersReducedMotion = () => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, []);

    return prefersReducedMotion;
};
