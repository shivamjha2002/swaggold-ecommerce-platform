"""Rate limiting configuration and utilities."""
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask import request
import logging

logger = logging.getLogger(__name__)


def get_rate_limit_key():
    """
    Get rate limit key based on user identity or IP address.
    
    For authenticated requests, use user ID.
    For unauthenticated requests, use IP address.
    
    Returns:
        str: Rate limit key
    """
    try:
        from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
        
        # Try to get user ID from JWT
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            if user_id:
                return f'user:{user_id}'
        except Exception:
            pass
    except ImportError:
        pass
    
    # Fall back to IP address
    return f'ip:{get_remote_address()}'


# Initialize rate limiter
limiter = Limiter(
    key_func=get_rate_limit_key,
    default_limits=["1000 per hour", "100 per minute"],
    storage_uri="memory://",  # Use Redis in production: "redis://localhost:6379"
    strategy="fixed-window"
)


def init_limiter(app):
    """
    Initialize rate limiter with Flask app.
    
    Args:
        app: Flask application instance
    """
    limiter.init_app(app)
    logger.info('Rate limiter initialized')
    
    # Add rate limit exceeded handler
    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        """Handle rate limit exceeded errors."""
        logger.warning(
            f'Rate limit exceeded: {request.endpoint} from {get_remote_address()}'
        )
        return {
            'success': False,
            'error': {
                'code': 429,
                'message': 'Rate limit exceeded',
                'details': 'Too many requests. Please try again later.'
            }
        }, 429


# Rate limit configurations for different endpoint types
RATE_LIMITS = {
    # Webhook endpoints - strict limits to prevent abuse
    'webhook': '100 per minute',
    
    # Price feed endpoints - moderate limits
    'price_feed': '60 per minute',
    'price_feed_admin': '30 per minute',
    
    # Authentication endpoints - prevent brute force
    'auth_login': '10 per minute',
    'auth_signup': '5 per minute',
    'auth_password_reset': '3 per minute',
    
    # Cart operations - generous limits for good UX
    'cart': '100 per minute',
    
    # Checkout operations - moderate limits
    'checkout': '20 per minute',
    
    # Payment operations - strict limits
    'payment_verify': '10 per minute',
    'payment_retry': '5 per minute',
    
    # Admin operations - moderate limits
    'admin': '60 per minute',
    
    # Public API - generous limits
    'public': '200 per minute'
}


def get_rate_limit(endpoint_type: str) -> str:
    """
    Get rate limit configuration for endpoint type.
    
    Args:
        endpoint_type: Type of endpoint (e.g., 'webhook', 'auth_login')
        
    Returns:
        str: Rate limit string (e.g., '100 per minute')
    """
    return RATE_LIMITS.get(endpoint_type, '100 per minute')
