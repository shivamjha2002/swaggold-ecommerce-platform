"""Script to create an admin user."""
import os
import sys
from mongoengine import connect, Document, StringField, BooleanField, DateTimeField
from werkzeug.security import generate_password_hash
from datetime import datetime

# Define User model inline to avoid import issues
class User(Document):
    """User model."""
    username = StringField(required=True, unique=True, max_length=100)
    email = StringField(required=True, unique=True, max_length=150)
    password_hash = StringField(required=True)
    role = StringField(required=True, choices=['admin', 'staff', 'customer'], default='customer')
    is_active = BooleanField(default=True)
    last_login = DateTimeField()
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'users',
        'indexes': ['username', 'email', 'role'],
        'strict': False  # Allow extra fields
    }

def create_admin_user():
    """Create an admin user in the database."""
    
    # Set environment to development to avoid production checks
    os.environ.setdefault('FLASK_ENV', 'development')
    
    # Connect to MongoDB
    mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/swati_jewellers_dev')
    connect(host=mongodb_uri)
    
    print("Connected to MongoDB")
    
    # Admin credentials
    username = "admin"
    email = "admin@swatijewellers.com"
    password = "admin123"  # Change this to a secure password
    
    # Check if admin already exists
    existing_admin = User.objects(username=username).first()
    if existing_admin:
        print(f"Admin user '{username}' already exists!")
        print(f"Email: {existing_admin.email}")
        print(f"Role: {existing_admin.role}")
        return
    
    # Create admin user
    try:
        admin_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            role='admin',
            is_active=True
        )
        admin_user.save()
        
        print("\n" + "="*50)
        print("✅ Admin user created successfully!")
        print("="*50)
        print(f"Username: {username}")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"Role: admin")
        print("="*50)
        print("\n⚠️  IMPORTANT: Change the password after first login!")
        print("Use these credentials to login to the admin dashboard.\n")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    create_admin_user()
