/**
 * Calculate password strength and return a score from 0-4
 * 0 = Very Weak, 1 = Weak, 2 = Fair, 3 = Good, 4 = Strong
 */
export const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;

    let strength = 0;

    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Contains lowercase
    if (/[a-z]/.test(password)) strength++;

    // Contains uppercase
    if (/[A-Z]/.test(password)) strength++;

    // Contains numbers
    if (/\d/.test(password)) strength++;

    // Contains special characters
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    // Normalize to 0-4 scale
    return Math.min(Math.floor(strength / 1.5), 4);
};

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (strength: number): string => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[strength] || 'Very Weak';
};

/**
 * Get password strength color
 */
export const getPasswordStrengthColor = (strength: number): string => {
    const colors = [
        'bg-red-500',
        'bg-orange-500',
        'bg-yellow-500',
        'bg-lime-500',
        'bg-green-500',
    ];
    return colors[strength] || 'bg-red-500';
};

/**
 * Get password strength text color
 */
export const getPasswordStrengthTextColor = (strength: number): string => {
    const colors = [
        'text-red-500',
        'text-orange-500',
        'text-yellow-500',
        'text-lime-500',
        'text-green-500',
    ];
    return colors[strength] || 'text-red-500';
};
