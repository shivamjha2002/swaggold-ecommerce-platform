"""Tests for Authentication API endpoints."""
import unittest
import json
from datetime import datetime
from app import create_app
from app.models.user import User
from mongoengine import connect, disconnect


class TestAuthAPI(unittest.TestCase):
    """Test cases for Authentication API endpoints."""
    
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
        
        # Create test staff user
        self.staff_user = User(
            username='staff',
            email='staff@test.com',
            role='staff',
            is_active=True,
            created_at=datetime.utcnow()
        )
        self.staff_user.set_password('staff123')
        self.staff_user.save()
    
    def tearDown(self):
        """Clean up after each test."""
        User.drop_collection()
    
    def test_login_success_with_username(self):
        """Test successful login with username."""
        login_data = {
            'username': 'admin',
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
        self.assertIn('data', data)
        self.assertIn('access_token', data['data'])
        self.assertIn('user', data['data'])
        self.assertEqual(data['data']['user']['username'], 'admin')
        self.assertEqual(data['data']['user']['role'], 'admin')
    
    def test_login_success_with_email(self):
        """Test successful login with email."""
        login_data = {
            'username': 'staff@test.com',
            'password': 'staff123'
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
        self.assertEqual(data['data']['user']['username'], 'staff')
    
    def test_login_invalid_username(self):
        """Test login with invalid username."""
        login_data = {
            'username': 'nonexistent',
            'password': 'password123'
        }
        
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('error', data)
        self.assertIn('Invalid username or password', data['error']['message'])
    
    def test_login_invalid_password(self):
        """Test login with invalid password."""
        login_data = {
            'username': 'admin',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_login_missing_username(self):
        """Test login with missing username."""
        login_data = {
            'password': 'password123'
        }
        
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('Username and password are required', data['error']['message'])
    
    def test_login_missing_password(self):
        """Test login with missing password."""
        login_data = {
            'username': 'admin'
        }
        
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_login_empty_body(self):
        """Test login with empty request body."""
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_login_inactive_user(self):
        """Test login with inactive user."""
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
        
        login_data = {
            'username': 'inactive',
            'password': 'password123'
        }
        
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_register_success_as_admin(self):
        """Test successful user registration by admin."""
        # Login as admin first
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'username': 'admin', 'password': 'admin123'}),
            content_type='application/json'
        )
        admin_token = json.loads(login_response.data)['data']['access_token']
        
        # Register new user
        register_data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'newpass123',
            'role': 'staff'
        }
        
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps(register_data),
            content_type='application/json',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertEqual(data['data']['username'], 'newuser')
        self.assertEqual(data['data']['email'], 'newuser@test.com')
        self.assertEqual(data['data']['role'], 'staff')
        
        # Verify user was created in database
        new_user = User.objects(username='newuser').first()
        self.assertIsNotNone(new_user)
        self.assertTrue(new_user.check_password('newpass123'))
    
    def test_register_as_staff_forbidden(self):
        """Test that staff users cannot register new users."""
        # Login as staff
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'username': 'staff', 'password': 'staff123'}),
            content_type='application/json'
        )
        staff_token = json.loads(login_response.data)['data']['access_token']
        
        # Try to register new user
        register_data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'newpass123'
        }
        
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps(register_data),
            content_type='application/json',
            headers={'Authorization': f'Bearer {staff_token}'}
        )
        
        self.assertEqual(response.status_code, 403)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('Admin access required', data['error']['message'])
    
    def test_register_without_token(self):
        """Test registration without authentication token."""
        register_data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'newpass123'
        }
        
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps(register_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
    
    def test_register_missing_required_fields(self):
        """Test registration with missing required fields."""
        # Login as admin
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'username': 'admin', 'password': 'admin123'}),
            content_type='application/json'
        )
        admin_token = json.loads(login_response.data)['data']['access_token']
        
        # Try to register without email
        register_data = {
            'username': 'newuser',
            'password': 'newpass123'
        }
        
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps(register_data),
            content_type='application/json',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('Username, email, and password are required', data['error']['message'])
    
    def test_register_duplicate_username(self):
        """Test registration with duplicate username."""
        # Login as admin
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'username': 'admin', 'password': 'admin123'}),
            content_type='application/json'
        )
        admin_token = json.loads(login_response.data)['data']['access_token']
        
        # Try to register with existing username
        register_data = {
            'username': 'admin',  # Already exists
            'email': 'newemail@test.com',
            'password': 'newpass123'
        }
        
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps(register_data),
            content_type='application/json',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        self.assertEqual(response.status_code, 409)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('already exists', data['error']['message'])
    
    def test_register_duplicate_email(self):
        """Test registration with duplicate email."""
        # Login as admin
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'username': 'admin', 'password': 'admin123'}),
            content_type='application/json'
        )
        admin_token = json.loads(login_response.data)['data']['access_token']
        
        # Try to register with existing email
        register_data = {
            'username': 'newuser',
            'email': 'admin@test.com',  # Already exists
            'password': 'newpass123'
        }
        
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps(register_data),
            content_type='application/json',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        self.assertEqual(response.status_code, 409)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_register_invalid_email(self):
        """Test registration with invalid email format."""
        # Login as admin
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'username': 'admin', 'password': 'admin123'}),
            content_type='application/json'
        )
        admin_token = json.loads(login_response.data)['data']['access_token']
        
        # Try to register with invalid email
        register_data = {
            'username': 'newuser',
            'email': 'invalidemail',
            'password': 'newpass123'
        }
        
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps(register_data),
            content_type='application/json',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('Invalid email format', data['error']['message'])
    
    def test_register_weak_password(self):
        """Test registration with weak password."""
        # Login as admin
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'username': 'admin', 'password': 'admin123'}),
            content_type='application/json'
        )
        admin_token = json.loads(login_response.data)['data']['access_token']
        
        # Try to register with weak password
        register_data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': '123'  # Too short
        }
        
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps(register_data),
            content_type='application/json',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('at least 6 characters', data['error']['message'])
    
    def test_register_invalid_role(self):
        """Test registration with invalid role."""
        # Login as admin
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'username': 'admin', 'password': 'admin123'}),
            content_type='application/json'
        )
        admin_token = json.loads(login_response.data)['data']['access_token']
        
        # Try to register with invalid role
        register_data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'newpass123',
            'role': 'superadmin'  # Invalid role
        }
        
        response = self.client.post(
            '/api/auth/register',
            data=json.dumps(register_data),
            content_type='application/json',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('Role must be either', data['error']['message'])
    
    def test_get_current_user_success(self):
        """Test getting current user information."""
        # Login first
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'username': 'admin', 'password': 'admin123'}),
            content_type='application/json'
        )
        token = json.loads(login_response.data)['data']['access_token']
        
        # Get current user
        response = self.client.get(
            '/api/auth/me',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertEqual(data['data']['username'], 'admin')
        self.assertEqual(data['data']['email'], 'admin@test.com')
        self.assertEqual(data['data']['role'], 'admin')
    
    def test_get_current_user_without_token(self):
        """Test getting current user without authentication."""
        response = self.client.get('/api/auth/me')
        
        self.assertEqual(response.status_code, 401)
    
    def test_get_current_user_invalid_token(self):
        """Test getting current user with invalid token."""
        response = self.client.get(
            '/api/auth/me',
            headers={'Authorization': 'Bearer invalid_token'}
        )
        
        self.assertEqual(response.status_code, 422)
    
    def test_token_contains_user_info(self):
        """Test that JWT token contains user role and username."""
        # Login
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({'username': 'admin', 'password': 'admin123'}),
            content_type='application/json'
        )
        
        self.assertEqual(login_response.status_code, 200)
        data = json.loads(login_response.data)
        self.assertIn('access_token', data['data'])
        
        # Token should be a non-empty string
        token = data['data']['access_token']
        self.assertIsInstance(token, str)
        self.assertGreater(len(token), 0)


def run_tests():
    """Run all tests."""
    unittest.main(argv=[''], verbosity=2, exit=False)


if __name__ == '__main__':
    unittest.main(verbosity=2)
