"""Simple test for error handling and validation (no Flask dependencies)."""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def test_custom_exceptions():
    """Test custom exception classes."""
    print("Testing custom exceptions...")
    
    from app.utils.exceptions import (
        APIException,
        ResourceNotFoundError,
        ValidationError,
        AuthenticationError,
        AuthorizationError,
        ConflictError,
        DatabaseError
    )
    
    # Test APIException
    exc = APIException("Test error", status_code=400, details="Test details")
    assert exc.message == "Test error"
    assert exc.status_code == 400
    assert exc.details == "Test details"
    error_dict = exc.to_dict()
    assert error_dict['code'] == 400
    assert error_dict['message'] == "Test error"
    assert error_dict['details'] == "Test details"
    print("✓ APIException works correctly")
    
    # Test ResourceNotFoundError
    exc = ResourceNotFoundError("Product", "123")
    assert exc.status_code == 404
    assert "Product" in exc.message
    assert "123" in exc.message
    print("✓ ResourceNotFoundError works correctly")
    
    # Test ValidationError
    exc = ValidationError("Invalid field", field="email")
    assert exc.status_code == 400
    error_dict = exc.to_dict()
    assert error_dict['field'] == "email"
    print("✓ ValidationError works correctly")
    
    # Test AuthenticationError
    exc = AuthenticationError()
    assert exc.status_code == 401
    print("✓ AuthenticationError works correctly")
    
    # Test AuthorizationError
    exc = AuthorizationError()
    assert exc.status_code == 403
    print("✓ AuthorizationError works correctly")
    
    # Test ConflictError
    exc = ConflictError("Duplicate entry", resource_type="User")
    assert exc.status_code == 409
    print("✓ ConflictError works correctly")
    
    # Test DatabaseError
    exc = DatabaseError()
    assert exc.status_code == 500
    print("✓ DatabaseError works correctly")
    
    print("All exception tests passed!\n")


def test_validation_schemas():
    """Test marshmallow validation schemas."""
    print("Testing validation schemas...")
    
    from app.utils.schemas import (
        ProductCreateSchema,
        CustomerCreateSchema,
        KhataTransactionSchema,
        LoginSchema,
        GoldPredictionSchema
    )
    from marshmallow import ValidationError as MarshmallowValidationError
    
    # Test ProductCreateSchema - valid data
    schema = ProductCreateSchema()
    valid_data = {
        'name': 'Test Product',
        'category': 'Necklace',
        'base_price': 50000,
        'weight': 10.5,
        'gold_purity': '916'
    }
    result = schema.load(valid_data)
    assert result['name'] == 'Test Product'
    assert result['category'] == 'Necklace'
    print("✓ ProductCreateSchema validates correct data")
    
    # Test ProductCreateSchema - missing required field
    invalid_data = {
        'name': 'Test Product',
        'category': 'Necklace'
        # Missing base_price and weight
    }
    try:
        schema.load(invalid_data)
        assert False, "Should have raised validation error"
    except MarshmallowValidationError as e:
        assert 'base_price' in e.messages
        assert 'weight' in e.messages
        print("✓ ProductCreateSchema catches missing required fields")
    
    # Test ProductCreateSchema - invalid category
    invalid_data = {
        'name': 'Test Product',
        'category': 'InvalidCategory',
        'base_price': 50000,
        'weight': 10.5
    }
    try:
        schema.load(invalid_data)
        assert False, "Should have raised validation error"
    except MarshmallowValidationError as e:
        assert 'category' in e.messages
        print("✓ ProductCreateSchema validates category choices")
    
    # Test CustomerCreateSchema - valid data
    schema = CustomerCreateSchema()
    valid_data = {
        'name': 'John Doe',
        'phone': '9876543210',
        'email': 'john@example.com'
    }
    result = schema.load(valid_data)
    assert result['name'] == 'John Doe'
    print("✓ CustomerCreateSchema validates correct data")
    
    # Test CustomerCreateSchema - invalid phone
    invalid_data = {
        'name': 'John Doe',
        'phone': 'abc123'  # Invalid phone
    }
    try:
        schema.load(invalid_data)
        assert False, "Should have raised validation error"
    except MarshmallowValidationError as e:
        assert 'phone' in e.messages
        print("✓ CustomerCreateSchema validates phone format")
    
    # Test KhataTransactionSchema - valid data
    schema = KhataTransactionSchema()
    valid_data = {
        'customer_id': '507f1f77bcf86cd799439011',
        'transaction_type': 'credit',
        'amount': 5000.0,
        'payment_method': 'cash'
    }
    result = schema.load(valid_data)
    assert result['transaction_type'] == 'credit'
    print("✓ KhataTransactionSchema validates correct data")
    
    # Test KhataTransactionSchema - invalid transaction type
    invalid_data = {
        'customer_id': '507f1f77bcf86cd799439011',
        'transaction_type': 'invalid',
        'amount': 5000.0
    }
    try:
        schema.load(invalid_data)
        assert False, "Should have raised validation error"
    except MarshmallowValidationError as e:
        assert 'transaction_type' in e.messages
        print("✓ KhataTransactionSchema validates transaction type")
    
    # Test LoginSchema - valid data
    schema = LoginSchema()
    valid_data = {
        'username': 'admin',
        'password': 'password123'
    }
    result = schema.load(valid_data)
    assert result['username'] == 'admin'
    print("✓ LoginSchema validates correct data")
    
    # Test GoldPredictionSchema - valid data
    schema = GoldPredictionSchema()
    from datetime import date, timedelta
    future_date = date.today() + timedelta(days=30)
    valid_data = {
        'date': future_date.isoformat(),
        'weight_grams': 10.0
    }
    result = schema.load(valid_data)
    assert result['weight_grams'] == 10.0
    print("✓ GoldPredictionSchema validates correct data")
    
    # Test GoldPredictionSchema - past date
    past_date = date.today() - timedelta(days=1)
    invalid_data = {
        'date': past_date.isoformat()
    }
    try:
        schema.load(invalid_data)
        assert False, "Should have raised validation error"
    except MarshmallowValidationError as e:
        assert 'date' in e.messages
        print("✓ GoldPredictionSchema validates future dates")
    
    print("All validation schema tests passed!\n")


def test_input_sanitization():
    """Test input sanitization."""
    print("Testing input sanitization...")
    
    from app.utils.validators import sanitize_data
    
    # Test string sanitization
    dirty_string = "<script>alert('xss')</script>Hello"
    clean_string = sanitize_data(dirty_string)
    assert "<script>" not in clean_string
    assert "Hello" in clean_string
    print("✓ String sanitization removes HTML tags")
    
    # Test dict sanitization
    dirty_dict = {
        'name': '<b>Test</b>',
        'description': '<script>alert("xss")</script>Safe text'
    }
    clean_dict = sanitize_data(dirty_dict)
    assert '<b>' not in clean_dict['name']
    assert '<script>' not in clean_dict['description']
    assert 'Safe text' in clean_dict['description']
    print("✓ Dict sanitization works recursively")
    
    # Test list sanitization
    dirty_list = ['<b>Item1</b>', '<i>Item2</i>']
    clean_list = sanitize_data(dirty_list)
    assert '<b>' not in clean_list[0]
    assert '<i>' not in clean_list[1]
    print("✓ List sanitization works correctly")
    
    print("All sanitization tests passed!\n")


if __name__ == '__main__':
    print("=" * 60)
    print("Error Handling and Validation Tests")
    print("=" * 60 + "\n")
    
    try:
        test_custom_exceptions()
        test_validation_schemas()
        test_input_sanitization()
        
        print("=" * 60)
        print("✓ ALL TESTS PASSED!")
        print("=" * 60)
    except Exception as e:
        print(f"\n✗ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
