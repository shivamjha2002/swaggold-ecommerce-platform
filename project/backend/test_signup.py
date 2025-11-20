"""Tests for public signup endpoint."""
import unittest
import json
from datetime import datetime
from app import create_app
from app.models.user import User


class TestSignupAPI(unittest.TestCase):
    """Test cases for public signup endpoint."""
    
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
    
    def tearDown(self):
        """Clean up after each test."""
        User.drop_collection()
    
    def test_signup_success(self):
        """Test successful public signup."""
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
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertEqual(data['data']['username'], 'newuser')
        self.assertEqual(data['data']['email'], 'newuser@test.com')
        self.assertEqual(data['data']['role'], 'staff')  # Default role
        self.assertIn('message', data)
        
        # Verify user was created in database
        new_user = User.objects(username='newuser').first()
        self.assertIsNotNone(new_user)
        self.assertTrue(new_user.check_password('password123'))
        self.assertEqual(new_user.role, 'staff')
    
    def test_signup_missing_username(self):
        """Test signup with missing username."""
        signup_data = {
            'email': 'test@test.com',
            'password': 'password123'
        }
        
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('Username, email, and password are required', data['error']['message'])
    
    def test_signup_missing_email(self):
        """Test signup with missing email."""
        signup_data = {
            'username': 'testuser',
            'password': 'password123'
        }
        
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('Username, email, and password are required', data['error']['message'])
    
    def test_signup_missing_password(self):
        """Test signup with missing password."""
        signup_data = {
            'username': 'testuser',
            'email': 'test@test.com'
        }
        
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_signup_invalid_email(self):
        """Test signup with invalid email format."""
        signup_data = {
            'username': 'testuser',
            'email': 'invalidemail',
            'password': 'password123'
        }
        
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('Invalid email format', data['error']['message'])
    
    def test_signup_short_password(self):
        """Test signup with password too short."""
        signup_data = {
            'username': 'testuser',
            'email': 'test@test.com',
            'password': '12345'  # Only 5 characters
        }
        
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('at least 6 characters', data['error']['message'])
    
    def test_signup_short_username(self):
        """Test signup with username too short."""
        signup_data = {
            'username': 'ab',  # Only 2 characters
            'email': 'test@test.com',
            'password': 'password123'
        }
        
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('between 3 and 80 characters', data['error']['message'])
    
    def test_signup_invalid_username_characters(self):
        """Test signup with invalid characters in username."""
        signup_data = {
            'username': 'test@user',  # Contains @
            'email': 'test@test.com',
            'password': 'password123'
        }
        
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('letters, numbers, and underscores', data['error']['message'])
    
    def test_signup_duplicate_username(self):
        """Test signup with duplicate username."""
        # Create first user
        user = User(
            username='existinguser',
            email='existing@test.com',
            role='staff',
            created_at=datetime.utcnow()
        )
        user.set_password('password123')
        user.save()
        
        # Try to signup with same username
        signup_data = {
            'username': 'existinguser',
            'email': 'newemail@test.com',
            'password': 'password123'
        }
        
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 409)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('already exists', data['error']['message'])
    
    def test_signup_duplicate_email(self):
        """Test signup with duplicate email."""
        # Create first user
        user = User(
            username='existinguser',
            email='existing@test.com',
            role='staff',
            created_at=datetime.utcnow()
        )
        user.set_password('password123')
        user.save()
        
        # Try to signup with same email
        signup_data = {
            'username': 'newuser',
            'email': 'existing@test.com',
            'password': 'password123'
        }
        
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 409)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('already exists', data['error']['message'])
    
    def test_signup_email_case_insensitive(self):
        """Test that email is stored in lowercase."""
        signup_data = {
            'username': 'testuser',
            'email': 'Test@Example.COM',
            'password': 'password123'
        }
        
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertEqual(data['data']['email'], 'test@example.com')
        
        # Verify in database
        user = User.objects(username='testuser').first()
        self.assertEqual(user.email, 'test@example.com')
    
    def test_signup_username_trimmed(self):
        """Test that username is trimmed of whitespace."""
        signup_data = {
            'username': '  testuser  ',
            'email': 'test@test.com',
            'password': 'password123'
        }
        
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertEqual(data['data']['username'], 'testuser')
    
    def test_signup_no_jwt_required(self):
        """Test that signup does not require JWT authentication."""
        signup_data = {
            'username': 'publicuser',
            'email': 'public@test.com',
            'password': 'password123'
        }
        
        # Make request without Authorization header
        response = self.client.post(
            '/api/auth/signup',
            data=json.dumps(signup_data),
            content_type='application/json'
        )
        
        # Should succeed without authentication
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
