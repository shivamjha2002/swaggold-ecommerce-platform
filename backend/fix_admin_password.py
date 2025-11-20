"""Script to fix admin password by recreating the user with correct hash."""
import os
from mongoengine import connect, Document, StringField, BooleanField, DateTimeField
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

# Define User model inline
class User(Document):
    """User model."""
    username = StringField(required=True, unique=True, max_length=80)
    email = StringField(required=True, unique=True, max_length=200)
    password_hash = StringField(required=True)
    role = StringField(choices=['admin', 'staff'], default='staff')
    is_active = BooleanField(default=True)
    last_login = DateTimeField()
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'users',
        'indexes': ['username', 'email', 'role'],
        'strict': False
    }
    
    def check_password(self, password):
        """Check if password matches."""
        return check_password_hash(self.password_hash, password)

def fix_admin_password():
    """Fix admin password."""
    
    # Connect to MongoDB
    mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/swati_jewellers_dev')
    connect(host=mongodb_uri)
    
    print("Connected to MongoDB")
    print("="*60)
    
    # Find admin user
    admin = User.objects(username='admin').first()
    
    if not admin:
        print("❌ Admin user not found! Creating new admin user...")
        admin = User(
            username='admin',
            email='admin@swatijewellers.com',
            role='admin',
            is_active=True
        )
    else:
        print("✅ Found existing admin user")
        print(f"Email: {admin.email}")
        print(f"Role: {admin.role}")
    
    # Set password using werkzeug directly (same as User.set_password)
    new_password = 'admin123'
    admin.password_hash = generate_password_hash(new_password)
    admin.updated_at = datetime.utcnow()
    
    # Save
    admin.save()
    
    print("\n✅ Admin password updated!")
    print("="*60)
    
    # Verify the password works
    print("\nVerifying password...")
    if admin.check_password(new_password):
        print("✅ Password verification SUCCESSFUL!")
        print(f"\nLogin credentials:")
        print(f"Username: admin")
        print(f"Password: admin123")
        print(f"Email: {admin.email}")
        print(f"Role: {admin.role}")
    else:
        print("❌ Password verification FAILED!")
    
    print("="*60)

if __name__ == '__main__':
    fix_admin_password()
