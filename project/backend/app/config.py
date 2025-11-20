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
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    MONGODB_URI = os.environ.get('MONGODB_URI')
    
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable must be set in production")
    if not JWT_SECRET_KEY:
        raise ValueError("JWT_SECRET_KEY environment variable must be set in production")
    if not MONGODB_URI:
        raise ValueError("MONGODB_URI environment variable must be set in production")
    
    # Restrict CORS in production
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'https://swatijewellers.com').split(',')


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
