"""Security utilities and middleware."""
from functools import wraps
from flask import request, jsonify
import logging

logger = logging.getLogger(__name__)


def add_security_headers(response):
    """
    Add security headers to response.
    
    Args:
        response: Flask response object
        
    Returns:
        Response with security headers added
    """
    import os
    from flask import request
    
    # Prevent clickjacking attacks
    response.headers['X-Frame-Options'] = 'DENY'
    
    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    
    # Enable XSS protection
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Content Security Policy
    # Restrict resources to same origin, allow inline styles for development
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' https://api.razorpay.com https://api.gemini.com; "
        "frame-src https://api.razorpay.com; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "form-action 'self';"
    )
    
    # Referrer policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Permissions policy (formerly Feature-Policy)
    response.headers['Permissions-Policy'] = (
        "geolocation=(), "
        "microphone=(), "
        "camera=(), "
        "payment=(self)"
    )
    
    # Strict Transport Security (HSTS) - only in production with HTTPS
    env = os.environ.get('FLASK_ENV', 'production')
    if env == 'production' and request.is_secure:
        # Enable HSTS for 1 year, include subdomains, allow preloading
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    
    return response


def validate_razorpay_keys():
    """
    Validate that Razorpay keys are properly configured.
    
    Returns:
        Tuple[bool, str]: (is_valid, error_message)
    """
    import os
    
    key_id = os.environ.get('RAZORPAY_KEY_ID')
    key_secret = os.environ.get('RAZORPAY_KEY_SECRET')
    webhook_secret = os.environ.get('RAZORPAY_WEBHOOK_SECRET')
    
    errors = []
    
    if not key_id:
        errors.append('RAZORPAY_KEY_ID not configured')
    elif not key_id.startswith('rzp_'):
        errors.append('RAZORPAY_KEY_ID has invalid format (should start with rzp_)')
    
    if not key_secret:
        errors.append('RAZORPAY_KEY_SECRET not configured')
    
    if not webhook_secret:
        errors.append('RAZORPAY_WEBHOOK_SECRET not configured')
    
    if errors:
        return False, '; '.join(errors)
    
    # Verify keys are not exposed in client code
    # This is a reminder check - actual enforcement is in code structure
    logger.info('Razorpay keys validated successfully')
    
    return True, ''


def ensure_https(f):
    """
    Decorator to ensure HTTPS is used for sensitive endpoints.
    
    In production, this should enforce HTTPS. In development, it logs a warning.
    
    Usage:
        @bp.route('/checkout/create-order', methods=['POST'])
        @ensure_https
        def create_order():
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if request is secure (HTTPS)
        if not request.is_secure:
            # In production, reject non-HTTPS requests
            import os
            env = os.environ.get('FLASK_ENV', 'production')
            
            if env == 'production':
                logger.error(
                    f'Insecure request to sensitive endpoint: {request.endpoint} '
                    f'from {request.remote_addr}'
                )
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 403,
                        'message': 'HTTPS required',
                        'details': 'This endpoint requires a secure HTTPS connection'
                    }
                }), 403
            else:
                # In development, just log a warning
                logger.warning(
                    f'Insecure request to sensitive endpoint: {request.endpoint}. '
                    f'HTTPS should be used in production.'
                )
        
        return f(*args, **kwargs)
    
    return decorated_function


def log_security_event(event_type: str, details: dict):
    """
    Log security-related events for audit trail.
    
    Args:
        event_type: Type of security event (e.g., 'payment_attempt', 'signature_verification_failed')
        details: Dictionary with event details
    """
    logger.info(
        f'SECURITY_EVENT: {event_type} | '
        f'IP: {request.remote_addr if request else "N/A"} | '
        f'Details: {details}'
    )


def validate_content_type(required_type='application/json'):
    """
    Decorator to validate request content type.
    
    Args:
        required_type: Required content type (default: application/json)
    
    Usage:
        @bp.route('/api/endpoint', methods=['POST'])
        @validate_content_type('application/json')
        def endpoint():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            content_type = request.content_type
            
            if not content_type or required_type not in content_type:
                logger.warning(
                    f'Invalid content type for {request.endpoint}: '
                    f'expected {required_type}, got {content_type}'
                )
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 415,
                        'message': 'Unsupported Media Type',
                        'details': f'Content-Type must be {required_type}'
                    }
                }), 415
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator
