/** @type {import('tailwindcss').Config} */
export default {
  // Content paths for CSS purging
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  
  // Safelist classes that might be dynamically generated
  safelist: [
    // Status badge colors
    'bg-yellow-100',
    'text-yellow-800',
    'bg-green-100',
    'text-green-800',
    'bg-blue-100',
    'text-blue-800',
    'bg-red-100',
    'text-red-800',
    'bg-gray-100',
    'text-gray-800',
  ],
  
  theme: {
    extend: {
      // Responsive breakpoints (mobile-first approach)
      screens: {
        'xs': '320px',   // Extra small devices
        'sm': '640px',   // Small devices (tablets)
        'md': '768px',   // Medium devices (tablets)
        'lg': '1024px',  // Large devices (desktops)
        'xl': '1280px',  // Extra large devices
        '2xl': '1536px', // 2X large devices
      },
      // Minimum touch target sizes for mobile
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  
  plugins: [],
  
  // Production optimizations
  future: {
    hoverOnlyWhenSupported: true, // Only apply hover styles when supported
  },
};
