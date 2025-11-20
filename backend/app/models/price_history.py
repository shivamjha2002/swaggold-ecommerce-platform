"""Price history models for tracking gold, silver, and diamond prices."""
from datetime import datetime
from mongoengine import (
    Document, StringField, FloatField, DateTimeField, IntField, DictField
)


class PriceHistory(Document):
    """Price history for metals (gold, silver, platinum)."""
    
    # Metal information
    metal_type = StringField(
        required=True,
        choices=['gold', 'silver', 'platinum']
    )
    purity = StringField()  # e.g., '916', '999', '750'
    
    # Price information
    price_per_gram = FloatField(required=True, min_value=0)
    currency = StringField(default='INR')
    
    # Metadata
    date = DateTimeField(required=True, default=datetime.utcnow)
    source = StringField()  # e.g., 'manual', 'api', 'market_data'
    
    meta = {
        'collection': 'price_history',
        'indexes': [
            {'fields': ['metal_type', '-date']},
            {'fields': ['-date']},
            {'fields': ['metal_type', 'purity', '-date']},
        ]
    }
    
    def to_dict(self):
        """
        Convert price history to dictionary.
        
        Returns:
            dict: Price history data
        """
        return {
            'id': str(self.id),
            'metal_type': self.metal_type,
            'purity': self.purity,
            'price_per_gram': self.price_per_gram,
            'currency': self.currency,
            'date': self.date.isoformat() if self.date else None,
            'source': self.source
        }
    
    @classmethod
    def get_latest_price(cls, metal_type='gold', purity='916'):
        """
        Get the latest price for a metal type and purity.
        
        Args:
            metal_type: Type of metal
            purity: Purity level
        
        Returns:
            PriceHistory: Latest price record or None
        """
        return cls.objects(
            metal_type=metal_type,
            purity=purity
        ).order_by('-date').first()
    
    @classmethod
    def get_price_trend(cls, metal_type='gold', purity='916', days=30):
        """
        Get price trend for specified days.
        
        Args:
            metal_type: Type of metal
            purity: Purity level
            days: Number of days to look back
        
        Returns:
            list: List of price records
        """
        from datetime import timedelta
        
        start_date = datetime.utcnow() - timedelta(days=days)
        prices = cls.objects(
            metal_type=metal_type,
            purity=purity,
            date__gte=start_date
        ).order_by('date')
        
        return [p.to_dict() for p in prices]


class DiamondPriceHistory(Document):
    """Price history for diamonds based on 4Cs."""
    
    # Diamond characteristics (4Cs)
    carat = FloatField(required=True, min_value=0)
    cut = StringField(
        required=True,
        choices=['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor']
    )
    color = StringField(
        required=True,
        choices=['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']
    )
    clarity = StringField(
        required=True,
        choices=['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3']
    )
    
    # Price information
    price = FloatField(required=True, min_value=0)
    currency = StringField(default='INR')
    
    # Metadata
    date = DateTimeField(required=True, default=datetime.utcnow)
    source = StringField()
    
    meta = {
        'collection': 'diamond_price_history',
        'indexes': [
            {'fields': ['-date']},
            {'fields': ['carat', 'cut', 'color', 'clarity']},
            {'fields': ['cut', 'color', 'clarity', '-date']},
        ]
    }
    
    def to_dict(self):
        """
        Convert diamond price history to dictionary.
        
        Returns:
            dict: Diamond price history data
        """
        return {
            'id': str(self.id),
            'carat': self.carat,
            'cut': self.cut,
            'color': self.color,
            'clarity': self.clarity,
            'price': self.price,
            'currency': self.currency,
            'date': self.date.isoformat() if self.date else None,
            'source': self.source
        }
    
    @classmethod
    def get_similar_diamonds(cls, carat, cut, color, clarity, tolerance=0.1):
        """
        Get diamonds with similar characteristics.
        
        Args:
            carat: Diamond carat weight
            cut: Cut quality
            color: Color grade
            clarity: Clarity grade
            tolerance: Carat weight tolerance
        
        Returns:
            list: List of similar diamond price records
        """
        diamonds = cls.objects(
            carat__gte=carat - tolerance,
            carat__lte=carat + tolerance,
            cut=cut,
            color=color,
            clarity=clarity
        ).order_by('-date').limit(10)
        
        return [d.to_dict() for d in diamonds]


class TrainingLog(Document):
    """Log for ML model training sessions."""
    
    model_name = StringField(required=True)
    metrics = DictField()  # Store training metrics like R2, RMSE, etc.
    data_points = IntField()  # Number of data points used for training
    trained_at = DateTimeField(default=datetime.utcnow)
    model_version = StringField()
    notes = StringField()
    
    meta = {
        'collection': 'training_logs',
        'indexes': [
            {'fields': ['model_name', '-trained_at']},
            {'fields': ['-trained_at']},
        ]
    }
    
    def to_dict(self):
        """
        Convert training log to dictionary.
        
        Returns:
            dict: Training log data
        """
        return {
            'id': str(self.id),
            'model_name': self.model_name,
            'metrics': self.metrics,
            'data_points': self.data_points,
            'trained_at': self.trained_at.isoformat() if self.trained_at else None,
            'model_version': self.model_version,
            'notes': self.notes
        }
