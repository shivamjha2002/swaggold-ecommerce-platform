import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import { storeIntendedDestination } from '../../utils/navigation';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

/**
 * ProtectedRoute component that enforces authentication for protected pages
 * 
 * Features:
 * - Checks for valid JWT token in localStorage
 * - Verifies token expiration by decoding JWT
 * - Redirects to login page if token is missing or expired
 * - Displays loading spinner during token verification
 * - Passes user data from AuthContext to child components
 * - Stores intended destination for redirect after login
 * 
 * Requirements: 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.6
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireAdmin = false
}) => {
    const { user, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
    const location = useLocation();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(false);

    useEffect(() => {
        const verifyAccess = async () => {
            // Check for valid JWT token in localStorage
            const token = authService.getToken();

            if (!token) {
                // No token found, redirect to login
                setIsTokenValid(false);
                setIsVerifying(false);
                return;
            }

            // Verify token expiration by decoding JWT
            if (authService.isTokenExpired()) {
                // Token is expired, clear auth state and redirect to login
                console.log('Token expired, redirecting to login');
                authService.logout();
                setIsTokenValid(false);
                setIsVerifying(false);
                return;
            }

            // Token exists and is not expired
            setIsTokenValid(true);
            setIsVerifying(false);
        };

        // Only verify if AuthContext is not loading
        if (!authLoading) {
            verifyAccess();
        }
    }, [authLoading]);

    // Display loading spinner during token verification
    if (authLoading || isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-600 mx-auto"></div>
                    <p className="mt-6 text-lg text-gray-700 font-medium">Verifying access...</p>
                    <p className="mt-2 text-sm text-gray-500">Please wait while we check your credentials</p>
                </div>
            </div>
        );
    }

    // Redirect to login page if token is missing or expired
    // Store intended destination for redirect after login
    if (!isAuthenticated || !isTokenValid) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check admin access if required
    if (requireAdmin && !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="bg-red-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
                        <svg
                            className="h-10 w-10 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
                    <p className="text-gray-600 mb-6">
                        You don't have permission to access this page. Admin privileges are required.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Pass user data from AuthContext to child components
    return <>{children}</>;
};
