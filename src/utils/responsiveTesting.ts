/**
 * Responsive Design Testing Utilities
 * 
 * Provides utilities for testing responsive design across different devices
 * and screen sizes during development.
 */

export interface DeviceConfig {
    name: string;
    width: number;
    height: number;
    userAgent: string;
    pixelRatio: number;
    touch: boolean;
}

/**
 * Common device configurations for testing
 */
export const DEVICE_CONFIGS: Record<string, DeviceConfig> = {
    // Mobile Devices
    'iPhone SE': {
        name: 'iPhone SE',
        width: 375,
        height: 667,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15',
        pixelRatio: 2,
        touch: true,
    },
    'iPhone 12/13': {
        name: 'iPhone 12/13',
        width: 390,
        height: 844,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        pixelRatio: 3,
        touch: true,
    },
    'iPhone 14 Pro Max': {
        name: 'iPhone 14 Pro Max',
        width: 430,
        height: 932,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        pixelRatio: 3,
        touch: true,
    },
    'Samsung Galaxy S21': {
        name: 'Samsung Galaxy S21',
        width: 360,
        height: 800,
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
        pixelRatio: 3,
        touch: true,
    },
    'Google Pixel 6': {
        name: 'Google Pixel 6',
        width: 412,
        height: 915,
        userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36',
        pixelRatio: 2.625,
        touch: true,
    },

    // Tablets
    'iPad Mini': {
        name: 'iPad Mini',
        width: 768,
        height: 1024,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        pixelRatio: 2,
        touch: true,
    },
    'iPad Air': {
        name: 'iPad Air',
        width: 820,
        height: 1180,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        pixelRatio: 2,
        touch: true,
    },
    'iPad Pro 12.9"': {
        name: 'iPad Pro 12.9"',
        width: 1024,
        height: 1366,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        pixelRatio: 2,
        touch: true,
    },
    'Samsung Galaxy Tab': {
        name: 'Samsung Galaxy Tab',
        width: 800,
        height: 1280,
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36',
        pixelRatio: 2,
        touch: true,
    },

    // Desktop
    'Desktop 1080p': {
        name: 'Desktop 1080p',
        width: 1920,
        height: 1080,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        pixelRatio: 1,
        touch: false,
    },
    'Desktop 1440p': {
        name: 'Desktop 1440p',
        width: 2560,
        height: 1440,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        pixelRatio: 1,
        touch: false,
    },
    'MacBook Pro 13"': {
        name: 'MacBook Pro 13"',
        width: 1440,
        height: 900,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        pixelRatio: 2,
        touch: false,
    },
};

/**
 * Responsive design checklist for testing
 */
export const RESPONSIVE_CHECKLIST = {
    layout: [
        'Content is readable without horizontal scrolling',
        'Navigation is accessible and usable',
        'Images scale appropriately',
        'Text is legible (minimum 16px on mobile)',
        'Buttons and links have adequate touch targets (44x44px minimum)',
        'Forms are easy to fill out on mobile',
        'Tables are responsive or scrollable',
    ],

    performance: [
        'Images are optimized for different screen sizes',
        'Page loads quickly on mobile networks',
        'Animations are smooth (60fps)',
        'No layout shifts during loading',
        'Critical content loads first',
    ],

    interaction: [
        'Touch targets are large enough (44x44px minimum)',
        'Hover states work on desktop',
        'Touch interactions work on mobile',
        'Keyboard navigation works',
        'Focus indicators are visible',
        'Gestures (swipe, pinch) work where appropriate',
    ],

    accessibility: [
        'Text has sufficient contrast',
        'Font sizes are readable',
        'Interactive elements are keyboard accessible',
        'Screen reader navigation works',
        'Form labels are properly associated',
        'Error messages are clear and helpful',
    ],

    crossBrowser: [
        'Works in Chrome',
        'Works in Safari',
        'Works in Firefox',
        'Works in Edge',
        'Works in mobile browsers',
    ],
};

/**
 * Get current viewport information
 */
export const getViewportInfo = () => {
    return {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
        touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    };
};

/**
 * Log responsive design information (for debugging)
 */
export const logResponsiveInfo = () => {
    const info = getViewportInfo();

    console.group('📱 Responsive Design Info');
    console.log('Viewport:', `${info.width}x${info.height}`);
    console.log('Device Pixel Ratio:', info.devicePixelRatio);
    console.log('Orientation:', info.orientation);
    console.log('Touch Support:', info.touchSupport);
    console.log('User Agent:', navigator.userAgent);
    console.groupEnd();

    return info;
};

/**
 * Test if element is visible in viewport
 */
export const isElementInViewport = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

/**
 * Get breakpoint name for current viewport
 */
export const getCurrentBreakpoint = (): string => {
    const width = window.innerWidth;

    if (width < 640) return 'xs (mobile)';
    if (width < 768) return 'sm (large mobile/small tablet)';
    if (width < 1024) return 'md (tablet)';
    if (width < 1280) return 'lg (desktop)';
    if (width < 1536) return 'xl (large desktop)';
    return '2xl (extra large desktop)';
};

/**
 * Simulate device for testing (development only)
 */
export const simulateDevice = (deviceName: keyof typeof DEVICE_CONFIGS) => {
    const device = DEVICE_CONFIGS[deviceName];

    if (!device) {
        console.error(`Device "${deviceName}" not found`);
        return;
    }

    console.log(`🔄 Simulating ${device.name}...`);
    console.log(`Resize your browser to ${device.width}x${device.height}`);
    console.log(`Device Pixel Ratio: ${device.pixelRatio}`);
    console.log(`Touch Support: ${device.touch}`);

    // Note: Actual device simulation requires browser DevTools
    // This function provides the configuration for manual testing

    return device;
};

/**
 * Check if touch targets meet minimum size requirements
 */
export const checkTouchTargets = (minSize: number = 44): HTMLElement[] => {
    const interactiveElements = document.querySelectorAll(
        'button, a, input, select, textarea, [role="button"], [onclick]'
    );

    const tooSmall: HTMLElement[] = [];

    interactiveElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width < minSize || rect.height < minSize) {
            tooSmall.push(element as HTMLElement);
        }
    });

    if (tooSmall.length > 0) {
        console.warn(`⚠️ Found ${tooSmall.length} touch targets smaller than ${minSize}px:`, tooSmall);
    } else {
        console.log(`✅ All touch targets meet minimum size of ${minSize}px`);
    }

    return tooSmall;
};

/**
 * Export device configurations for testing tools
 */
export const exportDeviceConfigs = () => {
    return Object.entries(DEVICE_CONFIGS).map(([key, config]) => ({
        id: key,
        ...config,
    }));
};
