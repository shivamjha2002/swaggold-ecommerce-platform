/**
 * Form validation utilities with XSS protection
 */

// Maximum input lengths to prevent buffer overflow
export const MAX_STRING_LENGTH = 10000;
export const MAX_TEXT_LENGTH = 50000;
export const MAX_URL_LENGTH = 2048;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_USERNAME_LENGTH = 80;
export const MAX_NAME_LENGTH = 200;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PHONE_LENGTH = 15;
export const MIN_PHONE_LENGTH = 10;

/**
 * Sanitize string input by removing HTML tags and trimming
 */
export function sanitizeString(value: string, maxLength: number = MAX_STRING_LENGTH): string {
    if (!value) return '';

    // Remove HTML tags using a simple regex
    let sanitized = value.replace(/<[^>]*>/g, '');

    // Remove script tags and their content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Truncate if too long
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(value: string): string {
    if (!value) return '';

    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email) {
        return { isValid: false, error: 'Email is required' };
    }

    const sanitized = sanitizeString(email, MAX_EMAIL_LENGTH);

    if (sanitized.length > MAX_EMAIL_LENGTH) {
        return { isValid: false, error: `Email must not exceed ${MAX_EMAIL_LENGTH} characters` };
    }

    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(sanitized)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }

    // Check for consecutive dots
    if (sanitized.includes('..')) {
        return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true };
}

/**
 * Validate username format
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
    if (!username) {
        return { isValid: false, error: 'Username is required' };
    }

    const sanitized = sanitizeString(username, MAX_USERNAME_LENGTH);

    if (sanitized.length < 3) {
        return { isValid: false, error: 'Username must be at least 3 characters' };
    }

    if (sanitized.length > MAX_USERNAME_LENGTH) {
        return { isValid: false, error: `Username must not exceed ${MAX_USERNAME_LENGTH} characters` };
    }

    // Only allow alphanumeric and underscore
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(sanitized)) {
        return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }

    return { isValid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password) {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        return { isValid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
        return { isValid: false, error: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters` };
    }

    return { isValid: true };
}

/**
 * Validate password match
 */
export function validatePasswordMatch(password: string, confirmPassword: string): { isValid: boolean; error?: string } {
    if (!confirmPassword) {
        return { isValid: false, error: 'Please confirm your password' };
    }

    if (password !== confirmPassword) {
        return { isValid: false, error: 'Passwords do not match' };
    }

    return { isValid: true };
}

/**
 * Validate name (full name, first name, etc.)
 */
export function validateName(name: string, fieldName: string = 'Name'): { isValid: boolean; error?: string } {
    if (!name) {
        return { isValid: false, error: `${fieldName} is required` };
    }

    const sanitized = sanitizeString(name, MAX_NAME_LENGTH);

    if (sanitized.length < 2) {
        return { isValid: false, error: `${fieldName} must be at least 2 characters` };
    }

    if (sanitized.length > MAX_NAME_LENGTH) {
        return { isValid: false, error: `${fieldName} must not exceed ${MAX_NAME_LENGTH} characters` };
    }

    return { isValid: true };
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): { isValid: boolean; error?: string } {
    if (!phone) {
        return { isValid: false, error: 'Phone number is required' };
    }

    // Remove common separators
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

    // Check if only digits
    if (!/^\d+$/.test(cleaned)) {
        return { isValid: false, error: 'Phone number must contain only digits' };
    }

    // Check length
    if (cleaned.length < MIN_PHONE_LENGTH || cleaned.length > MAX_PHONE_LENGTH) {
        return { isValid: false, error: `Phone number must be between ${MIN_PHONE_LENGTH} and ${MAX_PHONE_LENGTH} digits` };
    }

    return { isValid: true };
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): { isValid: boolean; error?: string } {
    if (!url) {
        return { isValid: false, error: 'URL is required' };
    }

    const sanitized = sanitizeString(url, MAX_URL_LENGTH);

    if (sanitized.length > MAX_URL_LENGTH) {
        return { isValid: false, error: `URL must not exceed ${MAX_URL_LENGTH} characters` };
    }

    // Only allow http and https protocols
    if (!sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
        return { isValid: false, error: 'URL must start with http:// or https://' };
    }

    // Check for dangerous patterns
    const dangerous = ['javascript:', 'data:', 'vbscript:', 'file:', '<script', 'onerror=', 'onclick='];
    const urlLower = sanitized.toLowerCase();

    for (const pattern of dangerous) {
        if (urlLower.includes(pattern)) {
            return { isValid: false, error: 'URL contains invalid content' };
        }
    }

    try {
        new URL(sanitized);
        return { isValid: true };
    } catch {
        return { isValid: false, error: 'Please enter a valid URL' };
    }
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string = 'This field'): { isValid: boolean; error?: string } {
    if (value === null || value === undefined || value === '') {
        return { isValid: false, error: `${fieldName} is required` };
    }

    if (typeof value === 'string' && value.trim() === '') {
        return { isValid: false, error: `${fieldName} is required` };
    }

    return { isValid: true };
}

/**
 * Validate string length
 */
export function validateLength(
    value: string,
    fieldName: string,
    minLength?: number,
    maxLength?: number
): { isValid: boolean; error?: string } {
    if (!value) {
        if (minLength && minLength > 0) {
            return { isValid: false, error: `${fieldName} is required` };
        }
        return { isValid: true };
    }

    const length = value.trim().length;

    if (minLength && length < minLength) {
        return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }

    if (maxLength && length > maxLength) {
        return { isValid: false, error: `${fieldName} must not exceed ${maxLength} characters` };
    }

    return { isValid: true };
}

/**
 * Validate numeric value
 */
export function validateNumber(
    value: any,
    fieldName: string,
    min?: number,
    max?: number
): { isValid: boolean; error?: string } {
    if (value === null || value === undefined || value === '') {
        return { isValid: false, error: `${fieldName} is required` };
    }

    const num = Number(value);

    if (isNaN(num)) {
        return { isValid: false, error: `${fieldName} must be a valid number` };
    }

    if (min !== undefined && num < min) {
        return { isValid: false, error: `${fieldName} must be at least ${min}` };
    }

    if (max !== undefined && num > max) {
        return { isValid: false, error: `${fieldName} must not exceed ${max}` };
    }

    return { isValid: true };
}

/**
 * Validate file upload
 */
export function validateFile(
    file: File | null,
    allowedTypes: string[],
    maxSizeMB: number
): { isValid: boolean; error?: string } {
    if (!file) {
        return { isValid: false, error: 'Please select a file' };
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
        return { isValid: false, error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return { isValid: false, error: `File size must not exceed ${maxSizeMB} MB` };
    }

    return { isValid: true };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File | null, maxSizeMB: number = 5): { isValid: boolean; error?: string } {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return validateFile(file, allowedTypes, maxSizeMB);
}

/**
 * Sanitize object by removing HTML from all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item =>
                typeof item === 'string' ? sanitizeString(item) : item
            );
        } else if (value && typeof value === 'object') {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized as T;
}

/**
 * Check for potential XSS patterns
 */
export function containsXSS(value: string): boolean {
    if (!value) return false;

    const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,  // Event handlers like onclick=
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /eval\(/i,
        /expression\(/i,
    ];

    return xssPatterns.some(pattern => pattern.test(value));
}

/**
 * Validate and sanitize form data
 */
export function validateAndSanitizeFormData<T extends Record<string, any>>(
    data: T,
    validationRules: Record<keyof T, (value: any) => { isValid: boolean; error?: string }>
): { isValid: boolean; errors: Partial<Record<keyof T, string>>; sanitizedData: T } {
    const errors: Partial<Record<keyof T, string>> = {};
    const sanitizedData = sanitizeObject(data);

    for (const [field, validator] of Object.entries(validationRules)) {
        const result = validator(sanitizedData[field]);
        if (!result.isValid) {
            errors[field as keyof T] = result.error;
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitizedData
    };
}
