"""Flask application factory."""
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from mongoengine import connect
from mongoengine.errors import ValidationError as MongoValidationError, NotUniqueError, DoesNotExist
from mongoengine.connection import ConnectionFailure
from werkzeug.exceptions import HTTPException
from flask_jwt_extended.exceptions import JWTExtendedException
from .config import config
from .utils.exceptions import (
    APIException,
    ResourceNotFoundError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    DatabaseError
)


def create_app(config_name='development'):
    """Create and configure Flask application."""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Configure upload folder
    import os
    upload_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'products')
    app.config['UPLOAD_FOLDER'] = upload_folder
    os.makedirs(upload_folder, exist_ok=True)
    
    # Disable strict slashes to prevent redirects on trailing slashes
    app.url_map.strict_slashes = False
    
    # Initialize extensions
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "x-retry-count", "x-request-start-time"],
            "supports_credentials": True
        }
    })
    
    jwt = JWTManager(app)
    
    # Configure JWT error callbacks for consistent error format
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        """Handle expired JWT tokens."""
        app.logger.warning('Expired JWT token used')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Token expired',
                'details': 'Your session has expired. Please login again'
            }
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        """Handle invalid JWT tokens."""
        app.logger.warning(f'Invalid JWT token: {error}')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Invalid JWT token',
                'details': 'Token could not be decoded or verified'
            }
        }), 401
    
    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        """Handle missing JWT tokens."""
        app.logger.warning(f'Missing JWT token: {error}')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Authentication required',
                'details': 'Missing or invalid JWT token in request headers'
            }
        }), 401
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        """Handle revoked JWT tokens."""
        app.logger.warning('Revoked JWT token used')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Token revoked',
                'details': 'This token has been revoked. Please login again'
            }
        }), 401
    
    @jwt.needs_fresh_token_loader
    def needs_fresh_token_callback(jwt_header, jwt_payload):
        """Handle requests requiring fresh tokens."""
        app.logger.warning('Fresh token required but not provided')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Fresh token required',
                'details': 'This action requires a fresh login token'
            }
        }), 401
    
    # Connect to MongoDB Atlas with connection pooling and error handling
    try:
        connect(
            host=app.config['MONGODB_URI'],
            alias='default',
            maxPoolSize=50,
            minPoolSize=10,
            serverSelectionTimeoutMS=10000,  # Increased timeout for Atlas
            connectTimeoutMS=15000,
            socketTimeoutMS=15000,
            retryWrites=True,
            w='majority'
        )
        app.logger.info('✅ Successfully connected to MongoDB Atlas!')
        
        # Test the connection
        from mongoengine import connection
        db = connection.get_db()
        db.command('ping')
        app.logger.info('✅ MongoDB Atlas connection test passed!')
        
    except ConnectionFailure as e:
        app.logger.error(f'❌ Failed to connect to MongoDB Atlas: {str(e)}')
        raise
    except Exception as e:
        app.logger.error(f'❌ Unexpected error connecting to MongoDB Atlas: {str(e)}')
        raise
    
    # Register blueprints
    from app.routes import products, customers, sales, khata, predictions, prices, auth, analytics, orders, uploads
    app.register_blueprint(products.bp, url_prefix='/api/products')
    app.register_blueprint(customers.bp, url_prefix='/api/customers')
    app.register_blueprint(sales.bp, url_prefix='/api/sales')
    app.register_blueprint(khata.bp, url_prefix='/api/khata')
    app.register_blueprint(predictions.bp, url_prefix='/api/predictions')
    app.register_blueprint(prices.bp, url_prefix='/api/prices')
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(analytics.bp, url_prefix='/api/analytics')
    app.register_blueprint(orders.bp, url_prefix='/api/orders')
    app.register_blueprint(uploads.bp, url_prefix='/api/uploads')
    
    # Register error handlers
    register_error_handlers(app)
    
    def add_security_headers(response):
        """Add security headers to response."""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response
    
    @app.after_request
    def apply_security_headers(response):
        """Apply security headers to all responses."""
        return add_security_headers(response)
    
    # Enforce HTTPS in production
    @app.before_request
    def enforce_https():
        """Redirect HTTP to HTTPS in production."""
        import os
        from flask import redirect
        
        env = os.environ.get('FLASK_ENV', 'production')
        
        # Only enforce in production
        if env == 'production':
            # Check if request is not secure and not from localhost
            if not request.is_secure and request.host != 'localhost':
                # Redirect to HTTPS
                url = request.url.replace('http://', 'https://', 1)
                return redirect(url, code=301)
    
    # Serve uploaded images
    @app.route('/uploads/products/<filename>')
    def serve_product_image(filename):
        """Serve uploaded product images."""
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        """
        Health check endpoint that returns server status, version, and database connectivity.
        Returns 200 if healthy, 503 if degraded.
        """
        import os
        from datetime import datetime
        
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'environment': app.config.get('ENV', 'production'),
            'checks': {}
        }
        
        # Check database connectivity
        try:
            from mongoengine import connection
            db = connection.get_db()
            # Perform a simple operation to verify connection
            db.command('ping')
            health_status['checks']['database'] = {
                'status': 'healthy',
                'message': 'MongoDB Atlas connection successful'
            }
        except Exception as e:
            app.logger.error(f'Database health check failed: {str(e)}')
            health_status['status'] = 'degraded'
            health_status['checks']['database'] = {
                'status': 'unhealthy',
                'message': f'MongoDB Atlas connection failed: {str(e)}'
            }
        
        # Check ML models availability
        try:
            import os.path
            gold_model_path = os.path.join(app.root_path, '..', 'models', 'gold_model.pkl')
            diamond_model_path = os.path.join(app.root_path, '..', 'models', 'diamond_model.pkl')
            
            gold_exists = os.path.exists(gold_model_path)
            diamond_exists = os.path.exists(diamond_model_path)
            
            if gold_exists and diamond_exists:
                health_status['checks']['ml_models'] = {
                    'status': 'healthy',
                    'message': 'All ML models available'
                }
            elif gold_exists or diamond_exists:
                health_status['checks']['ml_models'] = {
                    'status': 'degraded',
                    'message': 'Some ML models missing'
                }
            else:
                health_status['checks']['ml_models'] = {
                    'status': 'unavailable',
                    'message': 'ML models not trained'
                }
        except Exception as e:
            app.logger.warning(f'ML model check failed: {str(e)}')
            health_status['checks']['ml_models'] = {
                'status': 'unknown',
                'message': 'Unable to check ML models'
            }
        
        # Determine overall status code
        status_code = 200 if health_status['status'] == 'healthy' else 503
        
        return jsonify(health_status), status_code
    
    # Root endpoint
    @app.route('/')
    def root():
        """Root endpoint with API information."""
        return jsonify({
            'message': 'Swati Jewelers E-commerce Platform API',
            'version': '1.0.0',
            'status': 'running',
            'endpoints': {
                'health': '/api/health',
                'products': '/api/products',
                'customers': '/api/customers',
                'sales': '/api/sales',
                'auth': '/api/auth',
                'documentation': 'https://github.com/shivamjha2002/swaggold-ecommerce-platform'
            }
        })
    
    return app


def register_error_handlers(app):
    """Register global error handlers."""
    
    @app.errorhandler(APIException)
    def handle_api_exception(error):
        """Handle custom API exceptions."""
        app.logger.warning(f'API exception: {error.message}')
        response = {
            'success': False,
            'error': error.to_dict()
        }
        return jsonify(response), error.status_code
    
    @app.errorhandler(MongoValidationError)
    def handle_mongo_validation_error(error):
        """Handle mongoengine validation errors."""
        app.logger.warning(f'MongoDB validation error: {str(error)}')
        
        # Parse mongoengine validation error for better messages
        error_message = str(error)
        details = {}
        
        # Extract field-specific errors if available
        if hasattr(error, 'errors') and error.errors:
            details = {field: str(err) for field, err in error.errors.items()}
        
        response = {
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': details if details else error_message
            }
        }
        return jsonify(response), 400
    
    @app.errorhandler(NotUniqueError)
    def handle_not_unique_error(error):
        """Handle mongoengine unique constraint violations."""
        app.logger.warning(f'Unique constraint violation: {str(error)}')
        
        # Extract field name from error message if possible
        error_str = str(error)
        field_name = None
        if 'duplicate key error' in error_str.lower():
            # Try to extract field name from error message
            import re
            match = re.search(r'index: (\w+)_', error_str)
            if match:
                field_name = match.group(1)
        
        message = f"A record with this {field_name} already exists" if field_name else "Duplicate record"
        
        response = {
            'success': False,
            'error': {
                'code': 409,
                'message': message,
                'details': error_str
            }
        }
        return jsonify(response), 409
    
    @app.errorhandler(DoesNotExist)
    def handle_does_not_exist_error(error):
        """Handle mongoengine DoesNotExist errors."""
        app.logger.warning(f'Resource not found: {str(error)}')
        response = {
            'success': False,
            'error': {
                'code': 404,
                'message': 'Resource not found',
                'details': str(error)
            }
        }
        return jsonify(response), 404
    
    @app.errorhandler(JWTExtendedException)
    def handle_jwt_error(error):
        """Handle JWT-related errors with detailed messages."""
        app.logger.warning(f'JWT error: {type(error).__name__} - {str(error)}')
        
        # Determine appropriate status code and messages based on error type
        status_code = 401
        error_str = str(error)
        error_type = type(error).__name__
        
        # Map error types to user-friendly messages
        if 'expired' in error_str.lower() or 'ExpiredSignature' in error_type:
            message = 'Token expired'
            details = 'Your session has expired. Please login again'
        elif 'invalid' in error_str.lower() or 'InvalidHeader' in error_type or 'JWTDecode' in error_type:
            message = 'Invalid JWT token'
            details = 'Token could not be decoded or verified'
        elif 'missing' in error_str.lower() or 'NoAuthorization' in error_type:
            message = 'Authentication required'
            details = 'Missing or invalid JWT token in request headers'
        elif 'revoked' in error_str.lower() or 'RevokedToken' in error_type:
            message = 'Token revoked'
            details = 'This token has been revoked. Please login again'
        elif 'fresh' in error_str.lower() or 'FreshToken' in error_type:
            message = 'Fresh token required'
            details = 'This action requires a fresh login token'
        else:
            message = 'Authentication failed'
            details = error_str
        
        response = {
            'success': False,
            'error': {
                'code': status_code,
                'message': message,
                'details': details
            }
        }
        return jsonify(response), status_code
    
    @app.errorhandler(AuthorizationError)
    def handle_authorization_error(error):
        """Handle authorization errors (403 Forbidden)."""
        app.logger.warning(f'Authorization error: {error.message}')
        response = {
            'success': False,
            'error': {
                'code': 403,
                'message': error.message,
                'details': 'You do not have permission to access this resource'
            }
        }
        return jsonify(response), 403
    
    @app.errorhandler(ConnectionFailure)
    def handle_connection_failure(error):
        """Handle MongoDB connection failures."""
        app.logger.error(f'❌ MongoDB Atlas connection failure: {str(error)}')
        response = {
            'success': False,
            'error': {
                'code': 503,
                'message': 'MongoDB Atlas service unavailable',
                'details': 'Unable to connect to MongoDB Atlas. Please check your connection and credentials.'
            }
        }
        return jsonify(response), 503
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        """Handle HTTP exceptions."""
        app.logger.info(f'HTTP exception: {error.code} - {error.description}')
        
        # Provide more specific error messages for common HTTP errors
        error_str = str(error.description) if error.description else ''
        
        if error.code == 400 and ('JSON' in error_str or 'decode' in error_str.lower()):
            message = 'Invalid JSON format'
            details = 'Request body must be valid JSON'
        elif error.code == 400:
            message = 'Bad request'
            details = error.description or 'The request could not be understood'
        elif error.code == 404:
            message = 'Not found'
            details = error.description or 'The requested resource was not found'
        elif error.code == 405:
            message = 'Method not allowed'
            details = error.description or 'The HTTP method is not allowed for this endpoint'
        else:
            message = error.description or error.name
            details = None
        
        response = {
            'success': False,
            'error': {
                'code': error.code,
                'message': message
            }
        }
        
        if details:
            response['error']['details'] = details
        
        return jsonify(response), error.code
    
    @app.errorhandler(ValueError)
    def handle_value_error(error):
        """Handle ValueError exceptions."""
        app.logger.warning(f'Value error: {str(error)}')
        
        # Check if it's a JSON decode error
        error_str = str(error)
        if 'JSON' in error_str or 'decode' in error_str.lower():
            message = 'Invalid JSON format'
            details = 'Request body must be valid JSON'
        else:
            message = 'Invalid value'
            details = error_str
        
        response = {
            'success': False,
            'error': {
                'code': 400,
                'message': message,
                'details': details
            }
        }
        return jsonify(response), 400
    
    @app.errorhandler(KeyError)
    def handle_key_error(error):
        """Handle KeyError exceptions (missing required fields)."""
        app.logger.warning(f'Key error: {str(error)}')
        response = {
            'success': False,
            'error': {
                'code': 400,
                'message': f'Missing required field: {str(error)}',
                'details': 'Required field is missing from request'
            }
        }
        return jsonify(response), 400
    
    @app.errorhandler(Exception)
    def handle_generic_error(error):
        """Handle all other exceptions."""
        app.logger.error(f'Unexpected error: {str(error)}', exc_info=True)
        
        # In production, don't expose internal error details
        if app.config.get('DEBUG'):
            details = str(error)
        else:
            details = 'An internal error occurred'
        
        response = {
            'success': False,
            'error': {
                'code': 500,
                'message': 'Internal server error',
                'details': details
            }
        }
        return jsonify(response), 500