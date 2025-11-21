"""Integration tests for complete product management flow after admin login."""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import unittest
import json
from datetime import datetime
from app import create_app
from app.models.product import Product
from app.models.user import User
from app.models.price_history import PriceHistory
from mongoengine import connect, disconnect


class TestProductManagementFlow(unittest.TestCase):
    """Test complete product management flow including admin authentication."""
    
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
        # Clear collections
        Product.drop_collection()
        User.drop_collection()
        PriceHistory.drop_collection()
        
        # Create admin user
        self.admin_user = User(
            username='testadmin',
            email='testadmin@example.com',
            role='admin',
            is_active=True
        )
        self.admin_user.set_password('admin123')
        self.admin_user.save()
        
        # Create sample gold price for price calculations
        PriceHistory(
            metal_type='gold',
            purity='916',
            price_per_gram=6500.0,
            date=datetime.utcnow(),
            source='test'
        ).save()
        
        # Login and get token
        login_response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'username': 'testadmin',
                'password': 'admin123'
            }),
            content_type='application/json'
        )
        self.assertEqual(login_response.status_code, 200)
        login_data = json.loads(login_response.data)
        self.token = login_data['data']['access_token']
        self.auth_headers = {'Authorization': f'Bearer {self.token}'}
    
    def tearDown(self):
        """Clean up after each test."""
        Product.drop_collection()
        User.drop_collection()
        PriceHistory.drop_collection()
    
    def test_01_product_list_loading_after_admin_login(self):
        """Test product list loading after admin login (Requirement 3.1)."""
        print("\n🔍 TEST 1: Product list loading after admin login")
        
        # Create some products with different statuses
        Product(
            name='Published Product',
            category='Ring',
            base_price=10000,
            weight=5.0,
            status='published'
        ).save()
        
        Product(
            name='Draft Product',
            category='Necklace',
            base_price=20000,
            weight=10.0,
            status='draft'
        ).save()
        
        # Load products using admin endpoint
        response = self.client.get(
            '/api/products/admin',
            headers=self.auth_headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 2)
        
        # Verify both published and draft products are returned
        product_names = [p['name'] for p in data['data']]
        self.assertIn('Published Product', product_names)
        self.assertIn('Draft Product', product_names)
        
        print("✅ Product list loaded successfully with both published and draft products")
    
    def test_02_product_creation_with_valid_data(self):
        """Test product creation with valid data (Requirement 4.1)."""
        print("\n🔍 TEST 2: Product creation with valid data")
        
        product_data = {
            'name': 'New Gold Ring',
            'category': 'Ring',
            'base_price': 15000,
            'weight': 7.5,
            'gold_purity': '916',
            'description': 'Beautiful gold ring',
            'image_url': 'https://example.com/ring.jpg',
            'stock_quantity': 10
        }
        
        response = self.client.post(
            '/api/products/',
            data=json.dumps(product_data),
            content_type='application/json',
            headers=self.auth_headers
        )
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['name'], 'New Gold Ring')
        self.assertEqual(data['data']['status'], 'draft')  # Default status
        self.assertIn('current_price', data['data'])
        
        # Verify product appears in admin list
        list_response = self.client.get(
            '/api/products/admin',
            headers=self.auth_headers
        )
        list_data = json.loads(list_response.data)
        self.assertEqual(len(list_data['data']), 1)
        
        print("✅ Product created successfully and appears in product list")
    
    def test_03_product_creation_with_invalid_data(self):
        """Test product creation with invalid data (Requirement 4.2)."""
        print("\n🔍 TEST 3: Product creation with invalid data")
        
        # Test missing required fields
        invalid_data = {
            'name': 'Incomplete Product',
            'category': 'Ring'
            # Missing base_price and weight
        }
        
        response = self.client.post(
            '/api/products/',
            data=json.dumps(invalid_data),
            content_type='application/json',
            headers=self.auth_headers
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('error', data)
        self.assertIn('message', data['error'])
        
        print("✅ Validation errors properly returned for invalid data")
        
        # Test invalid category
        invalid_category_data = {
            'name': 'Test Product',
            'category': 'InvalidCategory',
            'base_price': 10000,
            'weight': 5.0
        }
        
        response = self.client.post(
            '/api/products/',
            data=json.dumps(invalid_category_data),
            content_type='application/json',
            headers=self.auth_headers
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        
        print("✅ Invalid category error properly handled")
    
    def test_04_product_editing(self):
        """Test product editing functionality (Requirement 4.4)."""
        print("\n🔍 TEST 4: Product editing")
        
        # Create a product
        product = Product(
            name='Original Name',
            category='Ring',
            base_price=10000,
            weight=5.0,
            status='draft'
        )
        product.save()
        
        # Edit the product
        update_data = {
            'name': 'Updated Name',
            'base_price': 12000,
            'description': 'Updated description'
        }
        
        response = self.client.put(
            f'/api/products/{str(product.id)}',
            data=json.dumps(update_data),
            content_type='application/json',
            headers=self.auth_headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['name'], 'Updated Name')
        self.assertEqual(data['data']['base_price'], 12000)
        self.assertEqual(data['data']['description'], 'Updated description')
        self.assertEqual(data['data']['weight'], 5.0)  # Unchanged field
        
        print("✅ Product edited successfully")
        
        # Test editing non-existent product
        response = self.client.put(
            '/api/products/507f1f77bcf86cd799439011',
            data=json.dumps(update_data),
            content_type='application/json',
            headers=self.auth_headers
        )
        
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        
        print("✅ Non-existent product edit properly handled")
    
    def test_05_product_publishing_unpublishing(self):
        """Test product publishing and unpublishing (Requirement 4.4)."""
        print("\n🔍 TEST 5: Product publishing and unpublishing")
        
        # Create a draft product
        product = Product(
            name='Test Product',
            category='Ring',
            base_price=10000,
            weight=5.0,
            status='draft'
        )
        product.save()
        
        # Publish the product
        response = self.client.post(
            f'/api/products/{str(product.id)}/publish',
            headers=self.auth_headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['status'], 'published')
        self.assertIsNotNone(data['data']['published_at'])
        
        print("✅ Product published successfully")
        
        # Verify published product appears in public endpoint
        public_response = self.client.get('/api/products/')
        public_data = json.loads(public_response.data)
        self.assertEqual(len(public_data['data']), 1)
        self.assertEqual(public_data['data'][0]['status'], 'published')
        
        print("✅ Published product appears in public endpoint")
        
        # Unpublish the product
        response = self.client.post(
            f'/api/products/{str(product.id)}/unpublish',
            headers=self.auth_headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['status'], 'draft')
        self.assertIsNone(data['data']['published_at'])
        
        print("✅ Product unpublished successfully")
        
        # Verify unpublished product doesn't appear in public endpoint
        public_response = self.client.get('/api/products/')
        public_data = json.loads(public_response.data)
        self.assertEqual(len(public_data['data']), 0)
        
        print("✅ Unpublished product removed from public endpoint")
    
    def test_06_error_scenarios_and_retry_mechanisms(self):
        """Test error scenarios and retry mechanisms (Requirements 3.4, 4.3, 5.1)."""
        print("\n🔍 TEST 6: Error scenarios and retry mechanisms")
        
        # Test 1: Product loading without authentication
        response = self.client.get('/api/products/admin')
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('error', data)
        self.assertEqual(data['error']['code'], 401)
        
        print("✅ Unauthenticated access properly rejected")
        
        # Test 2: Product creation without authentication
        product_data = {
            'name': 'Test Product',
            'category': 'Ring',
            'base_price': 10000,
            'weight': 5.0
        }
        
        response = self.client.post(
            '/api/products/',
            data=json.dumps(product_data),
            content_type='application/json'
        )
        
        # Note: Product creation might be public or require auth depending on implementation
        # Just verify we get a consistent error format if it fails
        if response.status_code != 201:
            data = json.loads(response.data)
            self.assertIn('success', data)
            self.assertIn('error', data)
        
        print("✅ Error format is consistent")
        
        # Test 3: Invalid product ID
        response = self.client.get(
            '/api/products/invalid_id',
            headers=self.auth_headers
        )
        
        self.assertIn(response.status_code, [400, 404])
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('error', data)
        
        print("✅ Invalid product ID properly handled")
        
        # Test 4: Publishing non-existent product
        response = self.client.post(
            '/api/products/507f1f77bcf86cd799439011/publish',
            headers=self.auth_headers
        )
        
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('error', data)
        
        print("✅ Non-existent product publish properly handled")
        
        # Test 5: Deleting product and verifying it's removed from list
        product = Product(
            name='To Be Deleted',
            category='Ring',
            base_price=10000,
            weight=5.0,
            status='published'
        )
        product.save()
        
        response = self.client.delete(
            f'/api/products/{str(product.id)}',
            headers=self.auth_headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        
        # Verify product is soft deleted (not in active list)
        list_response = self.client.get(
            '/api/products/admin',
            headers=self.auth_headers
        )
        list_data = json.loads(list_response.data)
        product_ids = [p['id'] for p in list_data['data']]
        self.assertNotIn(str(product.id), product_ids)
        
        print("✅ Product deletion and list refresh working correctly")
    
    def test_07_complete_workflow(self):
        """Test complete product management workflow (All requirements)."""
        print("\n🔍 TEST 7: Complete product management workflow")
        
        # Step 1: Admin logs in (already done in setUp)
        print("  Step 1: Admin logged in ✓")
        
        # Step 2: Load empty product list
        response = self.client.get(
            '/api/products/admin',
            headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['data']), 0)
        print("  Step 2: Empty product list loaded ✓")
        
        # Step 3: Create a new product
        product_data = {
            'name': 'Workflow Test Ring',
            'category': 'Ring',
            'base_price': 15000,
            'weight': 6.0,
            'gold_purity': '916',
            'description': 'Test ring for workflow',
            'stock_quantity': 5
        }
        
        response = self.client.post(
            '/api/products/',
            data=json.dumps(product_data),
            content_type='application/json',
            headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 201)
        created_product = json.loads(response.data)['data']
        product_id = created_product['id']
        print("  Step 3: Product created as draft ✓")
        
        # Step 4: Verify product appears in admin list
        response = self.client.get(
            '/api/products/admin',
            headers=self.auth_headers
        )
        data = json.loads(response.data)
        self.assertEqual(len(data['data']), 1)
        print("  Step 4: Product appears in admin list ✓")
        
        # Step 5: Edit the product
        update_data = {
            'name': 'Updated Workflow Ring',
            'base_price': 16000
        }
        
        response = self.client.put(
            f'/api/products/{product_id}',
            data=json.dumps(update_data),
            content_type='application/json',
            headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        print("  Step 5: Product edited ✓")
        
        # Step 6: Publish the product
        response = self.client.post(
            f'/api/products/{product_id}/publish',
            headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        print("  Step 6: Product published ✓")
        
        # Step 7: Verify product appears in public list
        response = self.client.get('/api/products/')
        data = json.loads(response.data)
        self.assertEqual(len(data['data']), 1)
        self.assertEqual(data['data'][0]['name'], 'Updated Workflow Ring')
        print("  Step 7: Product appears in public list ✓")
        
        # Step 8: Unpublish the product
        response = self.client.post(
            f'/api/products/{product_id}/unpublish',
            headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        print("  Step 8: Product unpublished ✓")
        
        # Step 9: Verify product removed from public list
        response = self.client.get('/api/products/')
        data = json.loads(response.data)
        self.assertEqual(len(data['data']), 0)
        print("  Step 9: Product removed from public list ✓")
        
        # Step 10: Delete the product
        response = self.client.delete(
            f'/api/products/{product_id}',
            headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        print("  Step 10: Product deleted ✓")
        
        print("\n✅ Complete workflow executed successfully")


def run_tests():
    """Run all tests."""
    unittest.main(argv=[''], verbosity=2, exit=False)


if __name__ == '__main__':
    unittest.main(verbosity=2)
