"""
Script to run E2E tests with proper environment setup.
"""
import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set test environment variables
os.environ['RAZORPAY_KEY_ID'] = 'rzp_test_1234567890'
os.environ['RAZORPAY_KEY_SECRET'] = 'test_secret_key_12345'
os.environ['RAZORPAY_WEBHOOK_SECRET'] = 'test_webhook_secret'
os.environ['MONGODB_URI'] = 'mongodb://localhost:27017/swati_jewellers_test'

# Run the tests
if __name__ == '__main__':
    import unittest
    
    # Discover and run tests
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromName('test_e2e_cart_checkout_payment.TestE2ECartCheckoutPayment')
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Exit with appropriate code
    sys.exit(0 if result.wasSuccessful() else 1)
