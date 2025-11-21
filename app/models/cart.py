"""Cart model for managing shopping cart data."""
from datetime import datetime
from mongoengine import (
    Document, EmbeddedDocument, StringField, FloatField, 
    IntField, DateTimeField, ListField, EmbeddedDocumentField,
    ReferenceField
)


class CartItem(EmbeddedDocument):
    """Embedded document for cart items."""
    
    product_id = StringField(required=True)
    product_name = StringField(required=True, max_length=200)
    variant_id = StringField()  # Optional variant identifier
    quantity = IntField(required=True, min_value=1)
    unit_price = FloatField(required=True, min_value=0)
    total_price = FloatField(required=True, min_value=0)
    
    # Optional product details
    image_url = StringField()
    weight = FloatField()  # Weight in grams
    gold_purity = StringField()
    
    def to_dict(self):
        """Convert cart item to dictionary."""
        return {
            'product_id': self.product_id,
            'product_name': self.product_name,
            'variant_id': self.variant_id,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total_price': self.total_price,
            'image_url': self.image_url,
            'weight': self.weight,
            'gold_purity': self.gold_purity
        }


class Cart(Document):
    """Cart document model for managing shopping cart."""
    
    # User identification (either user_id or session_id)
    user_id = ReferenceField('User')  # For authenticated users
    session_id = StringField()  # For guest users
    
    # Cart items
    items = ListField(EmbeddedDocumentField(CartItem))
    
    # Totals
    subtotal = FloatField(default=0.0, min_value=0)
    
    # Timestamps
    created_at = DateTimeField(default=datetime.utcnow)
    last_updated = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'carts',
        'indexes': [
            'user_id',
            'session_id',
            'last_updated',
            {'fields': ['user_id'], 'sparse': True},
            {'fields': ['session_id'], 'sparse': True},
        ]
    }
    
    def save(self, *args, **kwargs):
        """Override save to update timestamp."""
        self.last_updated = datetime.utcnow()
        return super(Cart, self).save(*args, **kwargs)
    
    def calculate_subtotal(self):
        """Calculate cart subtotal from items."""
        self.subtotal = sum(item.total_price for item in self.items)
        return self.subtotal
    
    def to_dict(self):
        """Convert cart to dictionary."""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id.id) if self.user_id else None,
            'session_id': self.session_id,
            'items': [item.to_dict() for item in self.items],
            'subtotal': self.subtotal,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }
