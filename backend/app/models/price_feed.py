"""Price feed model for caching Gemini API price data."""
from datetime import datetime
from mongoengine import (
    Document, StringField, FloatField, DateTimeField
)


class PriceFeed(Document):
    """Price feed document model for caching market prices."""
    
    # Symbol identification
    symbol = StringField(required=True, unique=True, max_length=20)  # e.g., 'BTCUSD', 'ETHUSD'
    exchange = StringField(default='gemini', max_length=50)
    
    # Price data
    last_price = FloatField(required=True, min_value=0)
    bid = FloatField(min_value=0)  # Best bid price
    ask = FloatField(min_value=0)  # Best ask price
    volume = FloatField(min_value=0)  # 24h volume
    
    # Metadata
    last_updated = DateTimeField(required=True, default=datetime.utcnow)
    fetch_error = StringField(max_length=500)  # Store last error if fetch failed
    
    meta = {
        'collection': 'price_feeds',
        'indexes': [
            {'fields': ['symbol'], 'unique': True},
            'last_updated',
            {'fields': ['-last_updated']},
        ]
    }
    
    def update_price(self, last_price, bid=None, ask=None, volume=None):
        """
        Update price data.
        
        Args:
            last_price: Latest price
            bid: Best bid price (optional)
            ask: Best ask price (optional)
            volume: 24h volume (optional)
        """
        self.last_price = last_price
        if bid is not None:
            self.bid = bid
        if ask is not None:
            self.ask = ask
        if volume is not None:
            self.volume = volume
        self.last_updated = datetime.utcnow()
        self.fetch_error = None  # Clear any previous error
        self.save()
    
    def set_error(self, error_message):
        """
        Set fetch error message.
        
        Args:
            error_message: Error message to store
        """
        self.fetch_error = error_message
        self.last_updated = datetime.utcnow()
        self.save()
    
    def to_dict(self):
        """Convert price feed to dictionary."""
        return {
            'id': str(self.id),
            'symbol': self.symbol,
            'exchange': self.exchange,
            'last_price': self.last_price,
            'bid': self.bid,
            'ask': self.ask,
            'volume': self.volume,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None,
            'fetch_error': self.fetch_error
        }
