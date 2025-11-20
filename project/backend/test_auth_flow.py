"""
Comprehensive Authentication Flow Tests.

This test suite validates the complete authentication flow including:
- User signup with valid and invalid data
- User login with valid and invalid credentials
- Admin login and dashboard access
- Session persistence across requests
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import unittest
import json
from datetime import datetime
from app import create_app
from app.models.user import User


class TestCompleteAuthFlow(unittest.TestCase):
    """Test complete authentication flow end-to-end."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test client and database connection."""
        cls.app = create_app('testing')
        cls.client = cls.app.test_client()
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
    
    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests."""
        cls.app_context.pop()
    
    def setUp(self):
        """Set up before each test."""
        # Clear users collection
        User.drop_collection()
        
        # Create test admin user
        self.admin_user = User(
            username='admin',
            email='admin@test.com',
            role='admin',
            is_active=True,
            created_at=datetime.utcnow()
        )
        self.admin_user.set_password('admin123')
        self.admin_user.save()
    
    def tearDown(self):
        """Clean up after each test."""
        User.drop_collection()
    
    # ========================================================================
    # Test 1: User Signup with Valid Data
    # ========================================================================
    
    def test_01_user_signup_with_valid_data(self):
        """Test user signup with valid data."""
        print("\n" + "="*70)
        print("TEST 1: User Signup with Valid Data")
        print("="*70)
        
        signup_data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'password123'
        }
        
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        
        print(f"Request: POST /api/auth/signup")
        print(f"Data: {signup_data}")
        print(f"Status Code: {response.status_code}")
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Verify response structure
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertEqual(data['data']['username'], 'newuser')
        self.assertEqual(data['data']['email'], 'newuser@test.com')
        self.assertEqual(data['data']['role'], 'staff')
        
        # Verify user was created in database
        new_user = User.objects(username='newuser').first()
        self.assertIsNotNone(new_user)
        self.assertTrue(new_user.check_password('password123'))
        self.assertEqual(new_user.role, 'staff')
        self.assertTrue(new_user.is_active)
        
        print("✅ User signup successful - user created with staff role")
    
    # ========================================================================
    # Test 2: User Signup with Invalid Data
    # ========================================================================
    
    def test_02_user_signup_with_invalid_data(self):
        """Test user signup with various invalid data scenarios."""
        print("\n" + "="*70)
        print("TEST 2: User Signup with Invalid Data")
        print("="*70)
        
        invalid_scenarios = [
            {
                'name': 'Missing username',
                'data': {'email': 'test@test.com', 'password': 'password123'},
                'expected_status': 400,
                'expected_message': 'Username, email, and password are required'
            },
            {
                'name': 'Missing email',
                'data': {'username': 'testuser', 'password': 'password123'},
                'expected_status': 400,
                'expected_message': 'Username, email, and password are required'
            },
            {
                'name': 'Missing password',
                'data': {'username': 'testuser', 'email': 'test@test.com'},
                'expected_status': 400,
                'expected_message': 'Username, email, and password are required'
            },
            {
                'name': 'Invalid email format',
                'data': {'username': 'testuser', 'email': 'invalidemail', 'password': 'password123'},
                'expected_status': 400,
                'expected_message': 'Invalid email format'
            },
            {
                'name': 'Password too short',
                'data': {'username': 'testuser', 'email': 'test@test.com', 'password': '12345'},
                'expected_status': 400,
                'expected_message': 'at least 6 characters'
            },
            {
                'name': 'Username too short',
                'data': {'username': 'ab', 'email': 'test@test.com', 'password': 'password123'},
                'expected_status': 400,
                'expected_message': 'between 3 and 80 characters'
            },
            {
                'name': 'Invalid username characters',
                'data': {'username': 'test@user', 'email': 'test@test.com', 'password': 'password123'},
                'expected_status': 400,
                'expected_message': 'letters, numbers, and underscores'
            }
        ]
        
        for scenario in invalid_scenarios:
            print(f"\nScenario: {scenario['name']}")
            print(f"Data: {scenario['data']}")
            
            response = self.client.post(
                '/api/auth/signup',
                data=json.dumps(scenario['data']),
                content_type='application/json'
            )
            
            print(f"Status Code: {response.status_code}")
            data = json.loads(response.data)
            print(f"Error Message: {data.get('error', {}).get('message', 'N/A')}")
            
            self.assertEqual(response.status_code, scenario['expected_status'])
            self.assertFalse(data['success'])
            self.assertIn(scenario['expected_message'], data['error']['message'])
            
            print(f"✅ Validation error correctly returned")
        
        print("\n✅ All invalid signup scenarios handled correctly")
    
    def test_03_user_signup_duplicate_credentials(self):
        """Test signup with duplicate username or email."""
        print("\n" + "="*70)
        print("TEST 3: User Signup with Duplicate Credentials")
        print("="*70)
        
        # Create first user
        first_user = User(
            username='existinguser',
            email='existing@test.com',
            role='staff',
            created_at=datetime.utcnow()
        )
        first_user.set_password('password123')
        first_user.save()
        
        # Test duplicate username
        print("\nAttempting signup with duplicate username...")
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps({
                'username': 'existinguser',
                'email': 'newemail@test.com',
                'password': 'password123'
            }),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 409)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('already exists', data['error']['message'])
        print(f"✅ Duplicate username rejected: {data['error']['message']}")
        
        # Test duplicate email
        print("\nAttempting signup with duplicate email...")
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps({
                'username': 'newuser',
                'email': 'existing@test.com',
                'password': 'password123'
            }),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 409)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('already exists', data['error']['message'])
        print(f"✅ Duplicate email rejected: {data['error']['message']}")
    
    # ========================================================================
    # Test 4: User Login with Valid Credentials
    # ========================================================================
    
    def test_04_user_login_with_valid_credentials(self):
        """Test user login with valid credentials."""
        print("\n" + "="*70)
        print("TEST 4: User Login with Valid Credentials")
        print("="*70)
        
        # Test login with username
        print("\nLogging in with username...")
        login_data = {
            'username': 'admin',
            'password': 'admin123'
        }
        
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        print(f"Status Code: {response.status_code}")
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Verify response structure
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertIn('access_token', data['data'])
        self.assertIn('user', data['data'])
        self.assertEqual(data['data']['user']['username'], 'admin')
        self.assertEqual(data['data']['user']['role'], 'admin')
        
        # Verify token is a non-empty string
        token = data['data']['access_token']
        self.assertIsInstance(token, str)
        self.assertGreater(len(token), 0)
        
        print(f"✅ Login successful with username")
        print(f"Token received: {token[:50]}...")
        
        # Test login with email
        print("\nLogging in with email...")
        login_data = {
            'username': 'admin@test.com',
            'password': 'admin123'
        }
        
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('access_token', data['data'])
        
        print(f"✅ Login successful with email")
    
    # ========================================================================
    # Test 5: User Login with Invalid Credentials
    # ========================================================================
    
    def test_05_user_login_with_invalid_credentials(self):
        """Test user login with invalid credentials."""
        print("\n" + "="*70)
        print("TEST 5: User Login with Invalid Credentials")
        print("="*70)
        
        invalid_scenarios = [
            {
                'name': 'Invalid username',
                'data': {'username': 'nonexistent', 'password': 'password123'},
                'expected_status': 401,
                'expected_message': 'Invalid username or password'
            },
            {
                'name': 'Invalid password',
                'data': {'username': 'admin', 'password': 'wrongpassword'},
                'expected_status': 401,
                'expected_message': 'Invalid username or password'
            },
            {
                'name': 'Missing username',
                'data': {'password': 'password123'},
                'expected_status': 400,
                'expected_message': 'Username and password are required'
            },
            {
                'name': 'Missing password',
                'data': {'username': 'admin'},
                'expected_status': 400,
                'expected_message': 'Username and password are required'
            },
            {
                'name': 'Empty credentials',
                'data': {},
                'expected_status': 400,
                'expected_message': 'Request body is required'
            }
        ]
        
        for scenario in invalid_scenarios:
            print(f"\nScenario: {scenario['name']}")
            print(f"Data: {scenario['data']}")
            
            response = self.client.post(
                '/api/auth/login',
                data=json.dumps(scenario['data']),
                content_type='application/json'
            )
            
            print(f"Status Code: {response.status_code}")
            data = json.loads(response.data)
            print(f"Error Message: {data.get('error', {}).get('message', 'N/A')}")
            
            self.assertEqual(response.status_code, scenario['expected_status'])
            self.assertFalse(data['success'])
            self.assertIn(scenario['expected_message'], data['error']['message'])
            
            print(f"✅ Error correctly returned")
        
        print("\n✅ All invalid login scenarios handled correctly")
    
    def test_06_login_inactive_user(self):
        """Test login with inactive user account."""
        print("\n" + "="*70)
        print("TEST 6: Login with Inactive User")
        print("="*70)
        
        # Create inactive user
        inactive_user = User(
            username='inactive',
            email='inactive@test.com',
            role='staff',
            is_active=False,
            created_at=datetime.utcnow()
        )
        inactive_user.set_password('password123')
        inactive_user.save()
        
        print("Attempting to login with inactive user...")
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'username': 'inactive',
                'password': 'password123'
            }),
            content_type='application/json'
        )
        
        print(f"Status Code: {response.status_code}")
        self.assertEqual(response.status_code, 401)
        
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        print(f"Error Message: {data['error']['message']}")
        print("✅ Inactive user login correctly rejected")
    
    # ========================================================================
    # Test 7: Admin Login and Dashboard Access
    # ========================================================================
    
    def test_07_admin_login_and_dashboard_access(self):
        """Test admin login and access to admin-only endpoints."""
        print("\n" + "="*70)
        print("TEST 7: Admin Login and Dashboard Access")
        print("="*70)
        
        # Step 1: Admin login
        print("\nStep 1: Admin login...")
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'username': 'admin',
                'password': 'admin123'
            }),
            content_type='application/json'
        )
        
        self.assertEqual(login_response.status_code, 200)
        login_data = json.loads(login_response.data)
        admin_token = login_data['data']['access_token']
        
        print(f"✅ Admin logged in successfully")
        print(f"Token: {admin_token[:50]}...")
        print(f"User: {login_data['data']['user']['username']}")
        print(f"Role: {login_data['data']['user']['role']}")
        
        # Step 2: Access /auth/me endpoint
        print("\nStep 2: Accessing /auth/me endpoint...")
        me_response = self.client.get(
            '/api/auth/me',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        self.assertEqual(me_response.status_code, 200)
        me_data = json.loads(me_response.data)
        self.assertTrue(me_data['success'])
        self.assertEqual(me_data['data']['username'], 'admin')
        self.assertEqual(me_data['data']['role'], 'admin')
        
        print(f"✅ Successfully accessed /auth/me")
        print(f"User data: {json.dumps(me_data['data'], indent=2)}")
        
        # Step 3: Access admin products endpoint
        print("\nStep 3: Accessing admin products endpoint...")
        products_response = self.client.get(
            '/api/products/admin',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        self.assertEqual(products_response.status_code, 200)
        products_data = json.loads(products_response.data)
        self.assertTrue(products_data['success'])
        
        print(f"✅ Successfully accessed /products/admin")
        print(f"Products count: {len(products_data['data'])}")
        
        # Step 4: Verify staff user cannot access admin endpoints
        print("\nStep 4: Verifying staff user cannot access admin endpoints...")
        
        # Create staff user
        staff_user = User(
            username='staff',
            email='staff@test.com',
            role='staff',
            is_active=True,
            created_at=datetime.utcnow()
        )
        staff_user.set_password('staff123')
        staff_user.save()
        
        # Login as staff
        staff_login = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'username': 'staff',
                'password': 'staff123'
            }),
            content_type='application/json'
        )
        
        staff_token = json.loads(staff_login.data)['data']['access_token']
        
        # Try to access admin endpoint
        staff_products = self.client.get(
            '/api/products/admin',
            headers={'Authorization': f'Bearer {staff_token}'}
        )
        
        # Staff users are not allowed to access admin products endpoint
        self.assertEqual(staff_products.status_code, 403)
        staff_data = json.loads(staff_products.data)
        self.assertFalse(staff_data['success'])
        print(f"✅ Staff user correctly denied access to admin products")
        
        # Try to register new user (admin only)
        staff_register = self.client.post(
            '/api/auth/register',
            data=json.dumps({
                'username': 'newuser',
                'email': 'new@test.com',
                'password': 'password123'
            }),
            content_type='application/json',
            headers={'Authorization': f'Bearer {staff_token}'}
        )
        
        self.assertEqual(staff_register.status_code, 403)
        register_data = json.loads(staff_register.data)
        self.assertFalse(register_data['success'])
        self.assertIn('Admin access required', register_data['error']['message'])
        
        print(f"✅ Staff user correctly denied access to admin-only registration")
        
        print("\n✅ Admin authentication and authorization working correctly")
    
    # ========================================================================
    # Test 8: Session Persistence Across Requests
    # ========================================================================
    
    def test_08_session_persistence_across_requests(self):
        """Test that JWT token persists across multiple requests."""
        print("\n" + "="*70)
        print("TEST 8: Session Persistence Across Requests")
        print("="*70)
        
        # Step 1: Login
        print("\nStep 1: Initial login...")
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'username': 'admin',
                'password': 'admin123'
            }),
            content_type='application/json'
        )
        
        self.assertEqual(login_response.status_code, 200)
        token = json.loads(login_response.data)['data']['access_token']
        print(f"✅ Login successful, token received")
        
        # Step 2: Make multiple authenticated requests
        print("\nStep 2: Making multiple authenticated requests...")
        
        endpoints = [
            '/api/auth/me',
            '/api/products/admin',
            '/api/auth/me',  # Request same endpoint again
            '/api/products/admin'  # Request same endpoint again
        ]
        
        for i, endpoint in enumerate(endpoints, 1):
            print(f"\nRequest {i}: GET {endpoint}")
            response = self.client.get(
                endpoint,
                headers={'Authorization': f'Bearer {token}'}
            )
            
            print(f"Status Code: {response.status_code}")
            self.assertEqual(response.status_code, 200)
            
            data = json.loads(response.data)
            self.assertTrue(data['success'])
            print(f"✅ Request successful")
        
        print("\n✅ Token persisted across all requests")
        
        # Step 3: Verify token still works after some time
        print("\nStep 3: Verifying token still valid...")
        final_response = self.client.get(
            '/api/auth/me',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        self.assertEqual(final_response.status_code, 200)
        final_data = json.loads(final_response.data)
        self.assertTrue(final_data['success'])
        self.assertEqual(final_data['data']['username'], 'admin')
        
        print(f"✅ Token still valid")
        print(f"User: {final_data['data']['username']}")
        print(f"Role: {final_data['data']['role']}")
        
        print("\n✅ Session persistence verified successfully")
    
    def test_09_invalid_token_handling(self):
        """Test handling of invalid or missing tokens."""
        print("\n" + "="*70)
        print("TEST 9: Invalid Token Handling")
        print("="*70)
        
        # Test 1: No token
        print("\nTest 1: Request without token...")
        response = self.client.get('/api/auth/me')
        self.assertEqual(response.status_code, 401)
        print("✅ Request without token correctly rejected")
        
        # Test 2: Invalid token
        print("\nTest 2: Request with invalid token...")
        response = self.client.get(
            '/api/auth/me',
            headers={'Authorization': 'Bearer invalid_token_here'}
        )
        # Invalid token returns 401 instead of 422
        self.assertEqual(response.status_code, 401)
        print("✅ Request with invalid token correctly rejected")
        
        # Test 3: Malformed Authorization header
        print("\nTest 3: Request with malformed Authorization header...")
        response = self.client.get(
            '/api/auth/me',
            headers={'Authorization': 'InvalidFormat'}
        )
        self.assertEqual(response.status_code, 401)
        print("✅ Request with malformed header correctly rejected")
        
        print("\n✅ All invalid token scenarios handled correctly")
    
    # ========================================================================
    # Test 10: Complete User Journey
    # ========================================================================
    
    def test_10_complete_user_journey(self):
        """Test complete user journey from signup to authenticated access."""
        print("\n" + "="*70)
        print("TEST 10: Complete User Journey")
        print("="*70)
        
        # Step 1: User signs up
        print("\nStep 1: User signs up...")
        signup_response = self.client.post(
            '/api/auth/signup',
            data=json.dumps({
                'username': 'journeyuser',
                'email': 'journey@test.com',
                'password': 'password123'
            }),
            content_type='application/json'
        )
        
        self.assertEqual(signup_response.status_code, 201)
        signup_data = json.loads(signup_response.data)
        self.assertTrue(signup_data['success'])
        print(f"✅ User signed up: {signup_data['data']['username']}")
        
        # Step 2: User logs in
        print("\nStep 2: User logs in...")
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'username': 'journeyuser',
                'password': 'password123'
            }),
            content_type='application/json'
        )
        
        self.assertEqual(login_response.status_code, 200)
        login_data = json.loads(login_response.data)
        token = login_data['data']['access_token']
        print(f"✅ User logged in successfully")
        
        # Step 3: User accesses their profile
        print("\nStep 3: User accesses profile...")
        me_response = self.client.get(
            '/api/auth/me',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        self.assertEqual(me_response.status_code, 200)
        me_data = json.loads(me_response.data)
        self.assertEqual(me_data['data']['username'], 'journeyuser')
        self.assertEqual(me_data['data']['role'], 'staff')
        print(f"✅ User profile accessed")
        print(f"Username: {me_data['data']['username']}")
        print(f"Email: {me_data['data']['email']}")
        print(f"Role: {me_data['data']['role']}")
        
        # Step 4: User makes multiple authenticated requests
        print("\nStep 4: User makes multiple authenticated requests...")
        for i in range(3):
            response = self.client.get(
                '/api/auth/me',
                headers={'Authorization': f'Bearer {token}'}
            )
            self.assertEqual(response.status_code, 200)
            print(f"  Request {i+1}: ✅")
        
        print("\n✅ Complete user journey successful")


def run_tests():
    """Run all tests with detailed output."""
    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(TestCompleteAuthFlow)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.wasSuccessful():
        print("\n✅ ALL TESTS PASSED!")
    else:
        print("\n❌ SOME TESTS FAILED")
    
    print("="*70)
    
    return result


if __name__ == '__main__':
    run_tests()
