"""Security middleware for request validation and protection."""
from functools import wraps
from flask import request, jsonify
from app.utils.input_sanitizer import (
    sanitize_dict,
    validate_input_length,
    MAX_STRING_LENGTH,
    MAX_TEXT_LENGTH
)
import logging

logger = logging.getLogger(__name__)


# Field-specific length limits
FIELD_LENGTH_LIMITS = {
    'username': 80,
    'email': 254,
    'password': 128,
    'name': 200,
    'full_name': 200,
    'phone': 15,
    'address': 500,
    'address_line1': 200,
    'address_line2': 200,
    'city': 100,
    'state': 100,
    'pincode': 10,
    'description': 5000,
    'message': 5000,
    'title': 200,
    'category': 100,
    'search': 200,
    'query': 200,
}


def sanitize_request_data(f):
    """
    Decorator to automatically sanitize request data.
    
    Sanitizes JSON body, form data, and query parameters.
    
    Usage:
        @bp.route('/api/products', methods=['POST'])
        @sanitize_request_data
        def create_product():
            data = request.get_json()  # Already sanitized
            # ... route logic
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Sanitize JSON body
            if request.is_json:
                data = request.get_json(silent=True)
                if data:
                    sanitized_data = sanitize_dict(data, FIELD_LENGTH_LIMITS)
                    # Replace request data with sanitized version
                    request._cached_json = (sanitized_data, sanitized_data)
            
            # Note: Query parameters and form data are typically handled
            # by individual validators, but could be sanitized here too
            
        except Exception as e:
            logger.error(f'Error sanitizing request data: {str(e)}')
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid request data',
                    'details': 'Request data could not be processed'
                }
            }), 400
        
        return f(*args, **kwargs)
    
    return decorated_function


def validate_content_type(allowed_types=None):
    """
    Decorator to validate request Content-Type header.
    
    Args:
        allowed_types: List of allowed content types (default: ['application/json'])
    
    Usage:
        @bp.route('/api/products', methods=['POST'])
        @validate_content_type(['application/json'])
        def create_product():
            # ... route logic
    """
    if allowed_types is None:
        allowed_types = ['application/json']
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Skip validation for GET, HEAD, OPTIONS requests
            if request.method in ['GET', 'HEAD', 'OPTIONS']:
                return f(*args, **kwargs)
            
            content_type = request.content_type
            if not content_type:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Content-Type header is required'
                    }
                }), 400
            
            # Check if content type matches allowed types
            is_allowed = any(
                allowed_type in content_type.lower()
                for allowed_type in allowed_types
            )
            
            if not is_allowed:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 415,
                        'message': 'Unsupported Media Type',
                        'details': f'Content-Type must be one of: {", ".join(allowed_types)}'
                    }
                }), 415
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def validate_request_size(max_size_mb=10):
    """
    Decorator to validate request body size.
    
    Args:
        max_size_mb: Maximum allowed size in megabytes
    
    Usage:
        @bp.route('/api/upload', methods=['POST'])
        @validate_request_size(max_size_mb=5)
        def upload_file():
            # ... route logic
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            content_length = request.content_length
            
            if content_length and content_length > max_size_bytes:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 413,
                        'message': 'Request Entity Too Large',
                        'details': f'Request body must not exceed {max_size_mb} MB'
                    }
                }), 413
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def require_https(f):
    """
    Decorator to require HTTPS for sensitive endpoints.
    
    Only enforced in production (when not in debug mode).
    
    Usage:
        @bp.route('/api/auth/login', methods=['POST'])
        @require_https
        def login():
            # ... route logic
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import current_app
        
        # Only enforce in production
        if not current_app.debug and not request.is_secure:
            return jsonify({
                'success': False,
                'error': {
                    'code': 403,
                    'message': 'HTTPS Required',
                    'details': 'This endpoint requires a secure connection'
                }
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function


def add_security_headers(response):
    """
    Add security headers to response.
    
    This should be registered as an after_request handler.
    
    Usage:
        app.after_request(add_security_headers)
    """
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'
    
    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    
    # Enable XSS protection
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Referrer policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Content Security Policy (adjust as needed)
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self'"
    )
    
    # Strict Transport Security (HSTS) - only in production with HTTPS
    if request.is_secure:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    return response


def log_security_event(event_type: str, details: dict):
    """
    Log security-related events for monitoring and auditing.
    
    Args:
        event_type: Type of security event (e.g., 'failed_login', 'rate_limit_exceeded')
        details: Additional details about the event
    """
    from flask import request
    from flask_limiter.util import get_remote_address
    
    log_data = {
        'event_type': event_type,
        'ip_address': get_remote_address(),
        'endpoint': request.endpoint,
        'method': request.method,
        'user_agent': request.headers.get('User-Agent', 'Unknown'),
        **details
    }
    
    logger.warning(f'Security Event: {event_type}', extra=log_data)


def validate_json_payload(required_fields=None, optional_fields=None):
    """
    Decorator to validate JSON payload structure.
    
    Args:
        required_fields: List of required field names
        optional_fields: List of optional field names
    
    Usage:
        @bp.route('/api/products', methods=['POST'])
        @validate_json_payload(required_fields=['name', 'price'])
        def create_product():
            # ... route logic
    """
    required_fields = required_fields or []
    optional_fields = optional_fields or []
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Request must be JSON'
                    }
                }), 400
            
            data = request.get_json(silent=True)
            if data is None:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid JSON payload'
                    }
                }), 400
            
            # Check required fields
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Missing required fields',
                        'details': f'Required fields: {", ".join(missing_fields)}'
                    }
                }), 400
            
            # Check for unexpected fields (if optional_fields is specified)
            if optional_fields:
                allowed_fields = set(required_fields + optional_fields)
                unexpected_fields = [field for field in data.keys() if field not in allowed_fields]
                if unexpected_fields:
                    logger.warning(f'Unexpected fields in request: {unexpected_fields}')
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def prevent_parameter_pollution(f):
    """
    Decorator to prevent HTTP parameter pollution attacks.
    
    Ensures that query parameters don't contain duplicate keys.
    
    Usage:
        @bp.route('/api/products', methods=['GET'])
        @prevent_parameter_pollution
        def get_products():
            # ... route logic
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for duplicate query parameters
        query_string = request.query_string.decode('utf-8')
        if query_string:
            params = query_string.split('&')
            param_names = [p.split('=')[0] for p in params if '=' in p]
            
            if len(param_names) != len(set(param_names)):
                logger.warning(f'Parameter pollution detected: {query_string}')
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid request parameters',
                        'details': 'Duplicate parameters are not allowed'
                    }
                }), 400
        
        return f(*args, **kwargs)
    
    return decorated_function
