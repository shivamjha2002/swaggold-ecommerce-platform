"""Script to verify admin user and test authentication."""
import os
from mongoengine import connect
from app.models.user import User

def verify_admin():
    """Verify admin user exists and can authenticate."""
    
    # Connect to MongoDB
    mongodb_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/swati_jewellers_dev')
    connect(host=mongodb_uri)
    
    print("Connected to MongoDB")
    print("="*60)
    
    # Check if admin exists
    admin = User.objects(username='admin').first()
    
    if not admin:
        print("❌ Admin user does not exist!")
        print("Run: python backend/create_admin.py")
        return
    
    print("✅ Admin user found!")
    print(f"Username: {admin.username}")
    print(f"Email: {admin.email}")
    print(f"Role: {admin.role}")
    print(f"Is Active: {admin.is_active}")
    print(f"Created: {admin.created_at}")
    print("="*60)
    
    # Test authentication
    print("\nTesting authentication with password 'admin123'...")
    test_password = "admin123"
    
    if admin.check_password(test_password):
        print("✅ Password verification SUCCESSFUL!")
        print(f"Password '{test_password}' is correct")
    else:
        print("❌ Password verification FAILED!")
        print(f"Password '{test_password}' does not match")
        print("\nTrying to authenticate using User.authenticate()...")
        
        auth_result = User.authenticate('admin', test_password)
        if auth_result:
            print("✅ User.authenticate() SUCCESSFUL!")
        else:
            print("❌ User.authenticate() FAILED!")
            print("\nThe password hash might be incorrect.")
            print("Run: python backend/reset_admin_password.py")
    
    print("="*60)

if __name__ == '__main__':
    verify_admin()
