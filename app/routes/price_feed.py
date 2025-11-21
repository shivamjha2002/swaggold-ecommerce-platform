"""Price feed API routes."""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from app.services.price_feed_service import PriceFeedService
from app.utils.decorators import auth_required, admin_required
from app.utils.rate_limiter import limiter, get_rate_limit
import logging

logger = logging.getLogger(__name__)

bp = Blueprint('price_feed', __name__)


@bp.route('/prices/gold/live', methods=['GET'])
@limiter.limit(get_rate_limit('price_feed'))
def get_gold_live_price():
    """
    Get live gold price for landing page (public endpoint).
    
    Returns:
        Formatted gold price data with:
        - price: Price in INR per 10 grams
        - currency: 'INR'
        - per_unit: '10g'
        - last_updated: ISO timestamp
        - cache_status: 'fresh' or 'stale_with_error'
        
    Note: This endpoint uses 5-minute caching to minimize API calls.
    If the external API fails, it returns the last cached value with a warning.
    """
    try:
        # Get live gold price with caching
        gold_price_data = PriceFeedService.get_gold_price_live()
        
        if not gold_price_data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 503,
                    'message': 'Gold price data temporarily unavailable',
                    'details': 'Unable to fetch gold price from external API and no cached data available'
                }
            }), 503
        
        return jsonify({
            'success': True,
            'data': gold_price_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting live gold price: {str(e)}")
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve gold price',
                'details': str(e)
            }
        }), 500


@bp.route('/prices/gold/history', methods=['GET'])
@auth_required
@limiter.limit(get_rate_limit('price_feed'))
def get_gold_price_history():
    """
    Get historical gold price data for trend charts (authenticated endpoint).
    
    Query Parameters:
        - range: Time range ('1D', '1W', '1M', '3M', '1Y') - Default: '1M'
    
    Returns:
        Time-series data formatted for charting with:
        - data: List of {timestamp, price} objects
        - range: Requested time range
        - symbol: 'GOLD'
        - count: Number of data points
        
    Note: This endpoint requires JWT authentication.
    """
    try:
        # Get range parameter from query string
        range_param = request.args.get('range', '1M').upper()
        
        # Validate range parameter
        valid_ranges = ['1D', '1W', '1M', '3M', '1Y']
        if range_param not in valid_ranges:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid range parameter',
                    'details': f'Range must be one of: {", ".join(valid_ranges)}'
                }
            }), 400
        
        # Get price history
        symbol = 'GOLD'
        history = PriceFeedService.get_price_history(symbol, range_param)
        
        # Return formatted response
        return jsonify({
            'success': True,
            'data': {
                'symbol': symbol,
                'range': range_param,
                'count': len(history),
                'history': history
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting gold price history: {str(e)}")
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve price history',
                'details': str(e)
            }
        }), 500


@bp.route('/market-price', methods=['GET'])
@limiter.limit(get_rate_limit('price_feed'))
def get_market_price():
    """
    Get cached market price for a specific symbol.
    
    Query Parameters:
        - symbol: Trading pair symbol (e.g., 'BTCUSD', 'ETHUSD') - Required
        - include_inr: Include INR conversion (default: true)
    
    Returns:
        Price data with last_updated timestamp and optional INR conversion.
        If cache is stale, attempts to refresh automatically.
    """
    try:
        # Get symbol from query parameters
        symbol = request.args.get('symbol')
        include_inr = request.args.get('include_inr', 'true').lower() == 'true'
        
        if not symbol:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'symbol parameter is required'
                }
            }), 400
        
        # Normalize symbol to uppercase
        symbol = symbol.upper()
        
        # Get cached price (will auto-refresh if stale)
        price_feed = PriceFeedService.get_cached_price(symbol)
        
        if not price_feed:
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': f'No price data available for {symbol}',
                    'details': 'Price feed may not be configured for this symbol'
                }
            }), 404
        
        # Build response
        response_data = price_feed.to_dict()
        
        # Add INR conversion if requested
        if include_inr and price_feed.last_price:
            inr_price = PriceFeedService.convert_usd_to_inr(price_feed.last_price)
            response_data['inr_price'] = inr_price
            response_data['exchange_rate'] = current_app.config.get('USD_TO_INR_RATE', 83.0)
        
        # Add cache status indicator
        if price_feed.fetch_error:
            response_data['cache_status'] = 'stale_with_error'
            response_data['warning'] = 'Showing cached data due to API error'
        else:
            response_data['cache_status'] = 'fresh'
        
        return jsonify({
            'success': True,
            'data': response_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting market price: {str(e)}")
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve market price',
                'details': str(e)
            }
        }), 500


@bp.route('/admin/prices', methods=['GET'])
@jwt_required()
@admin_required
@limiter.limit(get_rate_limit('price_feed_admin'))
def get_all_prices():
    """
    Get all cached prices for admin dashboard - Admin only.
    
    Query Parameters:
        - include_inr: Include INR conversion for all prices (default: true)
    
    Returns:
        List of all price feeds with metadata.
    """
    try:
        include_inr = request.args.get('include_inr', 'true').lower() == 'true'
        
        # Get all price feeds
        price_feeds = PriceFeedService.get_all_prices()
        
        # Convert to dict and add INR conversion
        prices_data = []
        for price_feed in price_feeds:
            price_data = price_feed.to_dict()
            
            if include_inr and price_feed.last_price:
                inr_price = PriceFeedService.convert_usd_to_inr(price_feed.last_price)
                price_data['inr_price'] = inr_price
            
            prices_data.append(price_data)
        
        return jsonify({
            'success': True,
            'data': prices_data,
            'total': len(prices_data),
            'exchange_rate': current_app.config.get('USD_TO_INR_RATE', 83.0)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting all prices: {str(e)}")
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve prices',
                'details': str(e)
            }
        }), 500


@bp.route('/admin/prices/refresh', methods=['POST'])
@jwt_required()
@admin_required
@limiter.limit(get_rate_limit('price_feed_admin'))
def refresh_prices():
    """
    Force refresh prices for all configured symbols - Admin only.
    
    Request Body (optional):
        - symbols: List of symbols to refresh (if not provided, refreshes all configured symbols)
    
    Returns:
        Refresh results with success/failure counts.
    """
    try:
        data = request.get_json() or {}
        symbols = data.get('symbols')
        
        # Validate symbols if provided
        if symbols is not None:
            if not isinstance(symbols, list):
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'symbols must be a list'
                    }
                }), 400
            
            # Normalize to uppercase
            symbols = [s.upper() for s in symbols]
        
        # Force refresh
        logger.info(f"Admin triggered price refresh for symbols: {symbols or 'all configured'}")
        results = PriceFeedService.force_refresh_prices(symbols)
        
        # Determine response status
        if results['failed'] and not results['success']:
            status_code = 500
            message = 'All price refreshes failed'
        elif results['failed']:
            status_code = 207  # Multi-status
            message = 'Some price refreshes failed'
        else:
            status_code = 200
            message = 'All prices refreshed successfully'
        
        return jsonify({
            'success': len(results['success']) > 0,
            'data': results,
            'message': message
        }), status_code
        
    except Exception as e:
        logger.error(f"Error refreshing prices: {str(e)}")
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to refresh prices',
                'details': str(e)
            }
        }), 500


@bp.route('/admin/prices/config', methods=['GET'])
@jwt_required()
@admin_required
def get_price_config():
    """
    Get price feed configuration - Admin only.
    
    Returns:
        Current configuration including symbols, fetch interval, and exchange rate.
    """
    try:
        config = {
            'symbols': current_app.config.get('GEMINI_SYMBOLS', 'BTCUSD,ETHUSD').split(','),
            'fetch_interval': current_app.config.get('PRICE_FETCH_INTERVAL', 60),
            'usd_to_inr_rate': current_app.config.get('USD_TO_INR_RATE', 83.0),
            'exchange': 'gemini'
        }
        
        return jsonify({
            'success': True,
            'data': config
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting price config: {str(e)}")
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve configuration',
                'details': str(e)
            }
        }), 500
