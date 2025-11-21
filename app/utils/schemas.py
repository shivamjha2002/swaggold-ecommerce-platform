"""Marshmallow schemas for request validation."""
from marshmallow import Schema, fields, validate, validates, validates_schema, ValidationError
import re


# ============================================================================
# Product Schemas
# ============================================================================

class ProductCreateSchema(Schema):
    """Schema for creating a product."""
    
    name = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=200),
        error_messages={'required': 'Product name is required'}
    )
    category = fields.Str(
        required=True,
        validate=validate.OneOf([
            'Nath', 'Pendant Set', 'Tika', 'Necklace', 'Earrings',
            'Bangles', 'Ring', 'Bracelet', 'Bridal Set'
        ]),
        error_messages={'required': 'Category is required'}
    )
    base_price = fields.Float(
        required=True,
        validate=validate.Range(min=0),
        error_messages={'required': 'Base price is required'}
    )
    weight = fields.Float(
        required=True,
        validate=validate.Range(min=0, min_inclusive=False),
        error_messages={'required': 'Weight is required'}
    )
    gold_purity = fields.Str(
        validate=validate.OneOf(['916', '750', '585']),
        missing='916'
    )
    description = fields.Str(
        allow_none=True,
        validate=validate.Length(max=1000)
    )
    image_url = fields.Str(
        allow_none=True,
        validate=validate.Length(max=500)
    )
    stock_quantity = fields.Int(
        validate=validate.Range(min=0),
        missing=0
    )


class ProductUpdateSchema(Schema):
    """Schema for updating a product."""
    
    name = fields.Str(
        validate=validate.Length(min=1, max=200)
    )
    category = fields.Str(
        validate=validate.OneOf([
            'Nath', 'Pendant Set', 'Tika', 'Necklace', 'Earrings',
            'Bangles', 'Ring', 'Bracelet', 'Bridal Set'
        ])
    )
    base_price = fields.Float(
        validate=validate.Range(min=0)
    )
    weight = fields.Float(
        validate=validate.Range(min=0, min_inclusive=False)
    )
    gold_purity = fields.Str(
        validate=validate.OneOf(['916', '750', '585'])
    )
    description = fields.Str(
        allow_none=True,
        validate=validate.Length(max=1000)
    )
    image_url = fields.Str(
        allow_none=True,
        validate=validate.Length(max=500)
    )
    stock_quantity = fields.Int(
        validate=validate.Range(min=0)
    )
    is_active = fields.Bool()


# ============================================================================
# Customer Schemas
# ============================================================================

class CustomerCreateSchema(Schema):
    """Schema for creating a customer."""
    
    name = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=200),
        error_messages={'required': 'Customer name is required'}
    )
    phone = fields.Str(
        required=True,
        validate=validate.Length(min=10, max=15),
        error_messages={'required': 'Phone number is required'}
    )
    email = fields.Email(
        allow_none=True,
        validate=validate.Length(max=200)
    )
    address = fields.Str(
        allow_none=True,
        validate=validate.Length(max=500)
    )
    
    @validates('phone')
    def validate_phone(self, value):
        """Validate phone number format."""
        # Remove common separators
        cleaned = re.sub(r'[\s\-\(\)]', '', value)
        if not cleaned.isdigit():
            raise ValidationError('Phone number must contain only digits')
        if len(cleaned) < 10:
            raise ValidationError('Phone number must be at least 10 digits')


class CustomerUpdateSchema(Schema):
    """Schema for updating a customer."""
    
    name = fields.Str(
        validate=validate.Length(min=1, max=200)
    )
    phone = fields.Str(
        validate=validate.Length(min=10, max=15)
    )
    email = fields.Email(
        allow_none=True,
        validate=validate.Length(max=200)
    )
    address = fields.Str(
        allow_none=True,
        validate=validate.Length(max=500)
    )
    
    @validates('phone')
    def validate_phone(self, value):
        """Validate phone number format."""
        cleaned = re.sub(r'[\s\-\(\)]', '', value)
        if not cleaned.isdigit():
            raise ValidationError('Phone number must contain only digits')
        if len(cleaned) < 10:
            raise ValidationError('Phone number must be at least 10 digits')


# ============================================================================
# Khata Transaction Schemas
# ============================================================================

class KhataTransactionSchema(Schema):
    """Schema for creating a khata transaction."""
    
    customer_id = fields.Str(
        required=True,
        error_messages={'required': 'Customer ID is required'}
    )
    transaction_type = fields.Str(
        required=True,
        validate=validate.OneOf(['credit', 'debit']),
        error_messages={'required': 'Transaction type is required'}
    )
    amount = fields.Float(
        required=True,
        validate=validate.Range(min=0, min_inclusive=False),
        error_messages={'required': 'Amount is required'}
    )
    description = fields.Str(
        allow_none=True,
        validate=validate.Length(max=500)
    )
    payment_method = fields.Str(
        allow_none=True,
        validate=validate.OneOf(['cash', 'upi', 'card', 'cheque'])
    )
    reference_number = fields.Str(
        allow_none=True,
        validate=validate.Length(max=100)
    )


# ============================================================================
# Sale Schemas
# ============================================================================

class SaleProductSchema(Schema):
    """Schema for a product in a sale."""
    
    product_id = fields.Str(required=True)
    quantity = fields.Int(
        required=True,
        validate=validate.Range(min=1)
    )
    price_at_sale = fields.Float(
        required=True,
        validate=validate.Range(min=0)
    )


class SaleCreateSchema(Schema):
    """Schema for creating a sale."""
    
    customer_id = fields.Str(
        required=True,
        error_messages={'required': 'Customer ID is required'}
    )
    products = fields.List(
        fields.Nested(SaleProductSchema),
        required=True,
        validate=validate.Length(min=1),
        error_messages={'required': 'At least one product is required'}
    )
    discount = fields.Float(
        validate=validate.Range(min=0),
        missing=0.0
    )
    payment_status = fields.Str(
        validate=validate.OneOf(['paid', 'partial', 'pending']),
        missing='pending'
    )
    payment_method = fields.Str(
        validate=validate.OneOf(['cash', 'upi', 'card', 'cheque', 'khata']),
        allow_none=True
    )
    notes = fields.Str(
        allow_none=True,
        validate=validate.Length(max=1000)
    )


# ============================================================================
# Price History Schemas
# ============================================================================

class GoldPriceSchema(Schema):
    """Schema for adding gold price history."""
    
    price_per_gram = fields.Float(
        required=True,
        validate=validate.Range(min=0, min_inclusive=False),
        error_messages={'required': 'Price per gram is required'}
    )
    purity = fields.Str(
        validate=validate.OneOf(['916', '999', '750', '585']),
        missing='916'
    )
    date = fields.DateTime(
        allow_none=True
    )
    source = fields.Str(
        validate=validate.Length(max=100),
        missing='manual'
    )


class DiamondPriceSchema(Schema):
    """Schema for adding diamond price history."""
    
    carat = fields.Float(
        required=True,
        validate=validate.Range(min=0, min_inclusive=False),
        error_messages={'required': 'Carat is required'}
    )
    cut = fields.Str(
        required=True,
        validate=validate.OneOf(['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair']),
        error_messages={'required': 'Cut is required'}
    )
    color = fields.Str(
        required=True,
        validate=validate.OneOf(['D', 'E', 'F', 'G', 'H', 'I', 'J']),
        error_messages={'required': 'Color is required'}
    )
    clarity = fields.Str(
        required=True,
        validate=validate.OneOf(['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2']),
        error_messages={'required': 'Clarity is required'}
    )
    price = fields.Float(
        required=True,
        validate=validate.Range(min=0, min_inclusive=False),
        error_messages={'required': 'Price is required'}
    )
    date = fields.DateTime(
        allow_none=True
    )
    source = fields.Str(
        validate=validate.Length(max=100),
        missing='manual'
    )


# ============================================================================
# Prediction Schemas
# ============================================================================

class GoldPredictionSchema(Schema):
    """Schema for gold price prediction request."""
    
    date = fields.Date(
        required=True,
        error_messages={'required': 'Prediction date is required'}
    )
    weight_grams = fields.Float(
        validate=validate.Range(min=0, min_inclusive=False),
        missing=10.0
    )
    
    @validates('date')
    def validate_future_date(self, value):
        """Ensure date is in the future."""
        from datetime import date
        if value <= date.today():
            raise ValidationError('Prediction date must be in the future')


class DiamondPredictionSchema(Schema):
    """Schema for diamond price prediction request."""
    
    carat = fields.Float(
        required=True,
        validate=validate.Range(min=0, min_inclusive=False),
        error_messages={'required': 'Carat is required'}
    )
    cut = fields.Str(
        required=True,
        validate=validate.OneOf(['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair']),
        error_messages={'required': 'Cut is required'}
    )
    color = fields.Str(
        required=True,
        validate=validate.OneOf(['D', 'E', 'F', 'G', 'H', 'I', 'J']),
        error_messages={'required': 'Color is required'}
    )
    clarity = fields.Str(
        required=True,
        validate=validate.OneOf(['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2']),
        error_messages={'required': 'Clarity is required'}
    )


# ============================================================================
# Authentication Schemas
# ============================================================================

class LoginSchema(Schema):
    """Schema for user login."""
    
    username = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=80),
        error_messages={'required': 'Username is required'}
    )
    password = fields.Str(
        required=True,
        validate=validate.Length(min=1),
        error_messages={'required': 'Password is required'}
    )


class RegisterSchema(Schema):
    """Schema for user registration."""
    
    username = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=80),
        error_messages={'required': 'Username is required'}
    )
    email = fields.Email(
        required=True,
        validate=validate.Length(max=200),
        error_messages={'required': 'Email is required'}
    )
    password = fields.Str(
        required=True,
        validate=validate.Length(min=6),
        error_messages={'required': 'Password is required'}
    )
    role = fields.Str(
        validate=validate.OneOf(['admin', 'staff']),
        missing='staff'
    )
    
    @validates('username')
    def validate_username(self, value):
        """Validate username format."""
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise ValidationError('Username can only contain letters, numbers, and underscores')
    
    @validates('password')
    def validate_password_strength(self, value):
        """Validate password strength."""
        if len(value) < 6:
            raise ValidationError('Password must be at least 6 characters long')
        # Optional: Add more password strength requirements
        # if not re.search(r'[A-Z]', value):
        #     raise ValidationError('Password must contain at least one uppercase letter')
        # if not re.search(r'[0-9]', value):
        #     raise ValidationError('Password must contain at least one number')


# ============================================================================
# Pagination Schema
# ============================================================================

class PaginationSchema(Schema):
    """Schema for pagination parameters."""
    
    page = fields.Int(
        validate=validate.Range(min=1),
        missing=1
    )
    per_page = fields.Int(
        validate=validate.Range(min=1, max=100),
        missing=20
    )
