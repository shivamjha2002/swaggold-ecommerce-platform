"""Quick test to verify model imports and basic structure."""
import sys

def test_model_imports():
    """Test that all models can be imported."""
    try:
        from app.models import (
            Product, Customer, Sale, KhataTransaction,
            PriceHistory, DiamondPriceHistory, TrainingLog, User
        )
        print("✓ All models imported successfully")
        return True
    except ImportError as e:
        print(f"✗ Import error: {str(e)}")
        return False


def test_model_structure():
    """Test basic model structure."""
    try:
        from app.models import Product, Customer, User
        
        # Check Product has required fields
        assert hasattr(Product, 'name')
        assert hasattr(Product, 'category')
        assert hasattr(Product, 'calculate_current_price')
        print("✓ Product model structure verified")
        
        # Check Customer has required fields
        assert hasattr(Customer, 'name')
        assert hasattr(Customer, 'phone')
        assert hasattr(Customer, 'current_balance')
        assert hasattr(Customer, 'update_balance')
        print("✓ Customer model structure verified")
        
        # Check User has required methods
        assert hasattr(User, 'set_password')
        assert hasattr(User, 'check_password')
        assert hasattr(User, 'authenticate')
        print("✓ User model structure verified")
        
        return True
    except AssertionError as e:
        print(f"✗ Structure test failed: {str(e)}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {str(e)}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("Model Verification Tests")
    print("=" * 60)
    print()
    
    tests_passed = 0
    tests_total = 2
    
    if test_model_imports():
        tests_passed += 1
    
    if test_model_structure():
        tests_passed += 1
    
    print()
    print("=" * 60)
    print(f"Tests: {tests_passed}/{tests_total} passed")
    
    if tests_passed == tests_total:
        print("✓ All tests passed!")
        print("=" * 60)
        return 0
    else:
        print("✗ Some tests failed")
        print("=" * 60)
        return 1


if __name__ == '__main__':
    sys.exit(main())
