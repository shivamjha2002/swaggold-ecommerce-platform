"""Script to reset admin password."""
import os
from mongoengine import connect, Document, StringField, BooleanField, DateTimeField
from werkzeug.security import generate_password_hash
from datetime import datetime

# Define User model inline
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
        'strict': False
    }

def reset_admin_password():
    """Reset admin user password."""
    
    # Connect to MongoDB
    mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/swati_jewellers_dev')
    connect(host=mongodb_uri)
    
    print("Connected to MongoDB")
    
    # Find admin user
    admin = User.objects(username='admin').first()
    
    if not admin:
        print("❌ Admin user not found!")
        return
    
    # New password
    new_password = "admin123"
    
    # Update password
    admin.password_hash = generate_password_hash(new_password)
    admin.updated_at = datetime.utcnow()
    admin.save()
    
    print("\n" + "="*50)
    print("✅ Admin password reset successfully!")
    print("="*50)
    print(f"Username: {admin.username}")
    print(f"Email: {admin.email}")
    print(f"New Password: {new_password}")
    print(f"Role: {admin.role}")
    print("="*50)
    print("\nYou can now login with these credentials!\n")

if __name__ == '__main__':
    reset_admin_password()
