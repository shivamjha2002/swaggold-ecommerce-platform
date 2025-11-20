"""Custom decorators for authentication and authorization."""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity
from app.models.user import User


def jwt_required_custom(fn):
    """
    Custom JWT required decorator with enhanced error handling.
    
    This decorator verifies that a valid JWT token is present in the request
    and that the user exists and is active.
    
    Usage:
        @bp.route('/protected')
        @jwt_required_custom
        def protected_route():
            return {'message': 'Access granted'}
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            # Verify JWT token
            verify_jwt_in_request()
            
            # Get user ID from token
            user_id = get_jwt_identity()
            
            # Verify user exists and is active
            user = User.objects(id=user_id, is_active=True).first()
            if not user:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 401,
                        'message': 'User not found or inactive'
                    }
                }), 401
            
            return fn(*args, **kwargs)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': {
                    'code': 401,
                    'message': f'Authentication failed: {str(e)}'
                }
            }), 401
    
    return wrapper


def admin_required(fn):
    """
    Decorator to require admin role.
    
    This decorator must be used after @jwt_required() or @jwt_required_custom.
    It checks if the authenticated user has the 'admin' role.
    
    Usage:
        @bp.route('/admin-only')
        @jwt_required()
        @admin_required
        def admin_route():
            return {'message': 'Admin access granted'}
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            # Get JWT claims
            jwt_data = get_jwt()
            user_role = jwt_data.get('role')
            
            # Check if user is admin
            if user_role != 'admin':
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 403,
                        'message': 'Admin access required'
                    }
                }), 403
            
            return fn(*args, **kwargs)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': {
                    'code': 403,
                    'message': f'Authorization failed: {str(e)}'
                }
            }), 403
    
    return wrapper


def role_required(*allowed_roles):
    """
    Decorator to require specific role(s).
    
    This decorator must be used after @jwt_required() or @jwt_required_custom.
    It checks if the authenticated user has one of the allowed roles.
    
    Args:
        *allowed_roles: Variable number of role strings (e.g., 'admin', 'staff')
    
    Usage:
        @bp.route('/staff-or-admin')
        @jwt_required()
        @role_required('admin', 'staff')
        def staff_route():
            return {'message': 'Access granted'}
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                # Get JWT claims
                jwt_data = get_jwt()
                user_role = jwt_data.get('role')
                
                # Check if user has one of the allowed roles
                if user_role not in allowed_roles:
                    return jsonify({
                        'success': False,
                        'error': {
                            'code': 403,
                            'message': f'Access denied. Required roles: {", ".join(allowed_roles)}'
                        }
                    }), 403
                
                return fn(*args, **kwargs)
                
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 403,
                        'message': f'Authorization failed: {str(e)}'
                    }
                }), 403
        
        return wrapper
    return decorator


# Alias for jwt_required_custom to match task requirements
auth_required = jwt_required_custom


def get_current_user():
    """
    Helper function to get the current authenticated user.
    
    This function should be called within a route that has @jwt_required() applied.
    
    Returns:
        User: The current authenticated user object, or None if not found
    
    Usage:
        @bp.route('/profile')
        @jwt_required()
        def get_profile():
            user = get_current_user()
            if user:
                return {'user': user.to_dict()}
            return {'error': 'User not found'}, 404
    """
    try:
        user_id = get_jwt_identity()
        return User.objects(id=user_id, is_active=True).first()
    except Exception:
        return None
