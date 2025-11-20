"""Price history management API routes."""
from flask import Blueprint, request, jsonify
from datetime import datetime
from mongoengine import ValidationError
from app.models.price_history import PriceHistory, DiamondPriceHistory, TrainingLog
from app.ml.train import train_gold_model, train_diamond_model
from app.services.ml_service import ml_service
from app.utils.decorators import auth_required

bp = Blueprint('prices', __name__)

# Track number of new records since last training
new_gold_records = 0
new_diamond_records = 0
RETRAIN_THRESHOLD = 30


@bp.route('/gold/live', methods=['GET'])
def get_gold_live_price():
    """
    Get live gold price for landing page (public endpoint).
    
    This is an alias endpoint that redirects to the price feed service.
    Returns formatted gold price data with 5-minute caching.
    
    Returns:
        - price: Price in INR per 10 grams
        - currency: 'INR'
        - per_unit: '10g'
        - last_updated: ISO timestamp
        - cache_status: 'fresh' or 'stale_with_error'
    """
    try:
        from app.services.price_feed_service import PriceFeedService
        
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
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve gold price',
                'details': str(e)
            }
        }), 500


@bp.route('/gold', methods=['POST'])
def add_gold_price():
    """
    Add new gold price record.
    
    Request Body:
        - price_per_gram: Price per gram (required)
        - date: Date of the price (optional, defaults to current date)
        - purity: Gold purity (optional, defaults to '916')
        - source: Data source (optional)
    
    Returns:
        - Created price record
        - retrain_triggered: Boolean indicating if automatic retraining was triggered
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required'
                }
            }), 400
        
        # Validate required fields
        if 'price_per_gram' not in data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'price_per_gram field is required'
                }
            }), 400
        
        price_per_gram = data['price_per_gram']
        
        # Validate price
        try:
            price_per_gram = float(price_per_gram)
            if price_per_gram <= 0:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Price must be positive'
                    }
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid price value'
                }
            }), 400
        
        # Parse date if provided
        date = data.get('date')
        if date:
            try:
                date = datetime.strptime(date, '%Y-%m-%d')
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid date format. Use YYYY-MM-DD'
                    }
                }), 400
        else:
            date = datetime.utcnow()
        
        purity = data.get('purity', '916')
        source = data.get('source', 'manual')
        
        # Validate purity
        if purity not in ['916', '999', '750', '585']:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid purity. Must be 916, 999, 750, or 585'
                }
            }), 400
        
        # Create price record
        price_record = PriceHistory(
            metal_type='gold',
            purity=purity,
            price_per_gram=price_per_gram,
            date=date,
            source=source
        )
        price_record.save()
        
        # Track new records for automatic retraining
        global new_gold_records
        new_gold_records += 1
        
        # Check if automatic retraining should be triggered
        retrain_triggered = False
        if new_gold_records >= RETRAIN_THRESHOLD:
            try:
                train_gold_model()
                ml_service.reload_models()
                new_gold_records = 0
                retrain_triggered = True
            except Exception as e:
                # Log error but don't fail the request
                print(f"Automatic retraining failed: {str(e)}")
        
        return jsonify({
            'success': True,
            'data': price_record.to_dict(),
            'retrain_triggered': retrain_triggered,
            'message': 'Gold price added successfully'
        }), 201
        
    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': str(e)
            }
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to add gold price',
                'details': str(e)
            }
        }), 500


@bp.route('/diamond', methods=['POST'])
def add_diamond_price():
    """
    Add new diamond price record.
    
    Request Body:
        - carat: Diamond carat weight (required)
        - cut: Cut quality (required)
        - color: Color grade (required)
        - clarity: Clarity grade (required)
        - price: Diamond price (required)
        - date: Date of the price (optional, defaults to current date)
        - source: Data source (optional)
    
    Returns:
        - Created price record
        - retrain_triggered: Boolean indicating if automatic retraining was triggered
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required'
                }
            }), 400
        
        # Validate required fields
        required_fields = ['carat', 'cut', 'color', 'clarity', 'price']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                }
            }), 400
        
        carat = data['carat']
        cut = data['cut']
        color = data['color']
        clarity = data['clarity']
        price = data['price']
        
        # Validate carat
        try:
            carat = float(carat)
            if carat <= 0:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Carat must be positive'
                    }
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid carat value'
                }
            }), 400
        
        # Validate price
        try:
            price = float(price)
            if price <= 0:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Price must be positive'
                    }
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid price value'
                }
            }), 400
        
        # Validate categorical fields
        valid_cuts = ['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor']
        valid_colors = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']
        valid_clarities = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3']
        
        if cut not in valid_cuts:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': f'Invalid cut. Must be one of: {", ".join(valid_cuts)}'
                }
            }), 400
        
        if color not in valid_colors:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': f'Invalid color. Must be one of: {", ".join(valid_colors)}'
                }
            }), 400
        
        if clarity not in valid_clarities:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': f'Invalid clarity. Must be one of: {", ".join(valid_clarities)}'
                }
            }), 400
        
        # Parse date if provided
        date = data.get('date')
        if date:
            try:
                date = datetime.strptime(date, '%Y-%m-%d')
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid date format. Use YYYY-MM-DD'
                    }
                }), 400
        else:
            date = datetime.utcnow()
        
        source = data.get('source', 'manual')
        
        # Create diamond price record
        diamond_record = DiamondPriceHistory(
            carat=carat,
            cut=cut,
            color=color,
            clarity=clarity,
            price=price,
            date=date,
            source=source
        )
        diamond_record.save()
        
        # Track new records for automatic retraining
        global new_diamond_records
        new_diamond_records += 1
        
        # Check if automatic retraining should be triggered
        retrain_triggered = False
        if new_diamond_records >= RETRAIN_THRESHOLD:
            try:
                train_diamond_model()
                ml_service.reload_models()
                new_diamond_records = 0
                retrain_triggered = True
            except Exception as e:
                # Log error but don't fail the request
                print(f"Automatic retraining failed: {str(e)}")
        
        return jsonify({
            'success': True,
            'data': diamond_record.to_dict(),
            'retrain_triggered': retrain_triggered,
            'message': 'Diamond price added successfully'
        }), 201
        
    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': str(e)
            }
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to add diamond price',
                'details': str(e)
            }
        }), 500


@bp.route('/gold/history', methods=['GET'])
@auth_required
def get_gold_price_history():
    """
    Get historical gold prices with date filtering or range parameter.
    
    This endpoint supports two modes:
    1. Range-based (for trend charts): Use 'range' parameter ('1D', '1W', '1M', '3M', '1Y')
    2. Date-based (for detailed history): Use 'start_date' and 'end_date' parameters
    
    Query Parameters:
        - range: Time range ('1D', '1W', '1M', '3M', '1Y') - for symbol-based history
        - start_date: Start date for filtering (YYYY-MM-DD, optional) - for metal-based history
        - end_date: End date for filtering (YYYY-MM-DD, optional) - for metal-based history
        - purity: Gold purity filter (optional, defaults to '916') - for metal-based history
        - limit: Maximum number of records to return (optional, max 1000)
    
    Returns:
        - List of historical gold price records
    
    Note: JWT authentication is required for range-based queries.
    """
    try:
        # Check if this is a range-based query (for symbol price history)
        range_param = request.args.get('range')
        
        if range_param:
            # This is a range-based query for symbol price history
            # Requires JWT authentication
            from flask_jwt_extended import jwt_required, get_jwt_identity
            from app.services.price_feed_service import PriceFeedService
            
            # Verify JWT token
            try:
                jwt_required()(lambda: None)()
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 401,
                        'message': 'Authentication required',
                        'details': 'JWT token is required for range-based price history'
                    }
                }), 401
            
            # Validate range parameter
            range_param = range_param.upper()
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
            
            # Get price history from symbol-based model
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
        
        # Otherwise, this is a date-based query for metal price history (existing functionality)
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        purity = request.args.get('purity', '916')
        limit = request.args.get('limit', 100, type=int)
        
        # Validate limit
        if limit < 1:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Limit must be at least 1'
                }
            }), 400
        
        if limit > 1000:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Limit cannot exceed 1000'
                }
            }), 400
        
        # Build query
        query = {
            'metal_type': 'gold',
            'purity': purity
        }
        
        # Parse and validate dates
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                query['date__gte'] = start_date_obj
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid start_date format. Use YYYY-MM-DD'
                    }
                }), 400
        
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                query['date__lte'] = end_date_obj
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid end_date format. Use YYYY-MM-DD'
                    }
                }), 400
        
        # Query database
        prices = PriceHistory.objects(**query).order_by('-date').limit(limit)
        
        # Convert to list of dicts
        prices_data = [p.to_dict() for p in prices]
        
        return jsonify({
            'success': True,
            'data': prices_data,
            'count': len(prices_data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve gold price history',
                'details': str(e)
            }
        }), 500


@bp.route('/diamond/history', methods=['GET'])
def get_diamond_price_history():
    """
    Get historical diamond prices with filtering.
    
    Query Parameters:
        - start_date: Start date for filtering (YYYY-MM-DD, optional)
        - end_date: End date for filtering (YYYY-MM-DD, optional)
        - cut: Cut quality filter (optional)
        - color: Color grade filter (optional)
        - clarity: Clarity grade filter (optional)
        - min_carat: Minimum carat weight (optional)
        - max_carat: Maximum carat weight (optional)
        - limit: Maximum number of records to return (optional, max 1000)
    
    Returns:
        - List of historical diamond price records
    """
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        cut = request.args.get('cut')
        color = request.args.get('color')
        clarity = request.args.get('clarity')
        min_carat = request.args.get('min_carat', type=float)
        max_carat = request.args.get('max_carat', type=float)
        limit = request.args.get('limit', 100, type=int)
        
        # Validate limit
        if limit < 1 or limit > 1000:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Limit must be between 1 and 1000'
                }
            }), 400
        
        # Build query
        query = {}
        
        # Date filters
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
                query['date__gte'] = start_date_obj
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid start_date format. Use YYYY-MM-DD'
                    }
                }), 400
        
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                query['date__lte'] = end_date_obj
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid end_date format. Use YYYY-MM-DD'
                    }
                }), 400
        
        # 4Cs filters
        if cut:
            query['cut'] = cut
        if color:
            query['color'] = color
        if clarity:
            query['clarity'] = clarity
        
        # Carat filters
        if min_carat is not None:
            query['carat__gte'] = min_carat
        if max_carat is not None:
            query['carat__lte'] = max_carat
        
        # Query database
        diamonds = DiamondPriceHistory.objects(**query).order_by('-date').limit(limit)
        
        # Convert to list of dicts
        diamonds_data = [d.to_dict() for d in diamonds]
        
        return jsonify({
            'success': True,
            'data': diamonds_data,
            'count': len(diamonds_data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve diamond price history',
                'details': str(e)
            }
        }), 500


@bp.route('/gold/latest', methods=['GET'])
@bp.route('/gold/current', methods=['GET'])
def get_latest_gold_price():
    """
    Get the latest/current gold price.
    
    Query Parameters:
        - purity: Gold purity (optional, defaults to '916')
    
    Returns:
        - Latest gold price record
    """
    try:
        purity = request.args.get('purity', '916')
        
        latest_price = PriceHistory.get_latest_price(metal_type='gold', purity=purity)
        
        if not latest_price:
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'No gold price data found'
                }
            }), 404
        
        return jsonify({
            'success': True,
            'data': latest_price.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve latest gold price',
                'details': str(e)
            }
        }), 500
