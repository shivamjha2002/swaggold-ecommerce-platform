"""Address models for shipping and billing information."""
from datetime import datetime
from mongoengine import (
    Document, EmbeddedDocument, StringField, DateTimeField,
    ReferenceField, BooleanField
)


class Address(Document):
    """Standalone document for user addresses."""
    
    user_id = ReferenceField('User', required=True)
    full_name = StringField(required=True, max_length=200)
    phone = StringField(required=True, max_length=15)
    address_line1 = StringField(required=True, max_length=500)
    address_line2 = StringField(max_length=500)
    city = StringField(required=True, max_length=100)
    state = StringField(required=True, max_length=100)
    pin_code = StringField(required=True, max_length=10)
    landmark = StringField(max_length=200)
    is_default = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'addresses',
        'indexes': [
            'user_id',
            {'fields': ['user_id', '-created_at']}
        ]
    }
    
    def save(self, *args, **kwargs):
        """Override save to update timestamp."""
        self.updated_at = datetime.utcnow()
        return super(Address, self).save(*args, **kwargs)
    
    def to_dict(self):
        """Convert address to dictionary."""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id.id) if self.user_id else None,
            'full_name': self.full_name,
            'phone': self.phone,
            'address_line1': self.address_line1,
            'address_line2': self.address_line2,
            'city': self.city,
            'state': self.state,
            'pin_code': self.pin_code,
            'landmark': self.landmark,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ShippingAddress(EmbeddedDocument):
    """Embedded document for shipping address."""
    
    full_name = StringField(required=True, max_length=200)
    mobile = StringField(required=True, max_length=15)
    email = StringField(max_length=200)
    address_line1 = StringField(required=True, max_length=500)
    address_line2 = StringField(max_length=500)
    city = StringField(required=True, max_length=100)
    state = StringField(required=True, max_length=100)
    pin_code = StringField(required=True, max_length=10)
    landmark = StringField(max_length=200)
    preferred_delivery_date = DateTimeField()
    
    def to_dict(self):
        """Convert shipping address to dictionary."""
        return {
            'full_name': self.full_name,
            'mobile': self.mobile,
            'email': self.email,
            'address_line1': self.address_line1,
            'address_line2': self.address_line2,
            'city': self.city,
            'state': self.state,
            'pin_code': self.pin_code,
            'landmark': self.landmark,
            'preferred_delivery_date': self.preferred_delivery_date.isoformat() if self.preferred_delivery_date else None
        }


class BillingAddress(EmbeddedDocument):
    """Embedded document for billing address."""
    
    full_name = StringField(required=True, max_length=200)
    mobile = StringField(required=True, max_length=15)
    email = StringField(max_length=200)
    address_line1 = StringField(required=True, max_length=500)
    address_line2 = StringField(max_length=500)
    city = StringField(required=True, max_length=100)
    state = StringField(required=True, max_length=100)
    pin_code = StringField(required=True, max_length=10)
    
    def to_dict(self):
        """Convert billing address to dictionary."""
        return {
            'full_name': self.full_name,
            'mobile': self.mobile,
            'email': self.email,
            'address_line1': self.address_line1,
            'address_line2': self.address_line2,
            'city': self.city,
            'state': self.state,
            'pin_code': self.pin_code
        }
