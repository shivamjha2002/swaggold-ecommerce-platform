"""Product model for jewelry items."""
from datetime import datetime
from mongoengine import (
    Document, StringField, FloatField, IntField, 
    BooleanField, DateTimeField
)


class Product(Document):
    """Product document model for jewelry items."""
    
    # Basic information
    name = StringField(required=True, max_length=200)
    category = StringField(
        required=True,
        choices=[
            'Nath', 'Pendant Set', 'Tika', 'Necklace', 'Earrings',
            'Bangles', 'Ring', 'Bracelet', 'Bridal Set'
        ]
    )
    
    # Pricing and weight
    base_price = FloatField(required=True, min_value=0)
    weight = FloatField(required=True, min_value=0)  # in grams
    gold_purity = StringField(
        choices=['916', '750', '585'],
        default='916'
    )
    
    # Additional details
    description = StringField()
    image_url = StringField()
    stock_quantity = IntField(default=0, min_value=0)
    
    # Status and timestamps
    status = StringField(
        required=True,
        choices=['draft', 'published'],
        default='draft'
    )
    published_at = DateTimeField()
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'products',
        'indexes': [
            'category',
            'is_active',
            'status',
            {'fields': ['base_price']},
            {'fields': ['weight']},
            {'fields': ['category', 'is_active']},
            {'fields': ['status', 'category', 'is_active']},
        ]
    }
    
    def save(self, *args, **kwargs):
        """Override save to update timestamp."""
        self.updated_at = datetime.utcnow()
        return super(Product, self).save(*args, **kwargs)
    
    def publish(self):
        """
        Publish a draft product.
        
        Sets status to 'published' and records the publish timestamp.
        """
        self.status = 'published'
        self.published_at = datetime.utcnow()
        self.save()
    
    def unpublish(self):
        """
        Unpublish a product back to draft.
        
        Sets status to 'draft' and clears the publish timestamp.
        """
        self.status = 'draft'
        self.published_at = None
        self.save()
    
    def calculate_current_price(self, current_gold_rate=None):
        """
        Calculate current price based on gold rate.
        
        Args:
            current_gold_rate: Current gold price per gram. If None, fetches from database.
        
        Returns:
            float: Calculated current price including making charges
        """
        if current_gold_rate is None:
            current_gold_rate = self._get_current_gold_rate()
        
        # Calculate gold value based on weight and purity
        purity_factor = {
            '916': 0.916,  # 22 karat
            '750': 0.750,  # 18 karat
            '585': 0.585   # 14 karat
        }
        
        pure_gold_weight = self.weight * purity_factor.get(self.gold_purity, 0.916)
        gold_value = pure_gold_weight * current_gold_rate
        
        # Add 15% making charges
        making_charges = gold_value * 0.15
        
        return round(gold_value + making_charges, 2)
    
    def _get_current_gold_rate(self):
        """
        Get current gold rate from price history.
        
        Returns:
            float: Current gold price per gram
        """
        from .price_history import PriceHistory
        
        try:
            # Get the most recent gold price
            latest_price = PriceHistory.objects(
                metal_type='gold',
                purity='916'
            ).order_by('-date').first()
            
            if latest_price:
                return latest_price.price_per_gram
            else:
                # Default fallback price if no history exists
                return 6500.0
        except Exception:
            # Fallback to default price on error
            return 6500.0
    
    def to_dict(self, include_current_price=False):
        """
        Convert product to dictionary.
        
        Args:
            include_current_price: Whether to include calculated current price
        
        Returns:
            dict: Product data
        """
        data = {
            'id': str(self.id),
            'name': self.name,
            'category': self.category,
            'base_price': self.base_price,
            'weight': self.weight,
            'gold_purity': self.gold_purity,
            'description': self.description,
            'image_url': self.image_url,
            'stock_quantity': self.stock_quantity,
            'status': self.status,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_current_price:
            data['current_price'] = self.calculate_current_price()
        
        return data
