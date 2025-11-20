"""Refund model for managing refund operations."""
from datetime import datetime
from mongoengine import (
    Document, StringField, IntField, DateTimeField, ReferenceField
)


class Refund(Document):
    """Refund document model."""
    
    # References
    order_id = ReferenceField('Order', required=True)
    payment_transaction_id = ReferenceField('PaymentTransaction')
    
    # Razorpay refund identifier
    razorpay_refund_id = StringField(max_length=100)
    
    # Refund details
    amount = IntField(required=True, min_value=0)  # Amount in paise
    refund_type = StringField(
        required=True,
        choices=['full', 'partial'],
        default='full'
    )
    reason = StringField(max_length=500)
    
    # Admin tracking
    initiated_by = ReferenceField('User')  # Admin user who initiated refund
    
    # Status
    status = StringField(
        required=True,
        choices=['pending', 'processed', 'failed'],
        default='pending'
    )
    
    # Timestamps
    created_at = DateTimeField(default=datetime.utcnow)
    processed_at = DateTimeField()
    
    meta = {
        'collection': 'refunds',
        'indexes': [
            {'fields': ['razorpay_refund_id'], 'sparse': True},
            'order_id',
            'payment_transaction_id',
            'status',
            'created_at',
            {'fields': ['-created_at']},
            {'fields': ['status', 'created_at']},
        ]
    }
    
    def mark_processed(self):
        """Mark refund as processed."""
        self.status = 'processed'
        self.processed_at = datetime.utcnow()
        self.save()
    
    def mark_failed(self):
        """Mark refund as failed."""
        self.status = 'failed'
        self.save()
    
    def to_dict(self):
        """Convert refund to dictionary."""
        return {
            'id': str(self.id),
            'order_id': str(self.order_id.id) if self.order_id else None,
            'payment_transaction_id': str(self.payment_transaction_id.id) if self.payment_transaction_id else None,
            'razorpay_refund_id': self.razorpay_refund_id,
            'amount': self.amount,
            'refund_type': self.refund_type,
            'reason': self.reason,
            'initiated_by': str(self.initiated_by.id) if self.initiated_by else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None
        }
