"""Secure error handling utilities."""
import logging
from flask import jsonify, current_app
from werkzeug.exceptions import HTTPException
from mongoengine.errors import ValidationError, DoesNotExist, NotUniqueError
from flask_jwt_extended.exceptions import JWTExtendedException

logger = logging.getLogger(__name__)


def get_safe_error_message(error: Exception, default_message: str = "An error occurred") -> str:
    """
    Get a safe, user-friendly error message without exposing system details.
    
    Args:
        error: The exception that occurred
        default_message: Default message to return if no specific message is available
        
    Returns:
        Safe error message string
    """
    # In production, never expose internal error details
    if not current_app.debug:
        # Map common errors to user-friendly messages
        if isinstance(error, ValidationError):
            return "Invalid data provided"
        elif isinstance(error, DoesNotExist):
            return "Resource not found"
        elif isinstance(error, NotUniqueError):
            return "This value already exists"
        elif isinstance(error, JWTExtendedException):
            return "Authentication failed"
        else:
            return default_message
    
    # In development, provide more details
    return str(error)


def handle_validation_error(error: ValidationError):
    """
    Handle MongoDB validation errors.
    
    Args:
        error: ValidationError exception
        
    Returns:
        JSON response tuple
    """
    logger.error(f'Validation error: {str(error)}')
    
    # Extract field-specific errors if available
    error_details = {}
    if hasattr(error, 'errors'):
        for field, message in error.errors.items():
            error_details[field] = str(message)
    
    return jsonify({
        'success': False,
        'error': {
            'code': 400,
            'message': 'Validation error',
            'details': error_details if error_details else get_safe_error_message(error)
        }
    }), 400


def handle_not_found_error(error: DoesNotExist):
    """
    Handle MongoDB DoesNotExist errors.
    
    Args:
        error: DoesNotExist exception
        
    Returns:
        JSON response tuple
    """
    logger.warning(f'Resource not found: {str(error)}')
    
    return jsonify({
        'success': False,
        'error': {
            'code': 404,
            'message': 'Resource not found',
            'details': 'The requested resource does not exist'
        }
    }), 404


def handle_duplicate_error(error: NotUniqueError):
    """
    Handle MongoDB NotUniqueError (duplicate key).
    
    Args:
        error: NotUniqueError exception
        
    Returns:
        JSON response tuple
    """
    logger.warning(f'Duplicate key error: {str(error)}')
    
    # Try to extract field name from error message
    error_msg = str(error)
    field_name = 'value'
    
    if 'username' in error_msg.lower():
        field_name = 'username'
    elif 'email' in error_msg.lower():
        field_name = 'email'
    
    return jsonify({
        'success': False,
        'error': {
            'code': 409,
            'message': 'Duplicate value',
            'details': f'A record with this {field_name} already exists'
        }
    }), 409


def handle_jwt_error(error: JWTExtendedException):
    """
    Handle JWT authentication errors.
    
    Args:
        error: JWTExtendedException
        
    Returns:
        JSON response tuple
    """
    logger.warning(f'JWT error: {type(error).__name__}')
    
    error_messages = {
        'NoAuthorizationError': 'Authentication required',
        'InvalidHeaderError': 'Invalid authentication header',
        'JWTDecodeError': 'Invalid authentication token',
        'ExpiredSignatureError': 'Authentication token has expired',
        'RevokedTokenError': 'Authentication token has been revoked',
        'FreshTokenRequired': 'Fresh authentication token required',
        'UserLookupError': 'User not found',
        'UserClaimsVerificationError': 'Invalid user claims',
    }
    
    error_type = type(error).__name__
    message = error_messages.get(error_type, 'Authentication failed')
    
    return jsonify({
        'success': False,
        'error': {
            'code': 401,
            'message': message,
            'details': 'Please login again to continue'
        }
    }), 401


def handle_http_exception(error: HTTPException):
    """
    Handle HTTP exceptions.
    
    Args:
        error: HTTPException
        
    Returns:
        JSON response tuple
    """
    logger.warning(f'HTTP exception: {error.code} - {error.name}')
    
    # Map HTTP status codes to user-friendly messages
    messages = {
        400: 'Bad request',
        401: 'Authentication required',
        403: 'Access denied',
        404: 'Resource not found',
        405: 'Method not allowed',
        409: 'Conflict',
        413: 'Request too large',
        415: 'Unsupported media type',
        429: 'Too many requests',
        500: 'Internal server error',
        502: 'Bad gateway',
        503: 'Service unavailable',
    }
    
    message = messages.get(error.code, error.name)
    
    return jsonify({
        'success': False,
        'error': {
            'code': error.code,
            'message': message,
            'details': error.description if current_app.debug else None
        }
    }), error.code


def handle_generic_error(error: Exception):
    """
    Handle generic exceptions.
    
    Args:
        error: Exception
        
    Returns:
        JSON response tuple
    """
    # Log full error details for debugging
    logger.error(f'Unhandled exception: {type(error).__name__}', exc_info=True)
    
    # Never expose internal error details in production
    if current_app.debug:
        details = str(error)
    else:
        details = 'An unexpected error occurred. Please try again later.'
    
    return jsonify({
        'success': False,
        'error': {
            'code': 500,
            'message': 'Internal server error',
            'details': details
        }
    }), 500


def register_error_handlers(app):
    """
    Register error handlers with Flask app.
    
    Args:
        app: Flask application instance
    """
    # MongoDB errors
    app.register_error_handler(ValidationError, handle_validation_error)
    app.register_error_handler(DoesNotExist, handle_not_found_error)
    app.register_error_handler(NotUniqueError, handle_duplicate_error)
    
    # JWT errors
    app.register_error_handler(JWTExtendedException, handle_jwt_error)
    
    # HTTP exceptions
    app.register_error_handler(HTTPException, handle_http_exception)
    
    # Generic exceptions (catch-all)
    app.register_error_handler(Exception, handle_generic_error)
    
    logger.info('Error handlers registered')


class APIError(Exception):
    """Custom API error class for controlled error responses."""
    
    def __init__(self, message: str, code: int = 400, details: str = None):
        """
        Initialize API error.
        
        Args:
            message: Error message
            code: HTTP status code
            details: Additional error details
        """
        self.message = message
        self.code = code
        self.details = details
        super().__init__(self.message)
    
    def to_dict(self):
        """Convert error to dictionary for JSON response."""
        error_dict = {
            'code': self.code,
            'message': self.message
        }
        if self.details:
            error_dict['details'] = self.details
        return error_dict


def handle_api_error(error: APIError):
    """
    Handle custom API errors.
    
    Args:
        error: APIError exception
        
    Returns:
        JSON response tuple
    """
    logger.warning(f'API error: {error.code} - {error.message}')
    
    return jsonify({
        'success': False,
        'error': error.to_dict()
    }), error.code
