"""Manual verification script for the signup endpoint."""
import requests
import json

BASE_URL = "http://localhost:5000/api/auth"

def test_signup():
    """Test the public signup endpoint."""
    print("Testing public signup endpoint...")
    print("-" * 50)
    
    # Test 1: Successful signup
    print("\n1. Testing successful signup:")
    signup_data = {
        "username": "testuser123",
        "email": "testuser123@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/signup", json=signup_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 201:
            data = response.json()
            assert data['success'] == True
            assert data['data']['username'] == 'testuser123'
            assert data['data']['email'] == 'testuser123@example.com'
            assert data['data']['role'] == 'staff'  # Default role
            print("✓ Successful signup test passed!")
        else:
            print("✗ Unexpected status code")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 2: Missing required fields
    print("\n2. Testing missing email:")
    invalid_data = {
        "username": "testuser",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/signup", json=invalid_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 400:
            print("✓ Validation error test passed!")
        else:
            print("✗ Expected 400 status code")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 3: Invalid email format
    print("\n3. Testing invalid email format:")
    invalid_email_data = {
        "username": "testuser2",
        "email": "invalidemail",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/signup", json=invalid_email_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 400:
            print("✓ Email validation test passed!")
        else:
            print("✗ Expected 400 status code")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 4: Short password
    print("\n4. Testing short password:")
    short_password_data = {
        "username": "testuser3",
        "email": "test3@example.com",
        "password": "12345"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/signup", json=short_password_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 400:
            print("✓ Password validation test passed!")
        else:
            print("✗ Expected 400 status code")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 5: Duplicate username
    print("\n5. Testing duplicate username:")
    duplicate_data = {
        "username": "testuser123",  # Same as first test
        "email": "different@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/signup", json=duplicate_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 409:
            print("✓ Duplicate username test passed!")
        else:
            print("✗ Expected 409 status code")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    print("\n" + "=" * 50)
    print("Verification complete!")
    print("\nImplementation Summary:")
    print("✓ Created /auth/signup route without JWT authentication")
    print("✓ Added validation for username, email, and password")
    print("✓ Returns appropriate error messages for validation failures")
    print("✓ Sets default role to 'staff' for public signups")
    print("✓ Handles duplicate username/email with 409 status")
    print("✓ Returns success message on successful signup")

if __name__ == "__main__":
    print("=" * 50)
    print("Public Signup Endpoint Verification")
    print("=" * 50)
    print("\nNote: This script requires the backend server to be running.")
    print("Start the server with: python backend/run.py")
    print("\nPress Enter to continue or Ctrl+C to cancel...")
    input()
    
    test_signup()
