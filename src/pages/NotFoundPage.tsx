import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * NotFoundPage component for handling 404 errors
 * 
 * Features:
 * - User-friendly 404 error message
 * - Navigation back to home page
 * - Accessible design with proper ARIA labels
 * 
 * Requirements: 1.2.1, 1.2.2, 1.2.3, 1.2.4
 */
const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
            <div className="text-center max-w-2xl mx-auto">
                {/* 404 Icon */}
                <div className="mb-8">
                    <svg
                        className="mx-auto h-32 w-32 text-yellow-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                {/* Error Message */}
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                    Page Not Found
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                    Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or never existed.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                        aria-label="Go back to previous page"
                    >
                        <svg
                            className="mr-2 h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        Go Back
                    </button>

                    <Link
                        to="/"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                        aria-label="Go to home page"
                    >
                        <svg
                            className="mr-2 h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                        </svg>
                        Go to Home
                    </Link>
                </div>

                {/* Helpful Links */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-4">You might be looking for:</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link
                            to="/products-list"
                            className="text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
                        >
                            Products
                        </Link>
                        <Link
                            to="/price-trends"
                            className="text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
                        >
                            Price Trends
                        </Link>
                        <Link
                            to="/cart"
                            className="text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
                        >
                            Cart
                        </Link>
                        <Link
                            to="/contact"
                            className="text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
                        >
                            Contact
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
