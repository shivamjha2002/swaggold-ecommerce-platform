"""Order model for managing customer orders."""
from datetime import datetime
from mongoengine import (
    Document, EmbeddedDocument, StringField, FloatField, 
    IntField, DateTimeField, ListField, EmbeddedDocumentField,
    ReferenceField
)
import random
import string


class OrderItem(EmbeddedDocument):
    """Embedded document for order items."""
    
    product_id = StringField(required=True)
    product_name = StringField(required=True, max_length=200)
    product_category = StringField()
    quantity = IntField(required=True, min_value=1)
    unit_price = FloatField(required=True, min_value=0)
    total_price = FloatField(required=True, min_value=0)
    
    # Product details at time of order
    weight = FloatField()  # Weight in grams
    gold_purity = StringField()
    
    def to_dict(self):
        """Convert order item to dictionary."""
        return {
            'product_id': self.product_id,
            'product_name': self.product_name,
            'product_category': self.product_category,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total_price': self.total_price,
            'weight': self.weight,
            'gold_purity': self.gold_purity
        }


class Order(Document):
    """Order document model."""
    
    # Order identification
    order_number = StringField(required=True, unique=True, max_length=20)
    
    # Customer information
    customer_id = ReferenceField('Customer', required=True)
    customer_name = StringField(required=True, max_length=200)
    customer_phone = StringField(required=True, max_length=15)
    customer_email = StringField(max_length=200)
    customer_address = StringField()
    
    # Order items
    items = ListField(EmbeddedDocumentField(OrderItem), required=True)
    
    # Pricing
    subtotal = FloatField(required=True, min_value=0)
    tax_amount = FloatField(default=0.0, min_value=0)
    discount_amount = FloatField(default=0.0, min_value=0)
    total_amount = FloatField(required=True, min_value=0)
    
    # Status tracking
    status = StringField(
        required=True,
        choices=['pending', 'processing', 'completed', 'cancelled'],
        default='pending'
    )
    payment_status = StringField(
        choices=['unpaid', 'partial', 'paid'],
        default='unpaid'
    )
    payment_method = StringField()  # cash, card, upi, khata, etc.
    
    # Timestamps
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    completed_at = DateTimeField()
    cancelled_at = DateTimeField()
    
    # Notes
    notes = StringField()  # Customer-facing notes
    admin_notes = StringField()  # Internal admin notes
    
    meta = {
        'collection': 'orders',
        'indexes': [
            {'fields': ['order_number'], 'unique': True},
            'customer_id',
            'status',
            'payment_status',
            'created_at',
            {'fields': ['-created_at']},  # Descending order for recent orders
            {'fields': ['status', 'created_at']},
            {'fields': ['customer_id', 'status']},
        ]
    }
    
    def save(self, *args, **kwargs):
        """Override save to update timestamp."""
        self.updated_at = datetime.utcnow()
        return super(Order, self).save(*args, **kwargs)
    
    @staticmethod
    def generate_order_number():
        """
        Generate a unique order number.
        
        Format: ORD-YYYYMMDD-XXXX
        Where XXXX is a random 4-character alphanumeric string.
        
        Returns:
            str: Generated order number
        """
        date_str = datetime.utcnow().strftime('%Y%m%d')
        random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        order_number = f"ORD-{date_str}-{random_str}"
        
        # Check if order number already exists (very unlikely but possible)
        while Order.objects(order_number=order_number).first():
            random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            order_number = f"ORD-{date_str}-{random_str}"
        
        return order_number
    
    def calculate_totals(self):
        """
        Calculate order totals from items.
        
        Updates subtotal and total_amount based on items.
        """
        self.subtotal = sum(item.total_price for item in self.items)
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount
    
    def update_status(self, new_status):
        """
        Update order status with appropriate timestamp.
        
        Args:
            new_status: New status value
        """
        self.status = new_status
        
        if new_status == 'completed':
            self.completed_at = datetime.utcnow()
        elif new_status == 'cancelled':
            self.cancelled_at = datetime.utcnow()
        
        self.save()
    
    def add_note(self, note, is_admin=False):
        """
        Add a note to the order.
        
        Args:
            note: Note text to add
            is_admin: Whether this is an admin note
        """
        timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        formatted_note = f"[{timestamp}] {note}"
        
        if is_admin:
            if self.admin_notes:
                self.admin_notes += f"\n{formatted_note}"
            else:
                self.admin_notes = formatted_note
        else:
            if self.notes:
                self.notes += f"\n{formatted_note}"
            else:
                self.notes = formatted_note
        
        self.save()
    
    def to_dict(self, include_customer_details=True):
        """
        Convert order to dictionary.
        
        Args:
            include_customer_details: Whether to include full customer details
        
        Returns:
            dict: Order data
        """
        data = {
            'id': str(self.id),
            'order_number': self.order_number,
            'customer_id': str(self.customer_id.id) if self.customer_id else None,
            'customer_name': self.customer_name,
            'customer_phone': self.customer_phone,
            'customer_email': self.customer_email,
            'items': [item.to_dict() for item in self.items],
            'subtotal': self.subtotal,
            'tax_amount': self.tax_amount,
            'discount_amount': self.discount_amount,
            'total_amount': self.total_amount,
            'status': self.status,
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'notes': self.notes,
            'admin_notes': self.admin_notes
        }
        
        if include_customer_details and self.customer_address:
            data['customer_address'] = self.customer_address
        
        return data
