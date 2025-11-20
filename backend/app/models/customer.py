"""Customer model for managing customer information."""
from datetime import datetime
from mongoengine import (
    Document, StringField, FloatField, DateTimeField
)


class Customer(Document):
    """Customer document model."""
    
    # Basic information
    name = StringField(required=True, max_length=200)
    phone = StringField(required=True, unique=True, max_length=15)
    email = StringField(max_length=200)
    address = StringField()
    
    # Financial tracking
    current_balance = FloatField(default=0.0)
    # Positive balance = customer owes money to store
    # Negative balance = store owes money to customer
    
    # Timestamps
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'customers',
        'indexes': [
            {'fields': ['phone'], 'unique': True},
            'email',
            {'fields': ['current_balance']},
            {'fields': ['name']},
        ]
    }
    
    def save(self, *args, **kwargs):
        """Override save to update timestamp."""
        self.updated_at = datetime.utcnow()
        return super(Customer, self).save(*args, **kwargs)
    
    def update_balance(self, amount, transaction_type):
        """
        Update customer balance.
        
        Args:
            amount: Transaction amount (positive value)
            transaction_type: 'credit' or 'debit'
        
        Returns:
            float: New balance after update
        """
        if transaction_type == 'debit':
            # Customer owes more money (purchase)
            self.current_balance += amount
        elif transaction_type == 'credit':
            # Customer pays money (payment)
            self.current_balance -= amount
        else:
            raise ValueError(f"Invalid transaction type: {transaction_type}")
        
        self.save()
        return self.current_balance
    
    def get_balance_status(self):
        """
        Get human-readable balance status.
        
        Returns:
            dict: Balance status information
        """
        if self.current_balance > 0:
            status = 'owes'
            message = f"Customer owes ₹{abs(self.current_balance):.2f}"
        elif self.current_balance < 0:
            status = 'credit'
            message = f"Store owes ₹{abs(self.current_balance):.2f}"
        else:
            status = 'clear'
            message = "Account is clear"
        
        return {
            'balance': self.current_balance,
            'status': status,
            'message': message
        }
    
    def to_dict(self):
        """
        Convert customer to dictionary.
        
        Returns:
            dict: Customer data
        """
        return {
            'id': str(self.id),
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'current_balance': self.current_balance,
            'balance_status': self.get_balance_status(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
