"""CSRF protection utilities."""
import secrets
import hashlib
import time
from functools import wraps
from flask import request, jsonify, session
from typing import Optional


# CSRF token expiration time (in seconds)
CSRF_TOKEN_EXPIRY = 3600  # 1 hour


def generate_csrf_token() -> str:
    """
    Generate a secure CSRF token.
    
    Returns:
        CSRF token string
    """
    # Generate a random token
    token = secrets.token_urlsafe(32)
    
    # Store in session with timestamp
    session['csrf_token'] = token
    session['csrf_token_time'] = time.time()
    
    return token


def get_csrf_token() -> Optional[str]:
    """
    Get the current CSRF token from session.
    
    Returns:
        CSRF token string or None if not found
    """
    return session.get('csrf_token')


def validate_csrf_token(token: str) -> bool:
    """
    Validate a CSRF token.
    
    Args:
        token: Token to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not token:
        return False
    
    # Get stored token from session
    stored_token = session.get('csrf_token')
    token_time = session.get('csrf_token_time')
    
    if not stored_token or not token_time:
        return False
    
    # Check if token has expired
    if time.time() - token_time > CSRF_TOKEN_EXPIRY:
        # Clear expired token
        session.pop('csrf_token', None)
        session.pop('csrf_token_time', None)
        return False
    
    # Compare tokens using constant-time comparison
    return secrets.compare_digest(token, stored_token)


def csrf_protect(f):
    """
    Decorator to protect routes with CSRF token validation.
    
    Usage:
        @bp.route('/api/products', methods=['POST'])
        @csrf_protect
        def create_product():
            # ... route logic
    
    The CSRF token should be sent in one of these ways:
    1. X-CSRF-Token header
    2. csrf_token field in JSON body
    3. csrf_token field in form data
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip CSRF check for GET, HEAD, OPTIONS requests (safe methods)
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return f(*args, **kwargs)
        
        # Get token from request
        token = None
        
        # Check header first
        token = request.headers.get('X-CSRF-Token')
        
        # Check JSON body
        if not token and request.is_json:
            data = request.get_json(silent=True)
            if data:
                token = data.get('csrf_token')
        
        # Check form data
        if not token:
            token = request.form.get('csrf_token')
        
        # Validate token
        if not validate_csrf_token(token):
            return jsonify({
                'success': False,
                'error': {
                    'code': 403,
                    'message': 'CSRF token validation failed',
                    'details': 'Invalid or missing CSRF token'
                }
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function


def csrf_exempt(f):
    """
    Decorator to exempt a route from CSRF protection.
    
    Use sparingly and only for routes that don't perform state-changing operations
    or have alternative protection mechanisms (e.g., API key authentication).
    
    Usage:
        @bp.route('/api/webhook', methods=['POST'])
        @csrf_exempt
        def webhook_handler():
            # ... route logic
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    
    # Mark function as CSRF exempt
    decorated_function.csrf_exempt = True
    return decorated_function


def get_csrf_token_for_response() -> dict:
    """
    Get CSRF token for including in API response.
    
    Returns:
        Dictionary with CSRF token
    """
    token = get_csrf_token()
    if not token:
        token = generate_csrf_token()
    
    return {
        'csrf_token': token
    }


# Alternative: Double Submit Cookie pattern
def generate_csrf_cookie_token() -> str:
    """
    Generate a CSRF token for double submit cookie pattern.
    
    This is an alternative to session-based CSRF protection.
    The token is sent both as a cookie and must be included in the request.
    
    Returns:
        CSRF token string
    """
    return secrets.token_urlsafe(32)


def validate_csrf_cookie_token(token: str, cookie_token: str) -> bool:
    """
    Validate CSRF token using double submit cookie pattern.
    
    Args:
        token: Token from request header/body
        cookie_token: Token from cookie
        
    Returns:
        True if valid, False otherwise
    """
    if not token or not cookie_token:
        return False
    
    # Use constant-time comparison
    return secrets.compare_digest(token, cookie_token)
