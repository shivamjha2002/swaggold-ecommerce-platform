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
      // Swati Gold Brand Colors
      colors: {
        gold: {
          50: '#FFFBEB',
          100: '#FFF3C4',
          200: '#FFE58F',
          300: '#FFD666',
          400: '#FFC53D',
          500: '#FFD700',  // Primary gold
          600: '#D4AF37',
          700: '#B8860B',
          800: '#9A7B0A',
          900: '#7C6608',
        },
        accent: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FFA500',  // Orange-gold
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
      },

      // Swati Gold Typography
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },

      // Custom shadows with gold glow
      boxShadow: {
        'gold': '0 4px 14px 0 rgba(255, 215, 0, 0.39)',
        'gold-lg': '0 8px 24px 0 rgba(255, 215, 0, 0.5)',
      },

      // Custom animations
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'fade-in': 'fade-in 1s ease-out forwards',
        'fade-in-up': 'fade-in-up 1s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
      },

      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },

      // Responsive breakpoints (mobile-first approach)
      screens: {
        'xs': '320px',   // Extra small devices (iPhone SE)
        'sm': '640px',   // Small devices (large phones, small tablets)
        'md': '768px',   // Medium devices (tablets)
        'lg': '1024px',  // Large devices (desktops)
        'xl': '1280px',  // Extra large devices
        '2xl': '1536px', // 2X large devices
        // Custom breakpoints for specific devices
        'mobile': { 'max': '639px' },  // Mobile only
        'tablet': { 'min': '640px', 'max': '1023px' },  // Tablet only
        'desktop': { 'min': '1024px' },  // Desktop and above
      },

      // Minimum touch target sizes for mobile (WCAG 2.1 Level AAA)
      minHeight: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '48px',
      },

      // Mobile-optimized spacing
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },

  plugins: [],

  // Production optimizations
  future: {
    hoverOnlyWhenSupported: true, // Only apply hover styles when supported
  },
};
