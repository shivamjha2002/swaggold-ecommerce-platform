"""Authentication API routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from mongoengine import NotUniqueError
from datetime import datetime

from app.models.user import User

bp = Blueprint('auth', __name__)


@bp.route('/login', methods=['POST'])
def login():
    """
    User login endpoint.
    
    Request body:
        {
            "username": "admin",  # Can be username or email
            "password": "password123"
        }
    
    Returns:
        {
            "success": true,
            "data": {
                "access_token": "jwt_token_here",
                "user": {
                    "id": "user_id",
                    "username": "admin",
                    "email": "admin@example.com",
                    "role": "admin"
                }
            }
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required'
                }
            }), 400
        
        username = data.get('username')
        password = data.get('password')
        
        # Validate required fields
        if not username or not password:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Username and password are required'
                }
            }), 400
        
        # Authenticate user
        user = User.authenticate(username, password)
        
        if not user:
            return jsonify({
                'success': False,
                'error': {
                    'code': 401,
                    'message': 'Invalid username or password'
                }
            }), 401
        
        # Create JWT token with user identity and role
        additional_claims = {
            'role': user.role,
            'username': user.username
        }
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims
        )
        
        return jsonify({
            'success': True,
            'data': {
                'access_token': access_token,
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'last_login': user.last_login.isoformat() if user.last_login else None
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': f'Login failed: {str(e)}'
            }
        }), 500


@bp.route('/register', methods=['POST'])
@jwt_required()
def register():
    """
    User registration endpoint (admin only).
    
    Request body:
        {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "password123",
            "role": "staff"  # Optional, defaults to "staff"
        }
    
    Returns:
        {
            "success": true,
            "data": {
                "id": "user_id",
                "username": "newuser",
                "email": "newuser@example.com",
                "role": "staff"
            }
        }
    """
    try:
        # Get current user from JWT
        from flask_jwt_extended import get_jwt
        jwt_data = get_jwt()
        current_user_role = jwt_data.get('role')
        
        # Check if current user is admin
        if current_user_role != 'admin':
            return jsonify({
                'success': False,
                'error': {
                    'code': 403,
                    'message': 'Admin access required'
                }
            }), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required'
                }
            }), 400
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'staff')
        
        # Validate required fields
        if not username or not email or not password:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Username, email, and password are required'
                }
            }), 400
        
        # Validate role
        if role not in ['admin', 'staff']:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Role must be either "admin" or "staff"'
                }
            }), 400
        
        # Validate email format
        if '@' not in email or '.' not in email:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid email format'
                }
            }), 400
        
        # Validate password strength (minimum 6 characters)
        if len(password) < 6:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Password must be at least 6 characters long'
                }
            }), 400
        
        # Create new user
        user = User(
            username=username,
            email=email,
            role=role,
            created_at=datetime.utcnow()
        )
        user.set_password(password)
        
        try:
            user.save()
        except NotUniqueError:
            return jsonify({
                'success': False,
                'error': {
                    'code': 409,
                    'message': 'Username or email already exists'
                }
            }), 409
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'created_at': user.created_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': f'Registration failed: {str(e)}'
            }
        }), 500


@bp.route('/signup', methods=['POST'])
def signup():
    """
    Public user signup endpoint.
    
    Request body:
        {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "password123"
        }
    
    Returns:
        {
            "success": true,
            "data": {
                "id": "user_id",
                "username": "newuser",
                "email": "newuser@example.com",
                "role": "staff"
            }
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required'
                }
            }), 400
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        # Validate required fields
        if not username or not email or not password:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Username, email, and password are required'
                }
            }), 400
        
        # Validate username (alphanumeric and underscore only, 3-80 characters)
        if len(username) < 3 or len(username) > 80:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Username must be between 3 and 80 characters'
                }
            }), 400
        
        if not username.replace('_', '').isalnum():
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Username can only contain letters, numbers, and underscores'
                }
            }), 400
        
        # Validate email format
        if '@' not in email or '.' not in email.split('@')[-1]:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid email format'
                }
            }), 400
        
        if len(email) > 200:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Email must be less than 200 characters'
                }
            }), 400
        
        # Validate password strength (minimum 6 characters)
        if len(password) < 6:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Password must be at least 6 characters long'
                }
            }), 400
        
        if len(password) > 128:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Password must be less than 128 characters'
                }
            }), 400
        
        # Create new user with default 'staff' role
        user = User(
            username=username.strip(),
            email=email.strip().lower(),
            role='staff',  # Default role for public signups
            created_at=datetime.utcnow()
        )
        user.set_password(password)
        
        try:
            user.save()
        except NotUniqueError:
            return jsonify({
                'success': False,
                'error': {
                    'code': 409,
                    'message': 'Username or email already exists'
                }
            }), 409
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'created_at': user.created_at.isoformat()
            },
            'message': 'Account created successfully. Please login to continue.'
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': f'Signup failed: {str(e)}'
            }
        }), 500


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user information.
    
    Returns:
        {
            "success": true,
            "data": {
                "id": "user_id",
                "username": "admin",
                "email": "admin@example.com",
                "role": "admin"
            }
        }
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.objects(id=current_user_id).first()
        
        if not user:
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'User not found'
                }
            }), 404
        
        return jsonify({
            'success': True,
            'data': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': f'Failed to get user: {str(e)}'
            }
        }), 500


@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Request password reset endpoint.
    
    Request body:
        {
            "email": "user@example.com"
        }
    
    Returns:
        {
            "success": true,
            "message": "If an account exists with this email, a password reset link has been sent."
        }
    """
    from app.services.notification_service import notification_service
    from app.utils.rate_limiter import limiter, get_rate_limit
    
    # Apply rate limiting
    limiter.limit(get_rate_limit('auth_password_reset'))(lambda: None)()
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required'
                }
            }), 400
        
        email = data.get('email')
        
        # Validate email
        if not email:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Email is required'
                }
            }), 400
        
        # Validate email format
        if '@' not in email or '.' not in email.split('@')[-1]:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid email format'
                }
            }), 400
        
        # Find user by email
        user = User.find_by_email(email)
        
        # Always return success message to prevent email enumeration
        # But only send email if user exists
        if user and user.is_active:
            # Generate reset token
            reset_token = user.generate_reset_token()
            
            # Send password reset email
            notification_service.send_password_reset_email(
                to_email=user.email,
                username=user.username,
                reset_token=reset_token
            )
        
        # Return generic success message (security best practice)
        return jsonify({
            'success': True,
            'message': 'If an account exists with this email, a password reset link has been sent.'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': f'Password reset request failed: {str(e)}'
            }
        }), 500


@bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Reset password with token endpoint.
    
    Request body:
        {
            "token": "reset_token_here",
            "new_password": "newpassword123"
        }
    
    Returns:
        {
            "success": true,
            "message": "Password has been reset successfully. Please login with your new password."
        }
    """
    from app.utils.rate_limiter import limiter, get_rate_limit
    
    # Apply rate limiting
    limiter.limit(get_rate_limit('auth_password_reset'))(lambda: None)()
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required'
                }
            }), 400
        
        token = data.get('token')
        new_password = data.get('new_password')
        
        # Validate required fields
        if not token or not new_password:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Token and new password are required'
                }
            }), 400
        
        # Validate password strength
        if len(new_password) < 6:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Password must be at least 6 characters long'
                }
            }), 400
        
        if len(new_password) > 128:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Password must be less than 128 characters'
                }
            }), 400
        
        # Find user with this reset token
        user = User.objects(reset_token=token).first()
        
        if not user:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid or expired reset token'
                }
            }), 400
        
        # Verify token is valid and not expired
        if not user.verify_reset_token(token):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid or expired reset token'
                }
            }), 400
        
        # Reset password
        user.reset_password(new_password)
        
        return jsonify({
            'success': True,
            'message': 'Password has been reset successfully. Please login with your new password.'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': f'Password reset failed: {str(e)}'
            }
        }), 500


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    User logout endpoint.
    
    Returns:
        {
            "success": true,
            "message": "Logged out successfully"
        }
    """
    try:
        # In a production system with token blacklisting:
        # - Get the JWT token from the request
        # - Add it to a blacklist/revocation list
        # - Store in Redis or database with expiration
        
        # For now, just return success
        # The frontend will clear the token from storage
        
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': f'Logout failed: {str(e)}'
            }
        }), 500
