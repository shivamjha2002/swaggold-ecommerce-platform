"""Symbol-based price history model for tracking Gemini API price data over time."""
from datetime import datetime, timedelta
from mongoengine import (
    Document, StringField, FloatField, DateTimeField
)


class SymbolPriceHistory(Document):
    """
    Price history for symbol-based trading pairs (e.g., GOLD, BTCUSD, ETHUSD).
    
    This model stores historical snapshots of prices from the Gemini API
    to enable trend analysis and charting.
    """
    
    # Symbol identification
    symbol = StringField(required=True, max_length=20)  # e.g., 'GOLD', 'BTCUSD'
    exchange = StringField(default='gemini', max_length=50)
    
    # Price data
    price = FloatField(required=True, min_value=0)
    bid = FloatField(min_value=0)
    ask = FloatField(min_value=0)
    volume = FloatField(min_value=0)
    
    # Metadata
    timestamp = DateTimeField(required=True, default=datetime.utcnow)
    source = StringField(default='scheduled')  # 'scheduled', 'manual', 'api'
    
    meta = {
        'collection': 'symbol_price_history',
        'indexes': [
            {'fields': ['symbol', '-timestamp']},
            {'fields': ['-timestamp']},
            {'fields': ['symbol', 'timestamp']},
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
            'symbol': self.symbol,
            'exchange': self.exchange,
            'price': self.price,
            'bid': self.bid,
            'ask': self.ask,
            'volume': self.volume,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'source': self.source
        }
    
    @classmethod
    def get_history(cls, symbol, range_param='1M'):
        """
        Get price history for a symbol within a specified time range.
        
        Args:
            symbol: Trading pair symbol (e.g., 'GOLD', 'BTCUSD')
            range_param: Time range ('1D', '1W', '1M', '3M', '1Y')
        
        Returns:
            list: List of price history records formatted for charting
        """
        # Map range parameter to days
        range_map = {
            '1D': 1,
            '1W': 7,
            '1M': 30,
            '3M': 90,
            '1Y': 365
        }
        
        days = range_map.get(range_param, 30)  # Default to 1 month
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Query price history
        history = cls.objects(
            symbol=symbol,
            timestamp__gte=start_date
        ).order_by('timestamp')
        
        # Format for charting (simplified structure)
        return [
            {
                'timestamp': record.timestamp.isoformat() if record.timestamp else None,
                'price': record.price
            }
            for record in history
        ]
    
    @classmethod
    def get_latest_snapshot(cls, symbol):
        """
        Get the most recent price snapshot for a symbol.
        
        Args:
            symbol: Trading pair symbol
        
        Returns:
            SymbolPriceHistory: Latest snapshot or None
        """
        return cls.objects(symbol=symbol).order_by('-timestamp').first()
    
    @classmethod
    def create_snapshot(cls, symbol, price, bid=None, ask=None, volume=None, exchange='gemini', source='scheduled'):
        """
        Create a new price snapshot.
        
        Args:
            symbol: Trading pair symbol
            price: Current price
            bid: Bid price (optional)
            ask: Ask price (optional)
            volume: Volume (optional)
            exchange: Exchange name
            source: Source of the snapshot
        
        Returns:
            SymbolPriceHistory: Created snapshot
        """
        snapshot = cls(
            symbol=symbol,
            exchange=exchange,
            price=price,
            bid=bid,
            ask=ask,
            volume=volume,
            timestamp=datetime.utcnow(),
            source=source
        )
        snapshot.save()
        return snapshot
