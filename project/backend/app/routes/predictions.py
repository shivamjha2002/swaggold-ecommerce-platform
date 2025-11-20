"""Predictions API routes for ML-powered price predictions."""
from flask import Blueprint, request, jsonify
from datetime import datetime
from app.services.ml_service import ml_service
from app.ml.train import train_gold_model, train_diamond_model

bp = Blueprint('predictions', __name__)


@bp.route('/gold', methods=['POST'])
def predict_gold_price():
    """
    Predict gold price for a future date.
    
    Request Body:
        - date: Target date for prediction (YYYY-MM-DD format, required)
        - weight_grams: Weight in grams for total price calculation (optional)
    
    Returns:
        - predicted_price_per_gram: Predicted price per gram
        - total_price: Total price if weight_grams provided
        - confidence_interval: Lower and upper bounds
        - model_accuracy: R2 score from training
        - last_trained: Last training timestamp
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
        if 'date' not in data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Date field is required'
                }
            }), 400
        
        target_date = data['date']
        weight_grams = data.get('weight_grams')
        
        # Validate date format
        try:
            date_obj = datetime.strptime(target_date, '%Y-%m-%d')
            
            # Check if date is in the future
            if date_obj.date() <= datetime.utcnow().date():
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Target date must be in the future'
                    }
                }), 400
        except ValueError:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid date format. Use YYYY-MM-DD'
                }
            }), 400
        
        # Validate weight if provided
        if weight_grams is not None:
            try:
                weight_grams = float(weight_grams)
                if weight_grams <= 0:
                    return jsonify({
                        'success': False,
                        'error': {
                            'code': 400,
                            'message': 'Weight must be positive'
                        }
                    }), 400
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid weight value'
                    }
                }), 400
        
        # Make prediction
        try:
            result = ml_service.predict_gold_price(target_date, weight_grams)
            
            return jsonify({
                'success': True,
                'data': result
            }), 200
            
        except ValueError as e:
            return jsonify({
                'success': False,
                'error': {
                    'code': 503,
                    'message': str(e)
                }
            }), 503
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to predict gold price',
                'details': str(e)
            }
        }), 500


@bp.route('/diamond', methods=['POST'])
def predict_diamond_price():
    """
    Predict diamond price based on 4Cs.
    
    Request Body:
        - carat: Diamond carat weight (required)
        - cut: Cut quality (required) - Ideal, Excellent, Very Good, Good, Fair, Poor
        - color: Color grade (required) - D, E, F, G, H, I, J, K, L, M
        - clarity: Clarity grade (required) - FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2, I1, I2, I3
    
    Returns:
        - predicted_price: Predicted diamond price
        - confidence_interval: Lower and upper bounds
        - features_used: Input features used for prediction
        - model_accuracy: R2 score from training
        - last_trained: Last training timestamp
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
        required_fields = ['carat', 'cut', 'color', 'clarity']
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
        
        # Make prediction
        try:
            result = ml_service.predict_diamond_price(carat, cut, color, clarity)
            
            return jsonify({
                'success': True,
                'data': result
            }), 200
            
        except ValueError as e:
            return jsonify({
                'success': False,
                'error': {
                    'code': 503,
                    'message': str(e)
                }
            }), 503
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to predict diamond price',
                'details': str(e)
            }
        }), 500


@bp.route('/trends', methods=['GET'])
def get_price_trends():
    """
    Get historical price trends for gold.
    
    Query Parameters:
        - days: Number of days to look back (default: 30, max: 365)
        - metal_type: Type of metal (default: gold)
    
    Returns:
        - prices: List of historical prices
        - statistics: Price statistics (average, min, max, change, change_percent)
        - period_days: Number of days in the period
    """
    try:
        # Get query parameters
        days = request.args.get('days', 30, type=int)
        metal_type = request.args.get('metal_type', 'gold')
        
        # Validate days
        if days < 1:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Days must be at least 1'
                }
            }), 400
        
        if days > 365:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Days cannot exceed 365'
                }
            }), 400
        
        # Validate metal type
        if metal_type not in ['gold', 'silver', 'platinum']:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid metal type. Must be gold, silver, or platinum'
                }
            }), 400
        
        # Get trends
        trends = ml_service.get_gold_price_trends(days=days)
        
        return jsonify({
            'success': True,
            'data': trends
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve price trends',
                'details': str(e)
            }
        }), 500


@bp.route('/retrain', methods=['POST'])
def retrain_models():
    """
    Trigger model retraining (admin only).
    
    Request Body:
        - model: Model to retrain ('gold', 'diamond', or 'all')
    
    Returns:
        - training_results: Results from model training
    
    Note: This endpoint should be protected with admin authentication in production.
    """
    try:
        data = request.get_json() or {}
        model_type = data.get('model', 'all')
        
        # Validate model type
        if model_type not in ['gold', 'diamond', 'all']:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid model type. Must be gold, diamond, or all'
                }
            }), 400
        
        results = {}
        
        # Train gold model
        if model_type in ['gold', 'all']:
            try:
                gold_metrics = train_gold_model()
                results['gold_model'] = {
                    'success': True,
                    'metrics': gold_metrics
                }
            except Exception as e:
                results['gold_model'] = {
                    'success': False,
                    'error': str(e)
                }
        
        # Train diamond model
        if model_type in ['diamond', 'all']:
            try:
                diamond_metrics = train_diamond_model()
                results['diamond_model'] = {
                    'success': True,
                    'metrics': diamond_metrics
                }
            except Exception as e:
                results['diamond_model'] = {
                    'success': False,
                    'error': str(e)
                }
        
        # Reload models in ML service
        ml_service.reload_models()
        
        # Check if any training failed
        all_success = all(
            result.get('success', False) 
            for result in results.values()
        )
        
        status_code = 200 if all_success else 500
        
        return jsonify({
            'success': all_success,
            'data': results,
            'message': 'Model retraining completed' if all_success else 'Some models failed to train'
        }), status_code
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrain models',
                'details': str(e)
            }
        }), 500


@bp.route('/status', methods=['GET'])
def get_models_status():
    """
    Get status of all ML models.
    
    Returns:
        - gold_model: Status of gold price prediction model
        - diamond_model: Status of diamond price prediction model
    """
    try:
        status = ml_service.get_models_status()
        
        return jsonify({
            'success': True,
            'data': status
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve models status',
                'details': str(e)
            }
        }), 500
