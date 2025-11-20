import { NavigateFunction } from 'react-router-dom';

/**
 * Navigation helper utilities for programmatic routing
 * 
 * Provides centralized navigation functions that can be used throughout the app
 * for consistent routing behavior and easier maintenance.
 * 
 * Requirements: 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.8.1
 */

// Application route paths
export const ROUTES = {
    // Public routes
    HOME: '/',
    LANDING: '/',
    ABOUT: '/about',
    CONTACT: '/contact',

    // Auth routes
    LOGIN: '/login',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',

    // Protected routes
    PRODUCTS: '/products',
    PRODUCTS_LIST: '/products-list',
    PRODUCT_DETAIL: (id: string) => `/products/${id}`,
    CART: '/cart',
    CHECKOUT: '/checkout',
    CHECKOUT_NEW: '/checkout-new',
    PRICE_TRENDS: '/price-trends',
    KHATA: '/khata',
    PREDICTIONS: '/predictions',

    // Admin routes
    ADMIN_LOGIN: '/admin/login',
    ADMIN_DASHBOARD: '/admin',
    ADMIN_PRODUCTS: '/admin/products',
    ADMIN_ORDERS: '/admin/orders',

    // Error routes
    NOT_FOUND: '/404',
} as const;

/**
 * Navigation helper class for programmatic routing
 */
export class NavigationHelper {
    private navigate: NavigateFunction;

    constructor(navigate: NavigateFunction) {
        this.navigate = navigate;
    }

    // Public routes
    goToHome() {
        this.navigate(ROUTES.HOME);
    }

    goToAbout() {
        this.navigate(ROUTES.ABOUT);
    }

    goToContact() {
        this.navigate(ROUTES.CONTACT);
    }

    // Auth routes
    goToLogin(from?: string) {
        this.navigate(ROUTES.LOGIN, { state: { from } });
    }

    goToSignup() {
        this.navigate(ROUTES.SIGNUP);
    }

    goToForgotPassword() {
        this.navigate(ROUTES.FORGOT_PASSWORD);
    }

    goToResetPassword(token?: string) {
        if (token) {
            this.navigate(`${ROUTES.RESET_PASSWORD}?token=${token}`);
        } else {
            this.navigate(ROUTES.RESET_PASSWORD);
        }
    }

    // Protected routes
    goToProducts() {
        this.navigate(ROUTES.PRODUCTS);
    }

    goToProductsList() {
        this.navigate(ROUTES.PRODUCTS_LIST);
    }

    goToProductDetail(id: string) {
        this.navigate(ROUTES.PRODUCT_DETAIL(id));
    }

    goToCart() {
        this.navigate(ROUTES.CART);
    }

    goToCheckout() {
        this.navigate(ROUTES.CHECKOUT);
    }

    goToPriceTrends() {
        this.navigate(ROUTES.PRICE_TRENDS);
    }

    goToKhata() {
        this.navigate(ROUTES.KHATA);
    }

    goToPredictions() {
        this.navigate(ROUTES.PREDICTIONS);
    }

    // Admin routes
    goToAdminLogin() {
        this.navigate(ROUTES.ADMIN_LOGIN);
    }

    goToAdminDashboard() {
        this.navigate(ROUTES.ADMIN_DASHBOARD);
    }

    goToAdminProducts() {
        this.navigate(ROUTES.ADMIN_PRODUCTS);
    }

    goToAdminOrders() {
        this.navigate(ROUTES.ADMIN_ORDERS);
    }

    // Utility methods
    goBack() {
        this.navigate(-1);
    }

    goForward() {
        this.navigate(1);
    }

    replace(path: string) {
        this.navigate(path, { replace: true });
    }
}

/**
 * Hook to get navigation helper instance
 * Usage: const nav = useNavigationHelper();
 *        nav.goToProducts();
 */
export const createNavigationHelper = (navigate: NavigateFunction): NavigationHelper => {
    return new NavigationHelper(navigate);
};

/**
 * Check if a route requires authentication
 */
export const isProtectedRoute = (path: string): boolean => {
    const protectedPaths = [
        ROUTES.PRODUCTS_LIST,
        '/products/',
        ROUTES.CART,
        ROUTES.CHECKOUT,
        ROUTES.CHECKOUT_NEW,
        ROUTES.PRICE_TRENDS,
        ROUTES.KHATA,
        ROUTES.PREDICTIONS,
    ];

    return protectedPaths.some(protectedPath => path.startsWith(protectedPath));
};

/**
 * Check if a route requires admin access
 */
export const isAdminRoute = (path: string): boolean => {
    return path.startsWith('/admin') && path !== ROUTES.ADMIN_LOGIN;
};

/**
 * Get the redirect path after login based on the intended destination
 */
export const getRedirectPath = (from?: string): string => {
    // If there's a stored intended destination, use it
    if (from && from !== ROUTES.LOGIN && from !== ROUTES.SIGNUP) {
        return from;
    }

    // Default redirect to products list
    return ROUTES.PRODUCTS_LIST;
};

/**
 * Store the intended destination before redirecting to login
 */
export const storeIntendedDestination = (path: string): void => {
    if (path !== ROUTES.LOGIN && path !== ROUTES.SIGNUP) {
        sessionStorage.setItem('intendedDestination', path);
    }
};

/**
 * Get and clear the stored intended destination
 */
export const getAndClearIntendedDestination = (): string | null => {
    const destination = sessionStorage.getItem('intendedDestination');
    sessionStorage.removeItem('intendedDestination');
    return destination;
};
