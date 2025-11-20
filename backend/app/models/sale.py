"""Sale model for tracking product sales."""
from datetime import datetime
from mongoengine import (
    Document, ReferenceField, ListField, DictField,
    FloatField, StringField, DateTimeField
)
from .customer import Customer


class Sale(Document):
    """Sale document model."""
    
    # Customer reference
    customer = ReferenceField(Customer, required=True)
    
    # Products sold
    # Each item: {product_id, product_name, quantity, price_at_sale, weight}
    products = ListField(DictField(), required=True)
    
    # Pricing
    total_amount = FloatField(required=True, min_value=0)
    discount = FloatField(default=0.0, min_value=0)
    final_amount = FloatField(required=True, min_value=0)
    
    # Payment information
    payment_status = StringField(
        choices=['paid', 'partial', 'pending'],
        default='pending'
    )
    payment_method = StringField(
        choices=['cash', 'upi', 'card', 'cheque', 'bank_transfer', 'khata']
    )
    
    # Additional details
    notes = StringField()
    
    # Metadata
    created_at = DateTimeField(default=datetime.utcnow)
    created_by = StringField()  # Admin user who created the sale
    
    meta = {
        'collection': 'sales',
        'indexes': [
            'customer',
            {'fields': ['-created_at']},
            'payment_status',
            {'fields': ['customer', '-created_at']},
            {'fields': ['payment_status', '-created_at']},
        ]
    }
    
    def calculate_totals(self):
        """
        Calculate total amount from products.
        
        Returns:
            float: Total amount before discount
        """
        total = sum(
            item.get('price_at_sale', 0) * item.get('quantity', 1)
            for item in self.products
        )
        return round(total, 2)
    
    def apply_discount(self, discount_amount=None, discount_percentage=None):
        """
        Apply discount to the sale.
        
        Args:
            discount_amount: Fixed discount amount
            discount_percentage: Discount percentage (0-100)
        """
        if discount_amount is not None:
            self.discount = discount_amount
        elif discount_percentage is not None:
            self.discount = (self.total_amount * discount_percentage) / 100
        
        self.final_amount = max(0, self.total_amount - self.discount)
        self.save()
    
    def to_dict(self):
        """
        Convert sale to dictionary.
        
        Returns:
            dict: Sale data
        """
        return {
            'id': str(self.id),
            'customer_id': str(self.customer.id),
            'customer_name': self.customer.name,
            'products': self.products,
            'total_amount': self.total_amount,
            'discount': self.discount,
            'final_amount': self.final_amount,
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_by': self.created_by
        }
    
    @classmethod
    def get_sales_summary(cls, start_date=None, end_date=None):
        """
        Get sales summary for a date range.
        
        Args:
            start_date: Start date for filtering
            end_date: End date for filtering
        
        Returns:
            dict: Sales summary statistics
        """
        query = {}
        if start_date:
            query['created_at__gte'] = start_date
        if end_date:
            query['created_at__lte'] = end_date
        
        sales = cls.objects(**query)
        
        total_sales = sales.count()
        total_revenue = sum(s.final_amount for s in sales)
        paid_sales = sales.filter(payment_status='paid').count()
        pending_sales = sales.filter(payment_status='pending').count()
        
        return {
            'total_sales': total_sales,
            'total_revenue': total_revenue,
            'paid_sales': paid_sales,
            'pending_sales': pending_sales,
            'average_sale_value': total_revenue / total_sales if total_sales > 0 else 0
        }
