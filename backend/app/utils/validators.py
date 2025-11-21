"""Validation utilities."""
from functools import wraps
from flask import request, jsonify
from marshmallow import ValidationError as MarshmallowValidationError
from typing import Dict, Tuple
import bleach


def validate_with_schema(schema_class, location='json'):
    """
    Decorator to validate request data using a marshmallow schema.
    
    Args:
        schema_class: Marshmallow schema class to use for validation
        location: Where to get data from ('json', 'args', 'form')
    
    Usage:
        @bp.route('/products', methods=['POST'])
        @validate_with_schema(ProductCreateSchema)
        def create_product():
            data = request.validated_data
            # ... use validated data
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get data based on location
            if location == 'json':
                data = request.get_json(silent=True)
                if data is None:
                    return jsonify({
                        'success': False,
                        'error': {
                            'code': 400,
                            'message': 'Request body must be valid JSON'
                        }
                    }), 400
            elif location == 'args':
                data = request.args.to_dict()
            elif location == 'form':
                data = request.form.to_dict()
            else:
                data = {}
            
            # Validate data with schema
            schema = schema_class()
            try:
                validated_data = schema.load(data)
                # Sanitize string fields
                validated_data = sanitize_data(validated_data)
                # Store validated data in request context
                request.validated_data = validated_data
            except MarshmallowValidationError as err:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Validation error',
                        'details': err.messages
                    }
                }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def sanitize_data(data):
    """
    Sanitize input data to prevent XSS attacks.
    
    Args:
        data: Dictionary or value to sanitize
        
    Returns:
        Sanitized data
    """
    if isinstance(data, dict):
        return {key: sanitize_data(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    elif isinstance(data, str):
        # Allow only safe HTML tags (none for API)
        return bleach.clean(data, tags=[], strip=True)
    else:
        return data


def validate_object_id(object_id):
    """
    Validate MongoDB ObjectId format.
    
    Args:
        object_id: String to validate
        
    Returns:
        bool: True if valid ObjectId format
    """
    import re
    if not isinstance(object_id, str):
        return False
    # MongoDB ObjectId is 24 character hex string
    return bool(re.match(r'^[a-f0-9]{24}$', object_id))


def validate_date_range(start_date, end_date):
    """
    Validate that start_date is before end_date.
    
    Args:
        start_date: Start date
        end_date: End date
        
    Returns:
        Tuple[bool, str]: (is_valid, error_message)
    """
    if start_date and end_date:
        if start_date > end_date:
            return False, "Start date must be before end date"
    return True, ""


# Legacy validation functions (kept for backward compatibility)

def validate_product_data(data: Dict, partial: bool = False) -> Tuple[bool, str]:
    """
    Validate product data (legacy function).
    
    Note: Consider using @validate_with_schema(ProductCreateSchema) instead.
    
    Args:
        data: Product data dictionary
        partial: If True, only validate provided fields (for updates)
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Required fields for creation
    if not partial:
        required_fields = ['name', 'category', 'base_price', 'weight']
        for field in required_fields:
            if field not in data:
                return False, f"Missing required field: {field}"
    
    # Validate name
    if 'name' in data:
        if not isinstance(data['name'], str) or not data['name'].strip():
            return False, "Product name must be a non-empty string"
        if len(data['name']) > 200:
            return False, "Product name must not exceed 200 characters"
    
    # Validate category
    if 'category' in data:
        valid_categories = [
            'Nath', 'Pendant Set', 'Tika', 'Necklace', 'Earrings',
            'Bangles', 'Ring', 'Bracelet', 'Bridal Set'
        ]
        if data['category'] not in valid_categories:
            return False, f"Invalid category. Must be one of: {', '.join(valid_categories)}"
    
    # Validate base_price
    if 'base_price' in data:
        if not isinstance(data['base_price'], (int, float)) or data['base_price'] < 0:
            return False, "Base price must be a non-negative number"
    
    # Validate weight
    if 'weight' in data:
        if not isinstance(data['weight'], (int, float)) or data['weight'] <= 0:
            return False, "Weight must be a positive number"
    
    # Validate gold_purity
    if 'gold_purity' in data:
        valid_purities = ['916', '750', '585']
        if data['gold_purity'] not in valid_purities:
            return False, f"Invalid gold purity. Must be one of: {', '.join(valid_purities)}"
    
    # Validate description
    if 'description' in data and data['description'] is not None:
        if not isinstance(data['description'], str):
            return False, "Description must be a string"
    
    # Validate image_url
    if 'image_url' in data and data['image_url'] is not None:
        if not isinstance(data['image_url'], str):
            return False, "Image URL must be a string"
    
    # Validate stock_quantity
    if 'stock_quantity' in data:
        if not isinstance(data['stock_quantity'], int) or data['stock_quantity'] < 0:
            return False, "Stock quantity must be a non-negative integer"
    
    return True, ""


def validate_customer_data(data: Dict, partial: bool = False) -> Tuple[bool, str]:
    """
    Validate customer data (legacy function).
    
    Note: Consider using @validate_with_schema(CustomerCreateSchema) instead.
    
    Args:
        data: Customer data dictionary
        partial: If True, only validate provided fields (for updates)
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Required fields for creation
    if not partial:
        required_fields = ['name', 'phone']
        for field in required_fields:
            if field not in data:
                return False, f"Missing required field: {field}"
    
    # Validate name
    if 'name' in data:
        if not isinstance(data['name'], str) or not data['name'].strip():
            return False, "Customer name must be a non-empty string"
        if len(data['name']) > 200:
            return False, "Customer name must not exceed 200 characters"
    
    # Validate phone
    if 'phone' in data:
        if not isinstance(data['phone'], str):
            return False, "Phone number must be a string"
        import re
        cleaned = re.sub(r'[\s\-\(\)]', '', data['phone'])
        if not cleaned.isdigit():
            return False, "Phone number must contain only digits"
        if len(cleaned) < 10:
            return False, "Phone number must be at least 10 digits"
    
    # Validate email
    if 'email' in data and data['email']:
        if not isinstance(data['email'], str):
            return False, "Email must be a string"
        if '@' not in data['email'] or '.' not in data['email']:
            return False, "Invalid email format"
    
    return True, ""
