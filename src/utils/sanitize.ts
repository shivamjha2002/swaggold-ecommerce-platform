/**
 * Sanitization utilities to prevent XSS attacks.
 * 
 * These utilities help sanitize user input before rendering in the DOM
 * or sending to the backend.
 */

/**
 * Escape HTML special characters to prevent XSS attacks.
 * 
 * @param text - The text to escape
 * @returns Escaped text safe for HTML rendering
 */
export const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

/**
 * Strip HTML tags from text.
 * 
 * @param html - The HTML string to strip
 * @returns Plain text without HTML tags
 */
export const stripHtml = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
};

/**
 * Sanitize user input by removing potentially dangerous characters.
 * 
 * @param input - The input string to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
};

/**
 * Validate and sanitize email addresses.
 * 
 * @param email - The email to validate
 * @returns Sanitized email or null if invalid
 */
export const sanitizeEmail = (email: string): string | null => {
    const sanitized = sanitizeInput(email).toLowerCase();

    // Basic email validation regex
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

    if (!emailRegex.test(sanitized)) {
        return null;
    }

    return sanitized;
};

/**
 * Validate and sanitize username.
 * 
 * @param username - The username to validate
 * @returns Sanitized username or null if invalid
 */
export const sanitizeUsername = (username: string): string | null => {
    const sanitized = sanitizeInput(username);

    // Username should only contain alphanumeric characters and underscores
    const usernameRegex = /^[a-zA-Z0-9_]{3,80}$/;

    if (!usernameRegex.test(sanitized)) {
        return null;
    }

    return sanitized;
};

/**
 * Sanitize URL to prevent javascript: and data: URI attacks.
 * 
 * @param url - The URL to sanitize
 * @returns Sanitized URL or null if dangerous
 */
export const sanitizeUrl = (url: string): string | null => {
    const sanitized = sanitizeInput(url);

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = sanitized.toLowerCase();

    for (const protocol of dangerousProtocols) {
        if (lowerUrl.startsWith(protocol)) {
            return null;
        }
    }

    // Only allow http, https, and relative URLs
    if (!lowerUrl.startsWith('http://') &&
        !lowerUrl.startsWith('https://') &&
        !lowerUrl.startsWith('/') &&
        !lowerUrl.startsWith('./') &&
        !lowerUrl.startsWith('../')) {
        return null;
    }

    return sanitized;
};

/**
 * Sanitize object by recursively sanitizing all string values.
 * 
 * @param obj - The object to sanitize
 * @returns Sanitized object
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item =>
                typeof item === 'string' ? sanitizeInput(item) : item
            );
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized as T;
};

/**
 * Validate that a string doesn't contain SQL injection patterns.
 * 
 * @param input - The input to validate
 * @returns True if safe, false if potentially dangerous
 */
export const isSafeSqlInput = (input: string): boolean => {
    // Common SQL injection patterns
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
        /(--|;|\/\*|\*\/)/,
        /(\bOR\b.*=.*)/i,
        /(\bAND\b.*=.*)/i,
        /('.*OR.*'.*=.*')/i,
    ];

    for (const pattern of sqlPatterns) {
        if (pattern.test(input)) {
            return false;
        }
    }

    return true;
};

/**
 * Validate that a string doesn't contain NoSQL injection patterns.
 * 
 * @param input - The input to validate
 * @returns True if safe, false if potentially dangerous
 */
export const isSafeNoSqlInput = (input: string): boolean => {
    // Common NoSQL injection patterns
    const noSqlPatterns = [
        /\$where/i,
        /\$ne/i,
        /\$gt/i,
        /\$lt/i,
        /\$regex/i,
        /\$or/i,
        /\$and/i,
    ];

    for (const pattern of noSqlPatterns) {
        if (pattern.test(input)) {
            return false;
        }
    }

    return true;
};

/**
 * Validate that input is safe (no XSS, SQL, or NoSQL injection).
 * 
 * @param input - The input to validate
 * @returns True if safe, false if potentially dangerous
 */
export const isSafeInput = (input: string): boolean => {
    // Check for XSS patterns
    const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /onerror=/i,
        /onload=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
    ];

    for (const pattern of xssPatterns) {
        if (pattern.test(input)) {
            return false;
        }
    }

    // Check for SQL and NoSQL injection
    return isSafeSqlInput(input) && isSafeNoSqlInput(input);
};

/**
 * Sanitize and validate form data before submission.
 * 
 * @param formData - The form data to sanitize
 * @returns Sanitized form data
 * @throws Error if dangerous input is detected
 */
export const sanitizeFormData = <T extends Record<string, any>>(formData: T): T => {
    const sanitized = sanitizeObject(formData);

    // Validate all string fields
    for (const [key, value] of Object.entries(sanitized)) {
        if (typeof value === 'string' && !isSafeInput(value)) {
            throw new Error(`Invalid input detected in field: ${key}`);
        }
    }

    return sanitized;
};

/**
 * Create a safe HTML string from user content.
 * This should be used with dangerouslySetInnerHTML only when absolutely necessary.
 * 
 * @param content - The content to make safe
 * @returns Safe HTML string
 */
export const createSafeHtml = (content: string): string => {
    // Strip all HTML tags
    const text = stripHtml(content);

    // Escape any remaining special characters
    return escapeHtml(text);
};

/**
 * Validate file upload to prevent malicious files.
 * 
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns True if valid, false otherwise
 */
export const isValidFileUpload = (
    file: File,
    allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: number = 5 * 1024 * 1024 // 5MB default
): boolean => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
        return false;
    }

    // Check file size
    if (file.size > maxSize) {
        return false;
    }

    // Check file name for dangerous patterns
    const fileName = file.name.toLowerCase();
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.html'];

    for (const ext of dangerousExtensions) {
        if (fileName.endsWith(ext)) {
            return false;
        }
    }

    return true;
};
