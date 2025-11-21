"""Tests for Customer and Khata API endpoints."""
import unittest
import json
from datetime import datetime
from app import create_app
from app.models.customer import Customer
from app.models.khata import KhataTransaction
from app.services.khata_service import KhataService
from mongoengine import connect, disconnect


class TestCustomerAPI(unittest.TestCase):
    """Test cases for Customer API endpoints."""
    
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
        Customer.drop_collection()
        KhataTransaction.drop_collection()
    
    def tearDown(self):
        """Clean up after each test."""
        Customer.drop_collection()
        KhataTransaction.drop_collection()
    
    def test_create_customer_success(self):
        """Test creating a customer successfully."""
        customer_data = {
            'name': 'John Doe',
            'phone': '9876543210',
            'email': 'john@example.com',
            'address': '123 Main St, City'
        }
        
        response = self.client.post(
            '/api/customers/',
            data=json.dumps(customer_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertEqual(data['data']['name'], 'John Doe')
        self.assertEqual(data['data']['phone'], '9876543210')
        self.assertEqual(data['data']['current_balance'], 0.0)
    
    def test_create_customer_missing_name(self):
        """Test creating a customer without name."""
        customer_data = {
            'phone': '9876543210'
        }
        
        response = self.client.post(
            '/api/customers/',
            data=json.dumps(customer_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('error', data)
    
    def test_create_customer_missing_phone(self):
        """Test creating a customer without phone."""
        customer_data = {
            'name': 'John Doe'
        }
        
        response = self.client.post(
            '/api/customers/',
            data=json.dumps(customer_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_create_customer_duplicate_phone(self):
        """Test creating a customer with duplicate phone number."""
        # Create first customer
        Customer(name='John Doe', phone='9876543210').save()
        
        # Try to create another with same phone
        customer_data = {
            'name': 'Jane Doe',
            'phone': '9876543210'
        }
        
        response = self.client.post(
            '/api/customers/',
            data=json.dumps(customer_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('already exists', data['error']['message'])
    
    def test_get_customer_khata_empty(self):
        """Test getting customer khata with no transactions."""
        customer = Customer(name='John Doe', phone='9876543210')
        customer.save()
        
        response = self.client.get(f'/api/customers/{str(customer.id)}/khata')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']['transactions']), 0)
        self.assertEqual(data['data']['customer']['name'], 'John Doe')
        self.assertIn('summary', data['data'])
        self.assertIn('pagination', data['data'])
    
    def test_get_customer_khata_not_found(self):
        """Test getting khata for non-existent customer."""
        response = self.client.get('/api/customers/507f1f77bcf86cd799439011/khata')
        
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_get_customer_khata_invalid_id(self):
        """Test getting khata with invalid customer ID."""
        response = self.client.get('/api/customers/invalid_id/khata')
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])


class TestKhataAPI(unittest.TestCase):
    """Test cases for Khata API endpoints."""
    
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
        Customer.drop_collection()
        KhataTransaction.drop_collection()
        
        # Create test customer
        self.customer = Customer(name='Test Customer', phone='9876543210')
        self.customer.save()
    
    def tearDown(self):
        """Clean up after each test."""
        Customer.drop_collection()
        KhataTransaction.drop_collection()
    
    def test_create_debit_transaction_success(self):
        """Test creating a debit transaction (customer owes money)."""
        transaction_data = {
            'customer_id': str(self.customer.id),
            'transaction_type': 'debit',
            'amount': 50000,
            'description': 'Purchase of gold necklace',
            'payment_method': 'cash'
        }
        
        response = self.client.post(
            '/api/khata/transactions',
            data=json.dumps(transaction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['transaction_type'], 'debit')
        self.assertEqual(data['data']['amount'], 50000)
        self.assertEqual(data['data']['balance_after'], 50000)
        
        # Verify customer balance updated
        customer = Customer.objects.get(id=self.customer.id)
        self.assertEqual(customer.current_balance, 50000)
    
    def test_create_credit_transaction_success(self):
        """Test creating a credit transaction (customer pays money)."""
        # Set initial balance
        self.customer.current_balance = 100000
        self.customer.save()
        
        transaction_data = {
            'customer_id': str(self.customer.id),
            'transaction_type': 'credit',
            'amount': 30000,
            'description': 'Payment received',
            'payment_method': 'upi',
            'reference_number': 'UPI123456'
        }
        
        response = self.client.post(
            '/api/khata/transactions',
            data=json.dumps(transaction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['transaction_type'], 'credit')
        self.assertEqual(data['data']['amount'], 30000)
        self.assertEqual(data['data']['balance_after'], 70000)
        
        # Verify customer balance updated
        customer = Customer.objects.get(id=self.customer.id)
        self.assertEqual(customer.current_balance, 70000)
    
    def test_create_transaction_missing_customer_id(self):
        """Test creating transaction without customer_id."""
        transaction_data = {
            'transaction_type': 'debit',
            'amount': 50000
        }
        
        response = self.client.post(
            '/api/khata/transactions',
            data=json.dumps(transaction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_create_transaction_invalid_type(self):
        """Test creating transaction with invalid type."""
        transaction_data = {
            'customer_id': str(self.customer.id),
            'transaction_type': 'invalid',
            'amount': 50000
        }
        
        response = self.client.post(
            '/api/khata/transactions',
            data=json.dumps(transaction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_create_transaction_negative_amount(self):
        """Test creating transaction with negative amount."""
        transaction_data = {
            'customer_id': str(self.customer.id),
            'transaction_type': 'debit',
            'amount': -1000
        }
        
        response = self.client.post(
            '/api/khata/transactions',
            data=json.dumps(transaction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_create_transaction_zero_amount(self):
        """Test creating transaction with zero amount."""
        transaction_data = {
            'customer_id': str(self.customer.id),
            'transaction_type': 'debit',
            'amount': 0
        }
        
        response = self.client.post(
            '/api/khata/transactions',
            data=json.dumps(transaction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_create_transaction_customer_not_found(self):
        """Test creating transaction for non-existent customer."""
        transaction_data = {
            'customer_id': '507f1f77bcf86cd799439011',
            'transaction_type': 'debit',
            'amount': 50000
        }
        
        response = self.client.post(
            '/api/khata/transactions',
            data=json.dumps(transaction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_get_khata_summary(self):
        """Test getting overall khata summary."""
        # Create multiple customers with balances
        customer1 = Customer(name='Customer 1', phone='1111111111', current_balance=50000)
        customer1.save()
        
        customer2 = Customer(name='Customer 2', phone='2222222222', current_balance=30000)
        customer2.save()
        
        customer3 = Customer(name='Customer 3', phone='3333333333', current_balance=-10000)
        customer3.save()
        
        # Create some transactions
        KhataTransaction(
            customer=customer1,
            transaction_type='debit',
            amount=50000,
            balance_after=50000
        ).save()
        
        KhataTransaction(
            customer=customer2,
            transaction_type='debit',
            amount=30000,
            balance_after=30000
        ).save()
        
        response = self.client.get('/api/khata/summary')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('total_customers', data['data'])
        self.assertIn('total_outstanding', data['data'])
        self.assertIn('total_credit', data['data'])
        self.assertIn('top_debtors', data['data'])
        self.assertEqual(data['data']['total_outstanding'], 80000)
        self.assertEqual(data['data']['total_credit'], 10000)


class TestKhataService(unittest.TestCase):
    """Test cases for KhataService business logic."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test environment."""
        cls.app = create_app('testing')
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        cls.service = KhataService()
    
    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests."""
        cls.app_context.pop()
    
    def setUp(self):
        """Set up before each test."""
        Customer.drop_collection()
        KhataTransaction.drop_collection()
        
        # Create test customer
        self.customer = Customer(name='Test Customer', phone='9876543210')
        self.customer.save()
    
    def tearDown(self):
        """Clean up after each test."""
        Customer.drop_collection()
        KhataTransaction.drop_collection()
    
    def test_create_transaction_atomic_balance_update(self):
        """Test that balance update is atomic with transaction creation."""
        # Create debit transaction
        result = self.service.create_transaction(
            customer_id=str(self.customer.id),
            transaction_type='debit',
            amount=50000,
            description='Test purchase'
        )
        
        self.assertEqual(result['transaction_type'], 'debit')
        self.assertEqual(result['amount'], 50000)
        self.assertEqual(result['balance_after'], 50000)
        
        # Verify customer balance
        customer = Customer.objects.get(id=self.customer.id)
        self.assertEqual(customer.current_balance, 50000)
        
        # Verify transaction exists
        transaction = KhataTransaction.objects.first()
        self.assertIsNotNone(transaction)
        self.assertEqual(transaction.amount, 50000)
    
    def test_multiple_transactions_balance_consistency(self):
        """Test balance consistency across multiple transactions."""
        # Create multiple transactions
        self.service.create_transaction(
            customer_id=str(self.customer.id),
            transaction_type='debit',
            amount=50000
        )
        
        self.service.create_transaction(
            customer_id=str(self.customer.id),
            transaction_type='debit',
            amount=30000
        )
        
        self.service.create_transaction(
            customer_id=str(self.customer.id),
            transaction_type='credit',
            amount=20000
        )
        
        # Verify final balance
        customer = Customer.objects.get(id=self.customer.id)
        self.assertEqual(customer.current_balance, 60000)  # 50000 + 30000 - 20000
        
        # Verify transaction count
        transactions = KhataTransaction.objects(customer=self.customer.id)
        self.assertEqual(transactions.count(), 3)
    
    def test_calculate_running_balance(self):
        """Test running balance calculation from transaction history."""
        # Create transactions
        self.service.create_transaction(
            customer_id=str(self.customer.id),
            transaction_type='debit',
            amount=50000
        )
        
        self.service.create_transaction(
            customer_id=str(self.customer.id),
            transaction_type='credit',
            amount=20000
        )
        
        # Calculate running balance
        result = self.service.calculate_running_balance(str(self.customer.id))
        
        self.assertEqual(result['calculated_balance'], 30000)
        self.assertEqual(result['current_balance'], 30000)
        self.assertTrue(result['is_balanced'])
        self.assertEqual(result['total_transactions'], 2)
    
    def test_get_overall_summary(self):
        """Test getting overall summary statistics."""
        # Create customers with different balances
        customer1 = Customer(name='Customer 1', phone='1111111111', current_balance=50000)
        customer1.save()
        
        customer2 = Customer(name='Customer 2', phone='2222222222', current_balance=30000)
        customer2.save()
        
        customer3 = Customer(name='Customer 3', phone='3333333333', current_balance=0)
        customer3.save()
        
        # Create transactions
        KhataTransaction(
            customer=customer1,
            transaction_type='debit',
            amount=50000,
            balance_after=50000
        ).save()
        
        KhataTransaction(
            customer=customer2,
            transaction_type='debit',
            amount=30000,
            balance_after=30000
        ).save()
        
        summary = self.service.get_overall_summary()
        
        self.assertEqual(summary['total_customers'], 4)  # Including self.customer
        self.assertEqual(summary['customers_with_balance'], 2)
        self.assertEqual(summary['total_outstanding'], 80000)
        self.assertIn('top_debtors', summary)
        self.assertIn('transaction_stats', summary)


def run_tests():
    """Run all tests."""
    unittest.main(argv=[''], verbosity=2, exit=False)


if __name__ == '__main__':
    unittest.main(verbosity=2)
