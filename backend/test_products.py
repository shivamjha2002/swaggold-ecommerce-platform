"""Tests for Product API endpoints."""
import unittest
import json
from datetime import datetime
from app import create_app
from app.models.product import Product
from app.models.price_history import PriceHistory
from mongoengine import connect, disconnect


class TestProductAPI(unittest.TestCase):
    """Test cases for Product API endpoints."""
    
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
        # Clear products collection
        Product.drop_collection()
        
        # Create sample gold price for price calculations
        PriceHistory.drop_collection()
        PriceHistory(
            metal_type='gold',
            purity='916',
            price_per_gram=6500.0,
            date=datetime.utcnow(),
            source='test'
        ).save()
    
    def tearDown(self):
        """Clean up after each test."""
        Product.drop_collection()
        PriceHistory.drop_collection()
    
    def test_create_product_success(self):
        """Test creating a product successfully."""
        product_data = {
            'name': 'Test Gold Necklace',
            'category': 'Necklace',
            'base_price': 50000,
            'weight': 10.5,
            'gold_purity': '916',
            'description': 'Beautiful gold necklace',
            'image_url': 'https://example.com/image.jpg',
            'stock_quantity': 5
        }
        
        response = self.client.post(
            '/api/products/',
            data=json.dumps(product_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertEqual(data['data']['name'], 'Test Gold Necklace')
        self.assertEqual(data['data']['category'], 'Necklace')
        self.assertEqual(data['data']['status'], 'draft')  # Verify default status
        self.assertIn('current_price', data['data'])
    
    def test_create_product_missing_required_field(self):
        """Test creating a product with missing required field."""
        product_data = {
            'name': 'Test Product',
            'category': 'Ring'
            # Missing base_price and weight
        }
        
        response = self.client.post(
            '/api/products/',
            data=json.dumps(product_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('error', data)
    
    def test_create_product_invalid_category(self):
        """Test creating a product with invalid category."""
        product_data = {
            'name': 'Test Product',
            'category': 'InvalidCategory',
            'base_price': 10000,
            'weight': 5.0
        }
        
        response = self.client.post(
            '/api/products/',
            data=json.dumps(product_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_get_products_empty(self):
        """Test getting products when none exist."""
        response = self.client.get('/api/products/')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 0)
        self.assertIn('pagination', data)
    
    def test_get_products_with_pagination(self):
        """Test getting products with pagination."""
        # Create multiple products (published so they appear in public endpoint)
        for i in range(5):
            Product(
                name=f'Product {i}',
                category='Ring',
                base_price=10000 + i * 1000,
                weight=5.0 + i,
                status='published'
            ).save()
        
        # Get first page
        response = self.client.get('/api/products/?page=1&per_page=2')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 2)
        self.assertEqual(data['pagination']['total'], 5)
        self.assertEqual(data['pagination']['total_pages'], 3)
        self.assertTrue(data['pagination']['has_next'])
        self.assertFalse(data['pagination']['has_prev'])
    
    def test_get_products_with_category_filter(self):
        """Test filtering products by category."""
        # Create products with different categories (published)
        Product(name='Ring 1', category='Ring', base_price=10000, weight=5.0, status='published').save()
        Product(name='Necklace 1', category='Necklace', base_price=20000, weight=10.0, status='published').save()
        Product(name='Ring 2', category='Ring', base_price=15000, weight=6.0, status='published').save()
        
        response = self.client.get('/api/products/?category=Ring')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 2)
        for product in data['data']:
            self.assertEqual(product['category'], 'Ring')
    
    def test_get_products_with_price_filter(self):
        """Test filtering products by price range."""
        Product(name='Cheap Ring', category='Ring', base_price=5000, weight=3.0, status='published').save()
        Product(name='Mid Ring', category='Ring', base_price=15000, weight=6.0, status='published').save()
        Product(name='Expensive Ring', category='Ring', base_price=50000, weight=15.0, status='published').save()
        
        response = self.client.get('/api/products/?min_price=10000&max_price=20000')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 1)
        self.assertEqual(data['data'][0]['name'], 'Mid Ring')
    
    def test_get_products_with_weight_filter(self):
        """Test filtering products by weight range."""
        Product(name='Light Ring', category='Ring', base_price=5000, weight=2.0, status='published').save()
        Product(name='Medium Ring', category='Ring', base_price=10000, weight=5.0, status='published').save()
        Product(name='Heavy Ring', category='Ring', base_price=20000, weight=10.0, status='published').save()
        
        response = self.client.get('/api/products/?min_weight=4.0&max_weight=7.0')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 1)
        self.assertEqual(data['data'][0]['name'], 'Medium Ring')
    
    def test_get_products_with_search(self):
        """Test searching products by name."""
        Product(name='Gold Necklace', category='Necklace', base_price=20000, weight=10.0, status='published').save()
        Product(name='Silver Ring', category='Ring', base_price=5000, weight=3.0, status='published').save()
        Product(name='Gold Ring', category='Ring', base_price=15000, weight=6.0, status='published').save()
        
        response = self.client.get('/api/products/?search=Gold')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 2)
        for product in data['data']:
            self.assertIn('Gold', product['name'])
    
    def test_get_product_by_id_success(self):
        """Test getting a product by ID."""
        product = Product(
            name='Test Ring',
            category='Ring',
            base_price=10000,
            weight=5.0,
            status='published'
        )
        product.save()
        
        response = self.client.get(f'/api/products/{str(product.id)}')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['name'], 'Test Ring')
        self.assertIn('current_price', data['data'])
    
    def test_get_product_by_id_not_found(self):
        """Test getting a non-existent product."""
        response = self.client.get('/api/products/507f1f77bcf86cd799439011')
        
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_update_product_success(self):
        """Test updating a product."""
        product = Product(
            name='Old Name',
            category='Ring',
            base_price=10000,
            weight=5.0,
            status='published'
        )
        product.save()
        
        update_data = {
            'name': 'New Name',
            'base_price': 15000
        }
        
        response = self.client.put(
            f'/api/products/{str(product.id)}',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['name'], 'New Name')
        self.assertEqual(data['data']['base_price'], 15000)
        self.assertEqual(data['data']['weight'], 5.0)  # Unchanged
    
    def test_update_product_not_found(self):
        """Test updating a non-existent product."""
        update_data = {'name': 'New Name'}
        
        response = self.client.put(
            '/api/products/507f1f77bcf86cd799439011',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_update_product_invalid_data(self):
        """Test updating a product with invalid data."""
        product = Product(
            name='Test Ring',
            category='Ring',
            base_price=10000,
            weight=5.0,
            status='published'
        )
        product.save()
        
        update_data = {
            'base_price': -1000  # Invalid negative price
        }
        
        response = self.client.put(
            f'/api/products/{str(product.id)}',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_delete_product_success(self):
        """Test soft deleting a product."""
        product = Product(
            name='Test Ring',
            category='Ring',
            base_price=10000,
            weight=5.0,
            status='published'
        )
        product.save()
        
        response = self.client.delete(f'/api/products/{str(product.id)}')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        
        # Verify product is soft deleted
        deleted_product = Product.objects(id=product.id).first()
        self.assertIsNotNone(deleted_product)
        self.assertFalse(deleted_product.is_active)
        
        # Verify it doesn't appear in active products list
        response = self.client.get('/api/products/')
        data = json.loads(response.data)
        self.assertEqual(len(data['data']), 0)
    
    def test_delete_product_not_found(self):
        """Test deleting a non-existent product."""
        response = self.client.delete('/api/products/507f1f77bcf86cd799439011')
        
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertFalse(data['success'])


def run_tests():
    """Run all tests."""
    unittest.main(argv=[''], verbosity=2, exit=False)


if __name__ == '__main__':
    unittest.main(verbosity=2)
