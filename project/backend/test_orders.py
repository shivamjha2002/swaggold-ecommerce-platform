"""Tests for Order system - model, service, and API endpoints."""
import unittest
import json
from datetime import datetime, timedelta
from app import create_app
from app.models.order import Order, OrderItem
from app.models.customer import Customer
from app.models.product import Product
from app.models.user import User
from app.services.order_service import OrderService
from flask_jwt_extended import create_access_token


class TestOrderModel(unittest.TestCase):
    """Test cases for Order model validation and constraints."""
    
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
        Order.drop_collection()
        Customer.drop_collection()
        Product.drop_collection()
        
        # Create test customer
        self.customer = Customer(
            name='Test Customer',
            phone='1234567890',
            email='test@example.com'
        )
        self.customer.save()
        
        # Create test product
        self.product = Product(
            name='Test Ring',
            category='Ring',
            base_price=10000,
            weight=5.0,
            status='published'
        )
        self.product.save()
    
    def tearDown(self):
        """Clean up after each test."""
        Order.drop_collection()
        Customer.drop_collection()
        Product.drop_collection()
    
    def test_order_number_generation(self):
        """Test order number generation is unique and follows format."""
        order_number = Order.generate_order_number()
        
        # Check format: ORD-YYYYMMDD-XXXX
        self.assertTrue(order_number.startswith('ORD-'))
        parts = order_number.split('-')
        self.assertEqual(len(parts), 3)
        self.assertEqual(len(parts[1]), 8)  # YYYYMMDD
        self.assertEqual(len(parts[2]), 4)  # XXXX
        
        # Generate another and ensure uniqueness
        order_number2 = Order.generate_order_number()
        self.assertNotEqual(order_number, order_number2)
    
    def test_order_creation_with_required_fields(self):
        """Test creating order with all required fields."""
        order_item = OrderItem(
            product_id=str(self.product.id),
            product_name=self.product.name,
            quantity=2,
            unit_price=10000,
            total_price=20000
        )
        
        order = Order(
            order_number='ORD-20241114-TEST',
            customer_id=self.customer,
            customer_name=self.customer.name,
            customer_phone=self.customer.phone,
            items=[order_item],
            subtotal=20000,
            total_amount=20000
        )
        order.save()
        
        self.assertIsNotNone(order.id)
        self.assertEqual(order.status, 'pending')  # Default status
        self.assertEqual(order.payment_status, 'unpaid')  # Default payment status
    
    def test_order_status_validation(self):
        """Test order status field validates choices."""
        order_item = OrderItem(
            product_id=str(self.product.id),
            product_name=self.product.name,
            quantity=1,
            unit_price=10000,
            total_price=10000
        )
        
        order = Order(
            order_number='ORD-20241114-TEST',
            customer_id=self.customer,
            customer_name=self.customer.name,
            customer_phone=self.customer.phone,
            items=[order_item],
            subtotal=10000,
            total_amount=10000,
            status='invalid_status'
        )
        
        with self.assertRaises(Exception):
            order.save()
    
    def test_calculate_totals(self):
        """Test order total calculation from items."""
        items = [
            OrderItem(
                product_id=str(self.product.id),
                product_name='Item 1',
                quantity=2,
                unit_price=10000,
                total_price=20000
            ),
            OrderItem(
                product_id=str(self.product.id),
                product_name='Item 2',
                quantity=1,
                unit_price=5000,
                total_price=5000
            )
        ]
        
        order = Order(
            order_number='ORD-20241114-TEST',
            customer_id=self.customer,
            customer_name=self.customer.name,
            customer_phone=self.customer.phone,
            items=items,
            tax_amount=2500,
            discount_amount=1000,
            subtotal=0,
            total_amount=0
        )
        
        order.calculate_totals()
        
        self.assertEqual(order.subtotal, 25000)
        self.assertEqual(order.total_amount, 26500)  # 25000 + 2500 - 1000
    
    def test_update_status_with_timestamp(self):
        """Test updating order status sets appropriate timestamps."""
        order_item = OrderItem(
            product_id=str(self.product.id),
            product_name=self.product.name,
            quantity=1,
            unit_price=10000,
            total_price=10000
        )
        
        order = Order(
            order_number='ORD-20241114-TEST',
            customer_id=self.customer,
            customer_name=self.customer.name,
            customer_phone=self.customer.phone,
            items=[order_item],
            subtotal=10000,
            total_amount=10000
        )
        order.save()
        
        # Test completed status
        order.update_status('completed')
        self.assertEqual(order.status, 'completed')
        self.assertIsNotNone(order.completed_at)
        
        # Test cancelled status
        order.update_status('cancelled')
        self.assertEqual(order.status, 'cancelled')
        self.assertIsNotNone(order.cancelled_at)
    
    def test_add_note(self):
        """Test adding notes to order."""
        order_item = OrderItem(
            product_id=str(self.product.id),
            product_name=self.product.name,
            quantity=1,
            unit_price=10000,
            total_price=10000
        )
        
        order = Order(
            order_number='ORD-20241114-TEST',
            customer_id=self.customer,
            customer_name=self.customer.name,
            customer_phone=self.customer.phone,
            items=[order_item],
            subtotal=10000,
            total_amount=10000
        )
        order.save()
        
        # Add customer note
        order.add_note('Customer requested gift wrapping', is_admin=False)
        self.assertIn('gift wrapping', order.notes)
        
        # Add admin note
        order.add_note('Verified payment', is_admin=True)
        self.assertIn('Verified payment', order.admin_notes)



class TestOrderService(unittest.TestCase):
    """Test cases for OrderService methods."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test client and database connection."""
        cls.app = create_app('testing')
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
    
    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests."""
        cls.app_context.pop()
    
    def setUp(self):
        """Set up before each test."""
        Order.drop_collection()
        Customer.drop_collection()
        Product.drop_collection()
        
        # Create test customer
        self.customer = Customer(
            name='Test Customer',
            phone='1234567890',
            email='test@example.com'
        )
        self.customer.save()
        
        # Create test products
        self.product1 = Product(
            name='Test Ring',
            category='Ring',
            base_price=10000,
            weight=5.0,
            status='published'
        )
        self.product1.save()
        
        self.product2 = Product(
            name='Test Necklace',
            category='Necklace',
            base_price=20000,
            weight=10.0,
            status='published'
        )
        self.product2.save()
    
    def tearDown(self):
        """Clean up after each test."""
        Order.drop_collection()
        Customer.drop_collection()
        Product.drop_collection()
    
    def test_create_order_success(self):
        """Test creating order through service."""
        order_data = {
            'customer_id': str(self.customer.id),
            'items': [
                {
                    'product_id': str(self.product1.id),
                    'quantity': 2,
                    'unit_price': 10000
                }
            ],
            'tax_amount': 2000,
            'discount_amount': 500
        }
        
        order = OrderService.create_order(order_data)
        
        self.assertIsNotNone(order.id)
        self.assertTrue(order.order_number.startswith('ORD-'))
        self.assertEqual(order.customer_name, self.customer.name)
        self.assertEqual(len(order.items), 1)
        self.assertEqual(order.items[0].quantity, 2)
        self.assertEqual(order.subtotal, 20000)
        self.assertEqual(order.total_amount, 21500)  # 20000 + 2000 - 500
    
    def test_create_order_invalid_customer(self):
        """Test creating order with non-existent customer."""
        order_data = {
            'customer_id': '507f1f77bcf86cd799439011',
            'items': [
                {
                    'product_id': str(self.product1.id),
                    'quantity': 1
                }
            ]
        }
        
        with self.assertRaises(ValueError) as context:
            OrderService.create_order(order_data)
        
        self.assertIn('Customer', str(context.exception))
    
    def test_create_order_invalid_product(self):
        """Test creating order with non-existent product."""
        order_data = {
            'customer_id': str(self.customer.id),
            'items': [
                {
                    'product_id': '507f1f77bcf86cd799439011',
                    'quantity': 1
                }
            ]
        }
        
        with self.assertRaises(ValueError) as context:
            OrderService.create_order(order_data)
        
        self.assertIn('Product', str(context.exception))
    
    def test_create_order_empty_items(self):
        """Test creating order with no items."""
        order_data = {
            'customer_id': str(self.customer.id),
            'items': []
        }
        
        with self.assertRaises(ValueError) as context:
            OrderService.create_order(order_data)
        
        self.assertIn('at least one item', str(context.exception))
    
    def test_update_order_status(self):
        """Test updating order status through service."""
        order_data = {
            'customer_id': str(self.customer.id),
            'items': [{'product_id': str(self.product1.id), 'quantity': 1}]
        }
        order = OrderService.create_order(order_data)
        
        # Update to processing
        updated_order = OrderService.update_order_status(str(order.id), 'processing')
        self.assertEqual(updated_order.status, 'processing')
        
        # Update to completed
        updated_order = OrderService.update_order_status(str(order.id), 'completed')
        self.assertEqual(updated_order.status, 'completed')
        self.assertIsNotNone(updated_order.completed_at)
    
    def test_update_order_status_invalid(self):
        """Test updating order with invalid status."""
        order_data = {
            'customer_id': str(self.customer.id),
            'items': [{'product_id': str(self.product1.id), 'quantity': 1}]
        }
        order = OrderService.create_order(order_data)
        
        with self.assertRaises(ValueError):
            OrderService.update_order_status(str(order.id), 'invalid_status')
    
    def test_get_orders_with_filters(self):
        """Test filtering orders by status and date."""
        # Create orders with different statuses
        for i in range(3):
            order_data = {
                'customer_id': str(self.customer.id),
                'items': [{'product_id': str(self.product1.id), 'quantity': 1}]
            }
            order = OrderService.create_order(order_data)
            if i == 0:
                OrderService.update_order_status(str(order.id), 'completed')
            elif i == 1:
                OrderService.update_order_status(str(order.id), 'processing')
        
        # Filter by status
        orders, total = OrderService.get_orders_with_filters(status='completed')
        self.assertEqual(total, 1)
        self.assertEqual(orders[0].status, 'completed')
        
        # Get all orders
        orders, total = OrderService.get_orders_with_filters()
        self.assertEqual(total, 3)
    
    def test_get_orders_with_pagination(self):
        """Test order pagination."""
        # Create 5 orders
        for i in range(5):
            order_data = {
                'customer_id': str(self.customer.id),
                'items': [{'product_id': str(self.product1.id), 'quantity': 1}]
            }
            OrderService.create_order(order_data)
        
        # Get first page
        orders, total = OrderService.get_orders_with_filters(page=1, per_page=2)
        self.assertEqual(len(orders), 2)
        self.assertEqual(total, 5)
        
        # Get second page
        orders, total = OrderService.get_orders_with_filters(page=2, per_page=2)
        self.assertEqual(len(orders), 2)
        self.assertEqual(total, 5)
    
    def test_add_order_note_service(self):
        """Test adding notes through service."""
        order_data = {
            'customer_id': str(self.customer.id),
            'items': [{'product_id': str(self.product1.id), 'quantity': 1}]
        }
        order = OrderService.create_order(order_data)
        
        # Add admin note
        updated_order = OrderService.add_order_note(str(order.id), 'Test note', is_admin=True)
        self.assertIn('Test note', updated_order.admin_notes)


class TestOrderAPI(unittest.TestCase):
    """Test cases for Order API endpoints with authentication."""
    
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
        Order.drop_collection()
        Customer.drop_collection()
        Product.drop_collection()
        User.drop_collection()
        
        # Create admin user
        self.admin_user = User(
            username='admin',
            email='admin@test.com',
            role='admin'
        )
        self.admin_user.set_password('admin123')
        self.admin_user.save()
        
        # Create staff user
        self.staff_user = User(
            username='staff',
            email='staff@test.com',
            role='staff'
        )
        self.staff_user.set_password('staff123')
        self.staff_user.save()
        
        # Generate tokens
        with self.app.app_context():
            self.admin_token = create_access_token(
                identity=str(self.admin_user.id),
                additional_claims={'role': 'admin'}
            )
            self.staff_token = create_access_token(
                identity=str(self.staff_user.id),
                additional_claims={'role': 'staff'}
            )
        
        # Create test data
        self.customer = Customer(
            name='Test Customer',
            phone='1234567890',
            email='test@example.com'
        )
        self.customer.save()
        
        self.product = Product(
            name='Test Ring',
            category='Ring',
            base_price=10000,
            weight=5.0,
            status='published'
        )
        self.product.save()
    
    def tearDown(self):
        """Clean up after each test."""
        Order.drop_collection()
        Customer.drop_collection()
        Product.drop_collection()
        User.drop_collection()
    
    def test_create_order_api_success(self):
        """Test creating order via API with admin authentication."""
        order_data = {
            'customer_id': str(self.customer.id),
            'items': [
                {
                    'product_id': str(self.product.id),
                    'quantity': 2,
                    'unit_price': 10000
                }
            ],
            'tax_amount': 2000
        }
        
        response = self.client.post(
            '/api/orders/',
            data=json.dumps(order_data),
            content_type='application/json',
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertTrue(data['data']['order_number'].startswith('ORD-'))
    
    def test_create_order_api_without_auth(self):
        """Test creating order without authentication fails."""
        order_data = {
            'customer_id': str(self.customer.id),
            'items': [{'product_id': str(self.product.id), 'quantity': 1}]
        }
        
        response = self.client.post(
            '/api/orders/',
            data=json.dumps(order_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
    
    def test_create_order_api_staff_forbidden(self):
        """Test creating order as staff user is forbidden."""
        order_data = {
            'customer_id': str(self.customer.id),
            'items': [{'product_id': str(self.product.id), 'quantity': 1}]
        }
        
        response = self.client.post(
            '/api/orders/',
            data=json.dumps(order_data),
            content_type='application/json',
            headers={'Authorization': f'Bearer {self.staff_token}'}
        )
        
        self.assertEqual(response.status_code, 403)
    
    def test_get_orders_api_success(self):
        """Test getting orders via API with admin authentication."""
        # Create test order
        order_data = {
            'customer_id': str(self.customer.id),
            'items': [{'product_id': str(self.product.id), 'quantity': 1}]
        }
        OrderService.create_order(order_data)
        
        response = self.client.get(
            '/api/orders/',
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertIn('pagination', data)
        self.assertEqual(len(data['data']), 1)
    
    def test_get_orders_api_with_filters(self):
        """Test filtering orders via API."""
        # Create orders with different statuses
        for status in ['pending', 'processing', 'completed']:
            order_data = {
                'customer_id': str(self.customer.id),
                'items': [{'product_id': str(self.product.id), 'quantity': 1}]
            }
            order = OrderService.create_order(order_data)
            if status != 'pending':
                OrderService.update_order_status(str(order.id), status)
        
        # Filter by status
        response = self.client.get(
            '/api/orders/?status=completed',
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['pagination']['total'], 1)
        self.assertEqual(data['data'][0]['status'], 'completed')
    
    def test_get_order_by_id_api_success(self):
        """Test getting single order by ID via API."""
        order_data = {
            'customer_id': str(self.customer.id),
            'items': [{'product_id': str(self.product.id), 'quantity': 1}]
        }
        order = OrderService.create_order(order_data)
        
        response = self.client.get(
            f'/api/orders/{str(order.id)}',
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['id'], str(order.id))
    
    def test_get_order_by_id_not_found(self):
        """Test getting non-existent order returns 404."""
        response = self.client.get(
            '/api/orders/507f1f77bcf86cd799439011',
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_update_order_status_api_success(self):
        """Test updating order status via API."""
        order_data = {
            'customer_id': str(self.customer.id),
            'items': [{'product_id': str(self.product.id), 'quantity': 1}]
        }
        order = OrderService.create_order(order_data)
        
        response = self.client.put(
            f'/api/orders/{str(order.id)}/status',
            data=json.dumps({'status': 'processing'}),
            content_type='application/json',
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['status'], 'processing')
    
    def test_update_order_status_invalid(self):
        """Test updating order with invalid status."""
        order_data = {
            'customer_id': str(self.customer.id),
            'items': [{'product_id': str(self.product.id), 'quantity': 1}]
        }
        order = OrderService.create_order(order_data)
        
        response = self.client.put(
            f'/api/orders/{str(order.id)}/status',
            data=json.dumps({'status': 'invalid_status'}),
            content_type='application/json',
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_add_order_note_api_success(self):
        """Test adding note to order via API."""
        order_data = {
            'customer_id': str(self.customer.id),
            'items': [{'product_id': str(self.product.id), 'quantity': 1}]
        }
        order = OrderService.create_order(order_data)
        
        response = self.client.put(
            f'/api/orders/{str(order.id)}/notes',
            data=json.dumps({'note': 'Test admin note', 'is_admin': True}),
            content_type='application/json',
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('Test admin note', data['data']['admin_notes'])
    
    def test_get_order_statistics_api(self):
        """Test getting order statistics via API."""
        # Create orders with different statuses
        for i in range(3):
            order_data = {
                'customer_id': str(self.customer.id),
                'items': [{'product_id': str(self.product.id), 'quantity': 1, 'unit_price': 10000}]
            }
            order = OrderService.create_order(order_data)
            if i == 0:
                OrderService.update_order_status(str(order.id), 'completed')
        
        response = self.client.get(
            '/api/orders/statistics',
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('total_orders', data['data'])
        self.assertIn('total_revenue', data['data'])
        self.assertIn('status_breakdown', data['data'])
        self.assertEqual(data['data']['total_orders'], 3)


def run_tests():
    """Run all tests."""
    unittest.main(argv=[''], verbosity=2, exit=False)


if __name__ == '__main__':
    unittest.main(verbosity=2)
