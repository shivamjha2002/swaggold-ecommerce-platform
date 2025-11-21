"""Khata transaction model for tracking customer credit/debit transactions."""
from datetime import datetime
from mongoengine import (
    Document, ReferenceField, StringField, FloatField, DateTimeField
)
from .customer import Customer


class KhataTransaction(Document):
    """Khata transaction document model."""
    
    # Reference to customer
    customer = ReferenceField(Customer, required=True)
    
    # Transaction details
    transaction_type = StringField(
        required=True,
        choices=['credit', 'debit']
    )
    # credit = customer pays money (reduces balance)
    # debit = customer owes money (increases balance)
    
    amount = FloatField(required=True, min_value=0)
    balance_after = FloatField(required=True)
    
    # Additional information
    description = StringField()
    payment_method = StringField(
        choices=['cash', 'upi', 'card', 'cheque', 'bank_transfer']
    )
    reference_number = StringField()  # For UPI/cheque/bank transfer
    
    # Metadata
    created_at = DateTimeField(default=datetime.utcnow)
    created_by = StringField()  # Admin user who created the transaction
    
    meta = {
        'collection': 'khata_transactions',
        'indexes': [
            'customer',
            {'fields': ['-created_at']},  # Descending order for recent first
            'transaction_type',
            {'fields': ['customer', '-created_at']},
        ]
    }
    
    def to_dict(self):
        """
        Convert transaction to dictionary.
        
        Returns:
            dict: Transaction data
        """
        return {
            'id': str(self.id),
            'customer_id': str(self.customer.id),
            'customer_name': self.customer.name,
            'transaction_type': self.transaction_type,
            'amount': self.amount,
            'balance_after': self.balance_after,
            'description': self.description,
            'payment_method': self.payment_method,
            'reference_number': self.reference_number,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_by': self.created_by
        }
    
    @classmethod
    def get_customer_transactions(cls, customer_id, limit=50, skip=0):
        """
        Get transactions for a specific customer.
        
        Args:
            customer_id: Customer ID
            limit: Maximum number of transactions to return
            skip: Number of transactions to skip (for pagination)
        
        Returns:
            list: List of transactions
        """
        transactions = cls.objects(
            customer=customer_id
        ).order_by('-created_at').skip(skip).limit(limit)
        
        return [t.to_dict() for t in transactions]
    
    @classmethod
    def get_transaction_summary(cls, customer_id):
        """
        Get transaction summary for a customer.
        
        Args:
            customer_id: Customer ID
        
        Returns:
            dict: Summary statistics
        """
        transactions = cls.objects(customer=customer_id)
        
        total_debits = sum(
            t.amount for t in transactions if t.transaction_type == 'debit'
        )
        total_credits = sum(
            t.amount for t in transactions if t.transaction_type == 'credit'
        )
        
        return {
            'total_transactions': transactions.count(),
            'total_debits': total_debits,
            'total_credits': total_credits,
            'net_balance': total_debits - total_credits
        }
