/**
 * Swati Gold Brand Color Palette
 * 
 * This file defines the official color palette for the Swati Gold platform.
 * Colors are designed to convey premium quality, trust, and elegance.
 */

export const colors = {
    // Primary Gold Colors
    gold: {
        50: '#FFFBEB',   // Lightest gold tint
        100: '#FFF3C4',  // Very light gold
        200: '#FFE58F',  // Light gold
        300: '#FFD666',  // Medium light gold
        400: '#FFC53D',  // Medium gold
        500: '#FFD700',  // Primary gold (brand color)
        600: '#D4AF37',  // Dark gold
        700: '#B8860B',  // Darker gold
        800: '#9A7B0A',  // Very dark gold
        900: '#7C6608',  // Darkest gold
    },

    // Accent Orange-Gold
    accent: {
        50: '#FFF7ED',
        100: '#FFEDD5',
        200: '#FED7AA',
        300: '#FDBA74',
        400: '#FB923C',
        500: '#FFA500',  // Primary accent (orange-gold)
        600: '#EA580C',
        700: '#C2410C',
        800: '#9A3412',
        900: '#7C2D12',
    },

    // Neutral Colors
    neutral: {
        50: '#FAFAFA',
        100: '#F5F5F5',
        200: '#E5E5E5',
        300: '#D4D4D4',
        400: '#A3A3A3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#1A1A1A',  // Primary text color
    },

    // Semantic Colors
    success: {
        50: '#F0FDF4',
        100: '#DCFCE7',
        500: '#22C55E',
        600: '#16A34A',
        700: '#15803D',
    },

    error: {
        50: '#FEF2F2',
        100: '#FEE2E2',
        500: '#EF4444',
        600: '#DC2626',
        700: '#B91C1C',
    },

    warning: {
        50: '#FFFBEB',
        100: '#FEF3C7',
        500: '#F59E0B',
        600: '#D97706',
        700: '#B45309',
    },

    info: {
        50: '#EFF6FF',
        100: '#DBEAFE',
        500: '#3B82F6',
        600: '#2563EB',
        700: '#1D4ED8',
    },

    // Background Colors
    background: {
        primary: '#FFFFFF',
        secondary: '#FAFAFA',
        tertiary: '#F5F5F5',
    },

    // Border Colors
    border: {
        light: '#E5E5E5',
        medium: '#D4D4D4',
        dark: '#A3A3A3',
    },
} as const;

/**
 * Gradient definitions for brand elements
 */
export const gradients = {
    gold: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    goldSubtle: 'linear-gradient(135deg, #FFF3C4 0%, #FFE58F 100%)',
    goldDark: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
    premium: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #B8860B 100%)',
} as const;

/**
 * Shadow definitions for consistent elevation
 */
export const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    gold: '0 4px 14px 0 rgba(255, 215, 0, 0.39)',
    goldLg: '0 8px 24px 0 rgba(255, 215, 0, 0.5)',
} as const;

/**
 * Typography scale
 */
export const typography = {
    fontFamily: {
        heading: '"Playfair Display", serif',
        body: '"Inter", sans-serif',
        mono: '"JetBrains Mono", monospace',
    },
    fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem', // 36px
        '5xl': '3rem',    // 48px
    },
    fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
} as const;

/**
 * Spacing scale (in pixels)
 */
export const spacing = {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
} as const;

/**
 * Border radius scale
 */
export const borderRadius = {
    none: '0',
    sm: '0.125rem',  // 2px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    full: '9999px',
} as const;

/**
 * Z-index scale for consistent layering
 */
export const zIndex = {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
} as const;

export default colors;
