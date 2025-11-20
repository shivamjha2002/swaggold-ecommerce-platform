"""Test script to verify enhanced product route error responses."""
import requests
import json
from datetime import datetime, timedelta
import jwt

# Configuration
BASE_URL = 'http://localhost:5000/api'
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'admin123'

def print_response(title, response):
    """Print formatted response."""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
    except:
        print(f"Response: {response.text}")
    print(f"{'='*60}\n")

def test_admin_endpoint_without_token():
    """Test admin endpoint without JWT token."""
    print("\n🔍 TEST 1: Admin endpoint without JWT token")
    response = requests.get(f'{BASE_URL}/products/admin')
    print_response("Admin Products - No Token", response)
    
    # Verify error format
    if response.status_code == 401:
        data = response.json()
        assert 'success' in data and not data['success']
        assert 'error' in data
        assert 'code' in data['error']
        assert 'message' in data['error']
        assert 'details' in data['error']
        print("✅ Error format is consistent")
    else:
        print("❌ Expected 401 status code")

def test_admin_endpoint_with_invalid_token():
    """Test admin endpoint with invalid JWT token."""
    print("\n🔍 TEST 2: Admin endpoint with invalid JWT token")
    headers = {'Authorization': 'Bearer invalid_token_here'}
    response = requests.get(f'{BASE_URL}/products/admin', headers=headers)
    print_response("Admin Products - Invalid Token", response)
    
    # Verify error format
    if response.status_code == 401:
        data = response.json()
        assert 'success' in data and not data['success']
        assert 'error' in data
        assert 'message' in data['error']
        print("✅ Invalid token error handled correctly")
    else:
        print("❌ Expected 401 status code")

def test_admin_endpoint_with_expired_token():
    """Test admin endpoint with expired JWT token."""
    print("\n🔍 TEST 3: Admin endpoint with malformed JWT token")
    
    # Create a malformed token (this will be treated as invalid)
    # Note: Testing actual expired tokens requires knowing the app's secret key
    malformed_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed.signature'
    
    headers = {'Authorization': f'Bearer {malformed_token}'}
    response = requests.get(f'{BASE_URL}/products/admin', headers=headers)
    print_response("Admin Products - Malformed Token", response)
    
    # Verify error format
    if response.status_code == 401:
        data = response.json()
        assert 'success' in data and not data['success']
        assert 'error' in data
        assert 'code' in data['error'] and data['error']['code'] == 401
        assert 'message' in data['error']
        assert 'details' in data['error']
        print("✅ Malformed token error handled correctly")
    else:
        print("❌ Expected 401 status code")

def test_admin_endpoint_with_valid_token():
    """Test admin endpoint with valid JWT token."""
    print("\n🔍 TEST 4: Admin endpoint with valid JWT token")
    
    # Login to get valid token
    login_response = requests.post(
        f'{BASE_URL}/auth/login',
        json={'username': ADMIN_USERNAME, 'password': ADMIN_PASSWORD}
    )
    
    if login_response.status_code != 200:
        print("❌ Failed to login. Make sure admin user exists.")
        print_response("Login Failed", login_response)
        return
    
    token = login_response.json()['data']['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    response = requests.get(f'{BASE_URL}/products/admin', headers=headers)
    print_response("Admin Products - Valid Token", response)
    
    # Verify success format
    if response.status_code == 200:
        data = response.json()
        assert 'success' in data and data['success']
        assert 'data' in data
        assert 'pagination' in data
        print("✅ Valid token works correctly")
    else:
        print("❌ Expected 200 status code")

def test_product_creation_errors():
    """Test product creation with various error scenarios."""
    print("\n🔍 TEST 5: Product creation error handling")
    
    # Test 1: Empty request body
    response = requests.post(
        f'{BASE_URL}/products/',
        json=None,
        headers={'Content-Type': 'application/json'}
    )
    print_response("Create Product - Empty Body", response)
    
    if response.status_code == 400:
        data = response.json()
        assert 'success' in data and not data['success']
        assert 'error' in data
        print("✅ Empty body error handled correctly")
    
    # Test 2: Missing required fields
    response = requests.post(
        f'{BASE_URL}/products/',
        json={'name': 'Test Product'}
    )
    print_response("Create Product - Missing Fields", response)
    
    if response.status_code == 400:
        data = response.json()
        assert 'success' in data and not data['success']
        assert 'error' in data
        print("✅ Missing fields error handled correctly")
    
    # Test 3: Invalid category
    response = requests.post(
        f'{BASE_URL}/products/',
        json={
            'name': 'Test Product',
            'category': 'InvalidCategory',
            'base_price': 10000,
            'weight': 5.0
        }
    )
    print_response("Create Product - Invalid Category", response)
    
    if response.status_code == 400:
        data = response.json()
        assert 'success' in data and not data['success']
        assert 'error' in data
        print("✅ Invalid category error handled correctly")

def test_product_not_found():
    """Test product not found error."""
    print("\n🔍 TEST 6: Product not found error")
    
    fake_id = '507f1f77bcf86cd799439011'
    response = requests.get(f'{BASE_URL}/products/{fake_id}')
    print_response("Get Product - Not Found", response)
    
    if response.status_code == 404:
        data = response.json()
        assert 'success' in data and not data['success']
        assert 'error' in data
        assert 'code' in data['error'] and data['error']['code'] == 404
        assert 'message' in data['error']
        assert 'details' in data['error']
        print("✅ Product not found error handled correctly")
    else:
        print("❌ Expected 404 status code")

def test_invalid_page_number():
    """Test invalid page number error."""
    print("\n🔍 TEST 7: Invalid page number error")
    
    response = requests.get(f'{BASE_URL}/products/?page=0')
    print_response("Get Products - Invalid Page", response)
    
    if response.status_code == 400:
        data = response.json()
        assert 'success' in data and not data['success']
        assert 'error' in data
        assert 'page' in data['error']['message'].lower() or 'page' in data['error']['details'].lower()
        print("✅ Invalid page number error handled correctly")
    else:
        print("❌ Expected 400 status code")

def test_publish_without_auth():
    """Test publish endpoint without authentication."""
    print("\n🔍 TEST 8: Publish product without authentication")
    
    fake_id = '507f1f77bcf86cd799439011'
    response = requests.post(f'{BASE_URL}/products/{fake_id}/publish')
    print_response("Publish Product - No Auth", response)
    
    if response.status_code == 401:
        data = response.json()
        assert 'success' in data and not data['success']
        assert 'error' in data
        assert 'Authentication' in data['error']['message'] or 'auth' in data['error']['message'].lower()
        print("✅ Publish without auth error handled correctly")
    else:
        print("❌ Expected 401 status code")

def run_all_tests():
    """Run all error handling tests."""
    print("\n" + "="*60)
    print("PRODUCT ROUTE ERROR HANDLING TESTS")
    print("="*60)
    
    try:
        test_admin_endpoint_without_token()
        test_admin_endpoint_with_invalid_token()
        test_admin_endpoint_with_expired_token()
        test_admin_endpoint_with_valid_token()
        test_product_creation_errors()
        test_product_not_found()
        test_invalid_page_number()
        test_publish_without_auth()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    run_all_tests()
