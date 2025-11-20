"""Test login endpoint."""
import requests
import json

# Test login
url = "http://localhost:5000/api/auth/login"
credentials = {
    "username": "admin",
    "password": "admin123"
}

print("Testing login endpoint...")
print(f"URL: {url}")
print(f"Credentials: {credentials}")
print()

try:
    response = requests.post(url, json=credentials)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✅ Login successful!")
        token = response.json().get('data', {}).get('token')
        if token:
            print(f"Token: {token[:50]}...")
            
            # Test authenticated request
            print("\n\nTesting authenticated request to /api/products/admin...")
            headers = {"Authorization": f"Bearer {token}"}
            products_response = requests.get("http://localhost:5000/api/products/admin", headers=headers)
            print(f"Status Code: {products_response.status_code}")
            print(f"Response: {json.dumps(products_response.json(), indent=2)}")
    else:
        print("\n❌ Login failed!")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")
