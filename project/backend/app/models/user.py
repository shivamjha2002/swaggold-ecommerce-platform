"""User model for admin authentication."""
from datetime import datetime
from mongoengine import (
    Document, StringField, BooleanField, DateTimeField
)
from werkzeug.security import generate_password_hash, check_password_hash


class User(Document):
    """User document model for admin authentication."""
    
    # Authentication
    username = StringField(required=True, unique=True, max_length=80)
    email = StringField(required=True, unique=True, max_length=200)
    password_hash = StringField(required=True)
    
    # Authorization
    role = StringField(
        choices=['admin', 'staff'],
        default='staff'
    )
    
    # Status
    is_active = BooleanField(default=True)
    
    # Timestamps
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    last_login = DateTimeField()
    
    meta = {
        'collection': 'users',
        'indexes': [
            {'fields': ['username'], 'unique': True},
            {'fields': ['email'], 'unique': True},
            'role',
            'is_active',
        ],
        'strict': False  # Allow extra fields from database
    }
    
    def set_password(self, password):
        """
        Hash and set the user password.
        
        Args:
            password: Plain text password
        """
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """
        Check if provided password matches the hash.
        
        Args:
            password: Plain text password to check
        
        Returns:
            bool: True if password matches, False otherwise
        """
        return check_password_hash(self.password_hash, password)
    
    def save(self, *args, **kwargs):
        """Override save to update timestamp."""
        self.updated_at = datetime.utcnow()
        return super(User, self).save(*args, **kwargs)
    
    def update_last_login(self):
        """Update the last login timestamp."""
        self.last_login = datetime.utcnow()
        self.save()
    
    def to_dict(self, include_sensitive=False):
        """
        Convert user to dictionary.
        
        Args:
            include_sensitive: Whether to include sensitive fields
        
        Returns:
            dict: User data
        """
        data = {
            'id': str(self.id),
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
        
        if include_sensitive:
            data['password_hash'] = self.password_hash
        
        return data
    
    @classmethod
    def authenticate(cls, username, password):
        """
        Authenticate a user with username and password.
        
        Args:
            username: Username or email
            password: Plain text password
        
        Returns:
            User: User object if authentication successful, None otherwise
        """
        # Try to find user by username or email
        user = cls.objects(username=username).first()
        if not user:
            user = cls.objects(email=username).first()
        
        if user and user.is_active and user.check_password(password):
            user.update_last_login()
            return user
        
        return None
