"""Input sanitization utilities for XSS protection."""
import bleach
import re
from typing import Any, Dict, List, Optional
from html import escape


# Allowed HTML tags for rich text fields (empty by default for maximum security)
ALLOWED_TAGS = []
ALLOWED_ATTRIBUTES = {}

# Maximum input lengths to prevent buffer overflow
MAX_STRING_LENGTH = 10000
MAX_TEXT_LENGTH = 50000
MAX_URL_LENGTH = 2048
MAX_EMAIL_LENGTH = 254
MAX_USERNAME_LENGTH = 80
MAX_NAME_LENGTH = 200


def sanitize_html(value: str, allowed_tags: List[str] = None, allowed_attributes: Dict = None) -> str:
    """
    Sanitize HTML content to prevent XSS attacks.
    
    Args:
        value: HTML string to sanitize
        allowed_tags: List of allowed HTML tags (default: none)
        allowed_attributes: Dict of allowed attributes per tag (default: none)
        
    Returns:
        Sanitized HTML string
    """
    if not isinstance(value, str):
        return value
    
    tags = allowed_tags if allowed_tags is not None else ALLOWED_TAGS
    attrs = allowed_attributes if allowed_attributes is not None else ALLOWED_ATTRIBUTES
    
    # Use bleach to clean HTML
    cleaned = bleach.clean(
        value,
        tags=tags,
        attributes=attrs,
        strip=True,  # Strip disallowed tags instead of escaping
        strip_comments=True  # Remove HTML comments
    )
    
    return cleaned.strip()


def sanitize_string(value: str, max_length: int = MAX_STRING_LENGTH) -> str:
    """
    Sanitize a plain text string by removing all HTML and limiting length.
    
    Args:
        value: String to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized string
        
    Raises:
        ValueError: If string exceeds max_length after sanitization
    """
    if not isinstance(value, str):
        return value
    
    # Remove all HTML tags
    sanitized = bleach.clean(value, tags=[], strip=True).strip()
    
    # Check length
    if len(sanitized) > max_length:
        raise ValueError(f"Input exceeds maximum length of {max_length} characters")
    
    return sanitized


def sanitize_dict(data: Dict[str, Any], field_limits: Dict[str, int] = None) -> Dict[str, Any]:
    """
    Recursively sanitize all string values in a dictionary.
    
    Args:
        data: Dictionary to sanitize
        field_limits: Optional dict mapping field names to max lengths
        
    Returns:
        Sanitized dictionary
    """
    if not isinstance(data, dict):
        return data
    
    field_limits = field_limits or {}
    sanitized = {}
    
    for key, value in data.items():
        max_length = field_limits.get(key, MAX_STRING_LENGTH)
        
        if isinstance(value, dict):
            sanitized[key] = sanitize_dict(value, field_limits)
        elif isinstance(value, list):
            sanitized[key] = sanitize_list(value, max_length)
        elif isinstance(value, str):
            try:
                sanitized[key] = sanitize_string(value, max_length)
            except ValueError:
                # If string is too long, truncate it
                sanitized[key] = sanitize_string(value[:max_length], max_length)
        else:
            sanitized[key] = value
    
    return sanitized


def sanitize_list(data: List[Any], max_length: int = MAX_STRING_LENGTH) -> List[Any]:
    """
    Recursively sanitize all string values in a list.
    
    Args:
        data: List to sanitize
        max_length: Maximum length for string items
        
    Returns:
        Sanitized list
    """
    if not isinstance(data, list):
        return data
    
    sanitized = []
    for item in data:
        if isinstance(item, dict):
            sanitized.append(sanitize_dict(item))
        elif isinstance(item, list):
            sanitized.append(sanitize_list(item, max_length))
        elif isinstance(item, str):
            try:
                sanitized.append(sanitize_string(item, max_length))
            except ValueError:
                sanitized.append(sanitize_string(item[:max_length], max_length))
        else:
            sanitized.append(item)
    
    return sanitized


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal attacks.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    if not filename:
        return ""
    
    # Remove path separators and parent directory references
    filename = filename.replace('/', '').replace('\\', '').replace('..', '')
    
    # Remove any non-alphanumeric characters except dots, dashes, and underscores
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:250] + ('.' + ext if ext else '')
    
    return filename


def sanitize_url(url: str) -> str:
    """
    Sanitize URL to prevent injection attacks.
    
    Args:
        url: URL string
        
    Returns:
        Sanitized URL
        
    Raises:
        ValueError: If URL is invalid or too long
    """
    if not url:
        return ""
    
    url = url.strip()
    
    # Check length
    if len(url) > MAX_URL_LENGTH:
        raise ValueError(f"URL exceeds maximum length of {MAX_URL_LENGTH} characters")
    
    # Only allow http and https protocols
    if not url.startswith(('http://', 'https://')):
        raise ValueError("URL must start with http:// or https://")
    
    # Check for javascript: protocol and other dangerous patterns
    dangerous_patterns = [
        'javascript:',
        'data:',
        'vbscript:',
        'file:',
        'about:',
        '<script',
        'onerror=',
        'onclick=',
    ]
    
    url_lower = url.lower()
    for pattern in dangerous_patterns:
        if pattern in url_lower:
            raise ValueError("URL contains potentially dangerous content")
    
    return url


def escape_html(value: str) -> str:
    """
    Escape HTML special characters.
    
    Args:
        value: String to escape
        
    Returns:
        HTML-escaped string
    """
    if not isinstance(value, str):
        return value
    
    return escape(value)


def validate_no_sql_injection(value: str) -> bool:
    """
    Check for potential NoSQL injection patterns.
    
    Args:
        value: String to check
        
    Returns:
        True if safe, False if suspicious patterns detected
    """
    if not isinstance(value, str):
        return True
    
    # Check for MongoDB operators and suspicious patterns
    dangerous_patterns = [
        r'\$where',
        r'\$ne',
        r'\$gt',
        r'\$lt',
        r'\$regex',
        r'\$or',
        r'\$and',
        r'\$nin',
        r'\$in',
        r'function\s*\(',
        r'=>',
    ]
    
    value_lower = value.lower()
    for pattern in dangerous_patterns:
        if re.search(pattern, value_lower):
            return False
    
    return True


def sanitize_search_query(query: str, max_length: int = 200) -> str:
    """
    Sanitize search query input.
    
    Args:
        query: Search query string
        max_length: Maximum allowed length
        
    Returns:
        Sanitized query string
        
    Raises:
        ValueError: If query contains dangerous patterns
    """
    if not query:
        return ""
    
    # Remove HTML
    query = sanitize_string(query, max_length)
    
    # Check for NoSQL injection
    if not validate_no_sql_injection(query):
        raise ValueError("Search query contains invalid characters")
    
    return query


def validate_input_length(value: Any, field_name: str, max_length: int) -> None:
    """
    Validate that input doesn't exceed maximum length.
    
    Args:
        value: Value to check
        field_name: Name of the field (for error messages)
        max_length: Maximum allowed length
        
    Raises:
        ValueError: If value exceeds max_length
    """
    if value is None:
        return
    
    if isinstance(value, str):
        if len(value) > max_length:
            raise ValueError(f"{field_name} exceeds maximum length of {max_length} characters")
    elif isinstance(value, (list, dict)):
        # For collections, check serialized length
        import json
        serialized = json.dumps(value)
        if len(serialized) > max_length:
            raise ValueError(f"{field_name} data exceeds maximum size")


def sanitize_email(email: str) -> str:
    """
    Sanitize and normalize email address.
    
    Args:
        email: Email address
        
    Returns:
        Sanitized email address
        
    Raises:
        ValueError: If email is invalid
    """
    if not email:
        return ""
    
    email = email.strip().lower()
    
    # Check length
    if len(email) > MAX_EMAIL_LENGTH:
        raise ValueError(f"Email exceeds maximum length of {MAX_EMAIL_LENGTH} characters")
    
    # Basic format validation
    if '@' not in email or '.' not in email.split('@')[-1]:
        raise ValueError("Invalid email format")
    
    # Remove HTML
    email = bleach.clean(email, tags=[], strip=True)
    
    # Check for dangerous characters
    if re.search(r'[<>"\']', email):
        raise ValueError("Email contains invalid characters")
    
    return email


def sanitize_username(username: str) -> str:
    """
    Sanitize username input.
    
    Args:
        username: Username string
        
    Returns:
        Sanitized username
        
    Raises:
        ValueError: If username is invalid
    """
    if not username:
        return ""
    
    username = username.strip()
    
    # Check length
    if len(username) > MAX_USERNAME_LENGTH:
        raise ValueError(f"Username exceeds maximum length of {MAX_USERNAME_LENGTH} characters")
    
    # Only allow alphanumeric and underscore
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        raise ValueError("Username can only contain letters, numbers, and underscores")
    
    return username


def sanitize_phone(phone: str) -> str:
    """
    Sanitize phone number input.
    
    Args:
        phone: Phone number string
        
    Returns:
        Sanitized phone number (digits only)
        
    Raises:
        ValueError: If phone number is invalid
    """
    if not phone:
        return ""
    
    # Remove common separators
    phone = re.sub(r'[\s\-\(\)\+]', '', phone.strip())
    
    # Only allow digits
    if not phone.isdigit():
        raise ValueError("Phone number must contain only digits")
    
    # Check length (10-15 digits for international numbers)
    if len(phone) < 10 or len(phone) > 15:
        raise ValueError("Phone number must be between 10 and 15 digits")
    
    return phone
