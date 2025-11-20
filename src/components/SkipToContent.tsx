import React from 'react';

/**
 * Skip to Content Link
 * 
 * Provides keyboard users with a way to skip navigation and jump directly to main content.
 * This is a WCAG 2.1 Level A requirement for accessibility.
 */
export const SkipToContent: React.FC = () => {
    return (
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-yellow-500 focus:text-black focus:font-semibold focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all duration-200"
            aria-label="Skip to main content"
        >
            Skip to main content
        </a>
    );
};

export default SkipToContent;
