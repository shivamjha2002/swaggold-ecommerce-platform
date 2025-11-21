"""Configuration classes for different environments."""
import os
from datetime import timedelta


class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # MongoDB configuration
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb://localhost:27017/swati_jewellers'
    
    # CORS configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    # Razorpay configuration
    RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID')
    RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')
    RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET')
    
    # Cart and checkout configuration
    GST_RATE = float(os.environ.get('GST_RATE', '0.03'))
    SHIPPING_RATE = float(os.environ.get('SHIPPING_RATE', '100.0'))
    CART_SESSION_TIMEOUT = int(os.environ.get('CART_SESSION_TIMEOUT', '86400'))
    
    # Gemini API price feed configuration
    GEMINI_SYMBOLS = os.environ.get('GEMINI_SYMBOLS', 'BTCUSD,ETHUSD')
    PRICE_FETCH_INTERVAL = int(os.environ.get('PRICE_FETCH_INTERVAL', '60'))
    USD_TO_INR_RATE = float(os.environ.get('USD_TO_INR_RATE', '83.0'))
    
    # Application settings
    JSON_SORT_KEYS = False
    JSONIFY_PRETTYPRINT_REGULAR = True


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    TESTING = False
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb://localhost:27017/swati_jewellers_dev'


class TestingConfig(Config):
    """Testing configuration."""
    DEBUG = False
    TESTING = True
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb://localhost:27017/swati_jewellers_test'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False
    
    # Require environment variables in production
    SECRET_KEY = os.environ.get('SECRET_KEY') or None
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or None
    MONGODB_URI = os.environ.get('MONGODB_URI') or None
    
    # Razorpay configuration - require in production
    RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID')
    RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET')
    RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET')
    
    # Restrict CORS in production
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'https://swatijewellers.com').split(',')
    
    # Security settings
    SESSION_COOKIE_SECURE = True  # Only send cookies over HTTPS
    SESSION_COOKIE_HTTPONLY = True  # Prevent JavaScript access to cookies
    SESSION_COOKIE_SAMESITE = 'Lax'  # CSRF protection
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # Force HTTPS
    PREFERRED_URL_SCHEME = 'https'
    
    def __init__(self):
        """Validate required environment variables on initialization."""
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY environment variable must be set in production")
        if not self.JWT_SECRET_KEY:
            raise ValueError("JWT_SECRET_KEY environment variable must be set in production")
        if not self.MONGODB_URI:
            raise ValueError("MONGODB_URI environment variable must be set in production")
        if not self.RAZORPAY_KEY_ID:
            raise ValueError("RAZORPAY_KEY_ID environment variable must be set in production")
        if not self.RAZORPAY_KEY_SECRET:
            raise ValueError("RAZORPAY_KEY_SECRET environment variable must be set in production")
        if not self.RAZORPAY_WEBHOOK_SECRET:
            raise ValueError("RAZORPAY_WEBHOOK_SECRET environment variable must be set in production")


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
