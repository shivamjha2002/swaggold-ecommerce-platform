"""Test login endpoint error handling."""
import requests
import json

BASE_URL = "http://localhost:5000/api/auth/login"

def test_login(username, password, description):
    """Test login with given credentials."""
    print(f"\n{'='*60}")
    print(f"Test: {description}")
    print(f"{'='*60}")
    print(f"Username: {username}")
    print(f"Password: {'*' * len(password)}")
    
    try:
        response = requests.post(BASE_URL, json={
            "username": username,
            "password": password
        })
        
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
        else:
            print("❌ Login failed (expected)")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

# Test cases
print("Testing Login Error Handling")
print("="*60)

# Test 1: Valid credentials
test_login("admin", "admin123", "Valid admin credentials")

# Test 2: Invalid password
test_login("admin", "wrongpassword", "Invalid password")

# Test 3: Invalid username
test_login("nonexistent", "admin123", "Non-existent username")

# Test 4: Empty username
test_login("", "admin123", "Empty username")

# Test 5: Empty password
test_login("admin", "", "Empty password")

# Test 6: Both empty
test_login("", "", "Both empty")

print("\n" + "="*60)
print("All tests completed!")
print("="*60)
