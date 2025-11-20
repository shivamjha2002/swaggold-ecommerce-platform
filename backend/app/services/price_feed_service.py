"""Price feed service for Gemini API integration."""
import logging
import requests
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from flask import current_app
from ..models.price_feed import PriceFeed
from ..models.symbol_price_history import SymbolPriceHistory

logger = logging.getLogger(__name__)


class PriceFeedService:
    """Service for managing cryptocurrency price feeds from Gemini API."""
    
    GEMINI_API_BASE = "https://api.gemini.com/v1"
    CACHE_VALIDITY_SECONDS = 60  # Consider cache valid for 60 seconds
    GOLD_CACHE_VALIDITY_SECONDS = 300  # Gold prices cached for 5 minutes
    
    # Gold symbol mapping - Gemini doesn't have gold, so we'll use a placeholder
    # In production, you'd integrate with a real gold price API
    GOLD_SYMBOLS = ['GOLD', 'XAUUSD', 'XAU']
    
    @staticmethod
    def fetch_gemini_price(symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetch current price from Gemini public ticker API.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSD', 'ETHUSD')
            
        Returns:
            Dictionary with price data or None if fetch fails
            
        Example response from Gemini:
        {
            "bid": "9199.33",
            "ask": "9199.64",
            "volume": {
                "BTC": "3456.123",
                "USD": "31234567.89",
                "timestamp": 1592508000000
            },
            "last": "9199.64"
        }
        """
        try:
            # Gemini expects lowercase symbol
            symbol_lower = symbol.lower()
            url = f"{PriceFeedService.GEMINI_API_BASE}/pubticker/{symbol_lower}"
            
            logger.info(f"Fetching price for {symbol} from Gemini API: {url}")
            
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Parse the response
            price_data = {
                'last_price': float(data.get('last', 0)),
                'bid': float(data.get('bid', 0)),
                'ask': float(data.get('ask', 0)),
                'volume': float(data.get('volume', {}).get(symbol[:3], 0)) if isinstance(data.get('volume'), dict) else 0
            }
            
            logger.info(f"Successfully fetched price for {symbol}: ${price_data['last_price']}")
            return price_data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch price for {symbol} from Gemini API: {str(e)}")
            return None
        except (ValueError, KeyError) as e:
            logger.error(f"Failed to parse Gemini API response for {symbol}: {str(e)}")
            return None
    
    @staticmethod
    def update_price_cache(symbol: str) -> Optional[PriceFeed]:
        """
        Update price cache for a specific symbol.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSD', 'ETHUSD')
            
        Returns:
            Updated PriceFeed object or None if update fails
        """
        try:
            # Fetch fresh price data
            price_data = PriceFeedService.fetch_gemini_price(symbol)
            
            if price_data is None:
                # Fetch failed, update error in existing record if it exists
                price_feed = PriceFeed.objects(symbol=symbol).first()
                if price_feed:
                    price_feed.set_error("Failed to fetch price from Gemini API")
                    logger.warning(f"Updated error status for {symbol}")
                    return price_feed
                else:
                    logger.error(f"No existing cache for {symbol} and fetch failed")
                    return None
            
            # Get or create price feed record
            price_feed = PriceFeed.objects(symbol=symbol).first()
            
            if price_feed:
                # Update existing record
                price_feed.update_price(
                    last_price=price_data['last_price'],
                    bid=price_data.get('bid'),
                    ask=price_data.get('ask'),
                    volume=price_data.get('volume')
                )
                logger.info(f"Updated cache for {symbol}")
            else:
                # Create new record
                price_feed = PriceFeed(
                    symbol=symbol,
                    exchange='gemini',
                    last_price=price_data['last_price'],
                    bid=price_data.get('bid'),
                    ask=price_data.get('ask'),
                    volume=price_data.get('volume'),
                    last_updated=datetime.utcnow()
                )
                price_feed.save()
                logger.info(f"Created new cache entry for {symbol}")
            
            return price_feed
            
        except Exception as e:
            logger.error(f"Error updating price cache for {symbol}: {str(e)}")
            return None
    
    @staticmethod
    def get_cached_price(symbol: str, max_age_seconds: Optional[int] = None) -> Optional[PriceFeed]:
        """
        Get cached price with fallback to last cached value.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSD', 'ETHUSD')
            max_age_seconds: Maximum age of cache in seconds (default: CACHE_VALIDITY_SECONDS)
            
        Returns:
            PriceFeed object with cached price or None if no cache exists
        """
        try:
            price_feed = PriceFeed.objects(symbol=symbol).first()
            
            if not price_feed:
                logger.warning(f"No cached price found for {symbol}")
                return None
            
            # Check cache age
            if max_age_seconds is None:
                max_age_seconds = PriceFeedService.CACHE_VALIDITY_SECONDS
            
            cache_age = (datetime.utcnow() - price_feed.last_updated).total_seconds()
            
            if cache_age > max_age_seconds:
                logger.info(f"Cache for {symbol} is stale ({cache_age:.0f}s old), attempting refresh")
                # Try to refresh, but return stale data if refresh fails
                updated_feed = PriceFeedService.update_price_cache(symbol)
                if updated_feed:
                    return updated_feed
                else:
                    logger.warning(f"Refresh failed for {symbol}, returning stale cache")
                    return price_feed
            
            logger.info(f"Returning cached price for {symbol} (age: {cache_age:.0f}s)")
            return price_feed
            
        except Exception as e:
            logger.error(f"Error getting cached price for {symbol}: {str(e)}")
            return None
    
    @staticmethod
    def get_all_prices() -> List[PriceFeed]:
        """
        Get all cached prices for admin dashboard.
        
        Returns:
            List of all PriceFeed objects
        """
        try:
            price_feeds = PriceFeed.objects().order_by('-last_updated')
            logger.info(f"Retrieved {len(price_feeds)} price feeds")
            return list(price_feeds)
        except Exception as e:
            logger.error(f"Error getting all prices: {str(e)}")
            return []
    
    @staticmethod
    def force_refresh_prices(symbols: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Force refresh prices for specified symbols or all configured symbols.
        
        Args:
            symbols: List of symbols to refresh (if None, refresh all configured symbols)
            
        Returns:
            Dictionary with refresh results
        """
        try:
            # Get symbols from config if not provided
            if symbols is None:
                symbols_str = current_app.config.get('GEMINI_SYMBOLS', 'BTCUSD,ETHUSD')
                symbols = [s.strip() for s in symbols_str.split(',')]
            
            results = {
                'success': [],
                'failed': [],
                'total': len(symbols)
            }
            
            for symbol in symbols:
                logger.info(f"Force refreshing price for {symbol}")
                price_feed = PriceFeedService.update_price_cache(symbol)
                
                if price_feed and not price_feed.fetch_error:
                    results['success'].append(symbol)
                else:
                    results['failed'].append(symbol)
            
            logger.info(f"Force refresh completed: {len(results['success'])} success, {len(results['failed'])} failed")
            return results
            
        except Exception as e:
            logger.error(f"Error during force refresh: {str(e)}")
            return {
                'success': [],
                'failed': symbols if symbols else [],
                'total': len(symbols) if symbols else 0,
                'error': str(e)
            }
    
    @staticmethod
    def convert_usd_to_inr(usd_amount: float, exchange_rate: Optional[float] = None) -> float:
        """
        Convert USD amount to INR using configurable exchange rate.
        
        Args:
            usd_amount: Amount in USD
            exchange_rate: USD to INR exchange rate (if None, use config value)
            
        Returns:
            Amount in INR
        """
        try:
            if exchange_rate is None:
                exchange_rate = current_app.config.get('USD_TO_INR_RATE', 83.0)
            
            inr_amount = usd_amount * exchange_rate
            logger.debug(f"Converted ${usd_amount} to ₹{inr_amount} (rate: {exchange_rate})")
            return round(inr_amount, 2)
            
        except Exception as e:
            logger.error(f"Error converting USD to INR: {str(e)}")
            # Return a default conversion as fallback
            return round(usd_amount * 83.0, 2)
    
    @staticmethod
    def fetch_gold_price() -> Optional[Dict[str, Any]]:
        """
        Fetch current gold price from external API.
        
        Note: Gemini doesn't provide gold prices. This method uses a fallback
        mechanism or can be integrated with a real gold price API.
        
        Returns:
            Dictionary with gold price data or None if fetch fails
        """
        try:
            # TODO: Integrate with a real gold price API (e.g., Metals-API, GoldAPI.io)
            # For now, we'll use a mock price based on approximate market rates
            # In production, replace this with actual API integration
            
            logger.warning("Using mock gold price - integrate with real gold price API for production")
            
            # Mock gold price: ~$2000 per troy ounce (31.1g)
            # This is approximate and should be replaced with real API data
            price_per_troy_ounce = 2000.0  # USD
            price_per_gram = price_per_troy_ounce / 31.1035  # Convert to per gram
            
            price_data = {
                'last_price': round(price_per_gram, 2),
                'bid': round(price_per_gram * 0.999, 2),
                'ask': round(price_per_gram * 1.001, 2),
                'volume': 0.0,
                'unit': 'gram',
                'currency': 'USD'
            }
            
            logger.info(f"Fetched gold price: ${price_data['last_price']}/gram")
            return price_data
            
        except Exception as e:
            logger.error(f"Failed to fetch gold price: {str(e)}")
            return None
    
    @staticmethod
    def get_gold_price_live() -> Optional[Dict[str, Any]]:
        """
        Get live gold price with 5-minute caching and INR conversion.
        
        Returns:
            Dictionary with formatted gold price data including:
            - price: Price in INR per 10 grams
            - currency: 'INR'
            - per_unit: '10g'
            - last_updated: ISO timestamp
            - usd_price_per_gram: Original USD price per gram
        """
        try:
            symbol = 'GOLD'
            
            # Try to get cached price (5-minute validity)
            price_feed = PriceFeedService.get_cached_price(
                symbol, 
                max_age_seconds=PriceFeedService.GOLD_CACHE_VALIDITY_SECONDS
            )
            
            # If no cache or cache refresh failed, try direct fetch
            if not price_feed:
                logger.info("No cached gold price, fetching fresh data")
                price_data = PriceFeedService.fetch_gold_price()
                
                if price_data:
                    # Create new cache entry
                    price_feed = PriceFeed(
                        symbol=symbol,
                        exchange='mock',  # Change to actual exchange when integrated
                        last_price=price_data['last_price'],
                        bid=price_data.get('bid'),
                        ask=price_data.get('ask'),
                        volume=price_data.get('volume', 0),
                        last_updated=datetime.utcnow()
                    )
                    price_feed.save()
                    logger.info(f"Created new gold price cache entry")
                else:
                    logger.error("Failed to fetch gold price and no cache available")
                    return None
            
            # Convert to INR per 10 grams
            usd_per_gram = price_feed.last_price
            inr_per_gram = PriceFeedService.convert_usd_to_inr(usd_per_gram)
            inr_per_10g = round(inr_per_gram * 10, 2)
            
            # Format response
            response = {
                'price': inr_per_10g,
                'currency': 'INR',
                'per_unit': '10g',
                'last_updated': price_feed.last_updated.isoformat() if price_feed.last_updated else None,
                'usd_price_per_gram': usd_per_gram,
                'exchange_rate': current_app.config.get('USD_TO_INR_RATE', 83.0)
            }
            
            # Add cache status if there was an error
            if price_feed.fetch_error:
                response['cache_status'] = 'stale_with_error'
                response['warning'] = 'Showing cached data due to API error'
            else:
                response['cache_status'] = 'fresh'
            
            logger.info(f"Returning gold price: ₹{inr_per_10g}/10g")
            return response
            
        except Exception as e:
            logger.error(f"Error getting live gold price: {str(e)}")
            return None
    
    @staticmethod
    def update_gold_price_cache() -> Optional[PriceFeed]:
        """
        Update gold price cache.
        
        Returns:
            Updated PriceFeed object or None if update fails
        """
        try:
            symbol = 'GOLD'
            
            # Fetch fresh gold price data
            price_data = PriceFeedService.fetch_gold_price()
            
            if price_data is None:
                # Fetch failed, update error in existing record if it exists
                price_feed = PriceFeed.objects(symbol=symbol).first()
                if price_feed:
                    price_feed.set_error("Failed to fetch gold price from API")
                    logger.warning(f"Updated error status for {symbol}")
                    return price_feed
                else:
                    logger.error(f"No existing cache for {symbol} and fetch failed")
                    return None
            
            # Get or create price feed record
            price_feed = PriceFeed.objects(symbol=symbol).first()
            
            if price_feed:
                # Update existing record
                price_feed.update_price(
                    last_price=price_data['last_price'],
                    bid=price_data.get('bid'),
                    ask=price_data.get('ask'),
                    volume=price_data.get('volume', 0)
                )
                logger.info(f"Updated gold price cache")
            else:
                # Create new record
                price_feed = PriceFeed(
                    symbol=symbol,
                    exchange='mock',  # Change to actual exchange when integrated
                    last_price=price_data['last_price'],
                    bid=price_data.get('bid'),
                    ask=price_data.get('ask'),
                    volume=price_data.get('volume', 0),
                    last_updated=datetime.utcnow()
                )
                price_feed.save()
                logger.info(f"Created new gold price cache entry")
            
            return price_feed
            
        except Exception as e:
            logger.error(f"Error updating gold price cache: {str(e)}")
            return None
    
    @staticmethod
    def store_price_snapshot(symbol: str) -> Optional[SymbolPriceHistory]:
        """
        Store a price snapshot for historical tracking.
        
        Args:
            symbol: Trading pair symbol (e.g., 'GOLD', 'BTCUSD')
        
        Returns:
            SymbolPriceHistory: Created snapshot or None if failed
        """
        try:
            # Get current cached price
            price_feed = PriceFeed.objects(symbol=symbol).first()
            
            if not price_feed:
                logger.warning(f"No cached price found for {symbol}, cannot store snapshot")
                return None
            
            # Don't store snapshot if there was a fetch error
            if price_feed.fetch_error:
                logger.warning(f"Skipping snapshot for {symbol} due to fetch error: {price_feed.fetch_error}")
                return None
            
            # Create snapshot
            snapshot = SymbolPriceHistory.create_snapshot(
                symbol=symbol,
                price=price_feed.last_price,
                bid=price_feed.bid,
                ask=price_feed.ask,
                volume=price_feed.volume,
                exchange=price_feed.exchange,
                source='scheduled'
            )
            
            logger.info(f"Stored price snapshot for {symbol}: ${snapshot.price}")
            return snapshot
            
        except Exception as e:
            logger.error(f"Error storing price snapshot for {symbol}: {str(e)}")
            return None
    
    @staticmethod
    def get_price_history(symbol: str, range_param: str = '1M') -> List[Dict[str, Any]]:
        """
        Get price history for a symbol within a specified time range.
        
        Args:
            symbol: Trading pair symbol (e.g., 'GOLD', 'BTCUSD')
            range_param: Time range ('1D', '1W', '1M', '3M', '1Y')
        
        Returns:
            List of price history records formatted for charting
        """
        try:
            # Validate range parameter
            valid_ranges = ['1D', '1W', '1M', '3M', '1Y']
            if range_param not in valid_ranges:
                logger.warning(f"Invalid range parameter: {range_param}, defaulting to 1M")
                range_param = '1M'
            
            # Get history from model
            history = SymbolPriceHistory.get_history(symbol, range_param)
            
            logger.info(f"Retrieved {len(history)} price history records for {symbol} ({range_param})")
            return history
            
        except Exception as e:
            logger.error(f"Error getting price history for {symbol}: {str(e)}")
            return []
    
    @staticmethod
    def store_all_price_snapshots() -> Dict[str, Any]:
        """
        Store price snapshots for all configured symbols.
        
        Returns:
            Dictionary with snapshot results
        """
        try:
            # Get symbols from config
            symbols_str = current_app.config.get('GEMINI_SYMBOLS', 'BTCUSD,ETHUSD')
            symbols = [s.strip() for s in symbols_str.split(',')]
            
            # Always include GOLD symbol
            if 'GOLD' not in symbols:
                symbols.append('GOLD')
            
            results = {
                'success': [],
                'failed': [],
                'total': len(symbols)
            }
            
            for symbol in symbols:
                logger.info(f"Storing price snapshot for {symbol}")
                snapshot = PriceFeedService.store_price_snapshot(symbol)
                
                if snapshot:
                    results['success'].append(symbol)
                else:
                    results['failed'].append(symbol)
            
            logger.info(f"Snapshot storage completed: {len(results['success'])} success, {len(results['failed'])} failed")
            return results
            
        except Exception as e:
            logger.error(f"Error during snapshot storage: {str(e)}")
            return {
                'success': [],
                'failed': symbols if 'symbols' in locals() else [],
                'total': len(symbols) if 'symbols' in locals() else 0,
                'error': str(e)
            }
