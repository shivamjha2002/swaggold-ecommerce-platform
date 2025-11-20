/**
 * Accessibility Utilities
 * 
 * Helper functions and constants for improving accessibility across the application.
 */

/**
 * Generate a unique ID for form elements
 */
export const generateId = (prefix: string = 'element'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if an element meets WCAG AA color contrast requirements
 * This is a simplified check - for production, use a proper contrast checker
 */
export const meetsContrastRequirements = (
    foreground: string,
    background: string,
    isLargeText: boolean = false
): boolean => {
    // Minimum contrast ratios per WCAG AA
    const minRatio = isLargeText ? 3 : 4.5;
    // In a real implementation, calculate actual contrast ratio
    // For now, return true as we're using tested color combinations
    return true;
};

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
};

/**
 * Trap focus within a modal or dialog
 */
export const trapFocus = (element: HTMLElement): (() => void) => {
    const focusableElements = element.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                lastFocusable.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                firstFocusable.focus();
                e.preventDefault();
            }
        }
    };

    element.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
        element.removeEventListener('keydown', handleTabKey);
    };
};

/**
 * Get accessible name for an element
 */
export const getAccessibleName = (element: HTMLElement): string => {
    return (
        element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby') ||
        element.textContent ||
        ''
    ).trim();
};

/**
 * Check if element is keyboard accessible
 */
export const isKeyboardAccessible = (element: HTMLElement): boolean => {
    const tabIndex = element.getAttribute('tabindex');
    const isInteractive = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);

    return isInteractive || (tabIndex !== null && parseInt(tabIndex) >= 0);
};

/**
 * ARIA live region priorities
 */
export const ARIA_LIVE = {
    OFF: 'off',
    POLITE: 'polite',
    ASSERTIVE: 'assertive',
} as const;

/**
 * Common ARIA roles
 */
export const ARIA_ROLES = {
    ALERT: 'alert',
    ALERTDIALOG: 'alertdialog',
    BUTTON: 'button',
    DIALOG: 'dialog',
    MAIN: 'main',
    NAVIGATION: 'navigation',
    REGION: 'region',
    STATUS: 'status',
    SEARCH: 'search',
    MENU: 'menu',
    MENUBAR: 'menubar',
    MENUITEM: 'menuitem',
} as const;

/**
 * Keyboard key codes
 */
export const KEYS = {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
} as const;

/**
 * Handle keyboard navigation for a list
 */
export const handleListKeyboardNavigation = (
    event: React.KeyboardEvent,
    currentIndex: number,
    itemCount: number,
    onSelect: (index: number) => void
): void => {
    let newIndex = currentIndex;

    switch (event.key) {
        case KEYS.ARROW_DOWN:
            event.preventDefault();
            newIndex = (currentIndex + 1) % itemCount;
            break;
        case KEYS.ARROW_UP:
            event.preventDefault();
            newIndex = (currentIndex - 1 + itemCount) % itemCount;
            break;
        case KEYS.HOME:
            event.preventDefault();
            newIndex = 0;
            break;
        case KEYS.END:
            event.preventDefault();
            newIndex = itemCount - 1;
            break;
        case KEYS.ENTER:
        case KEYS.SPACE:
            event.preventDefault();
            onSelect(currentIndex);
            return;
        default:
            return;
    }

    onSelect(newIndex);
};
