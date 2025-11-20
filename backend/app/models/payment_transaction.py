"""Payment transaction model for tracking Razorpay payment lifecycle."""
from datetime import datetime
from mongoengine import (
    Document, StringField, IntField, DateTimeField, 
    ListField, DictField, ReferenceField
)


class PaymentTransaction(Document):
    """Payment transaction document model."""
    
    # Order reference
    order_id = ReferenceField('Order', required=True)
    
    # Razorpay identifiers
    razorpay_order_id = StringField(required=True, unique=True, max_length=100)
    razorpay_payment_id = StringField(max_length=100)
    razorpay_signature = StringField(max_length=500)
    
    # Payment details
    amount = IntField(required=True, min_value=0)  # Amount in paise
    currency = StringField(default='INR', max_length=3)
    status = StringField(
        required=True,
        choices=['pending', 'success', 'failed', 'refunded'],
        default='pending'
    )
    payment_method = StringField(max_length=50)  # card, netbanking, upi, wallet, etc.
    
    # Error tracking
    error_code = StringField(max_length=50)
    error_description = StringField(max_length=500)
    
    # Webhook events
    webhook_events = ListField(DictField())  # Store all webhook events received
    
    # Timestamps
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'payment_transactions',
        'indexes': [
            {'fields': ['razorpay_order_id'], 'unique': True},
            {'fields': ['razorpay_payment_id'], 'sparse': True},
            'order_id',
            'status',
            'created_at',
            {'fields': ['-created_at']},
            {'fields': ['status', 'created_at']},
        ]
    }
    
    def save(self, *args, **kwargs):
        """Override save to update timestamp."""
        self.updated_at = datetime.utcnow()
        return super(PaymentTransaction, self).save(*args, **kwargs)
    
    def add_webhook_event(self, event_data):
        """
        Add a webhook event to the transaction.
        
        Args:
            event_data: Dictionary containing webhook event data
        """
        event_with_timestamp = {
            'timestamp': datetime.utcnow().isoformat(),
            'data': event_data
        }
        self.webhook_events.append(event_with_timestamp)
        self.save()
    
    def to_dict(self):
        """Convert payment transaction to dictionary."""
        return {
            'id': str(self.id),
            'order_id': str(self.order_id.id) if self.order_id else None,
            'razorpay_order_id': self.razorpay_order_id,
            'razorpay_payment_id': self.razorpay_payment_id,
            'razorpay_signature': self.razorpay_signature,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'payment_method': self.payment_method,
            'error_code': self.error_code,
            'error_description': self.error_description,
            'webhook_events': self.webhook_events,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
