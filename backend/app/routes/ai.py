"""AI-powered features API routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
import bleach
from app.services.gemini_ai_service import gemini_ai_service

logger = logging.getLogger(__name__)

bp = Blueprint('ai', __name__, url_prefix='/ai')


def sanitize_input(value):
    """Sanitize string input to prevent XSS attacks."""
    if isinstance(value, str):
        return bleach.clean(value, strip=True)
    elif isinstance(value, dict):
        return {k: sanitize_input(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [sanitize_input(item) for item in value]
    return value


@bp.route('/generate-description', methods=['POST'])
@jwt_required()
def generate_description():
    """
    Generate product description using AI (Admin only).
    
    Request Body:
        - product_name: Product name (required)
        - category: Product category (required)
        - weight: Weight in grams (required)
        - gold_purity: Gold purity (required)
        - additional_details: Additional details (optional)
    
    Returns:
        200: Description generated successfully
        400: Invalid request
        403: Not authorized (admin only)
        503: AI service not available
    """
    try:
        # Check if user is admin
        from flask_jwt_extended import get_jwt
        jwt_data = get_jwt()
        if jwt_data.get('role') != 'admin':
            return jsonify({
                'success': False,
                'error': {
                    'code': 403,
                    'message': 'Admin access required'
                }
            }), 403
        
        data = sanitize_input(request.get_json())
        
        if not data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required'
                }
            }), 400
        
        # Validate required fields
        required_fields = ['product_name', 'category', 'weight', 'gold_purity']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': f'Missing required field: {field}'
                    }
                }), 400
        
        # Generate description
        description = gemini_ai_service.generate_product_description(
            product_name=data['product_name'],
            category=data['category'],
            weight=float(data['weight']),
            gold_purity=data['gold_purity'],
            additional_details=data.get('additional_details')
        )
        
        if description is None:
            return jsonify({
                'success': False,
                'error': {
                    'code': 503,
                    'message': 'AI service is not available'
                }
            }), 503
        
        return jsonify({
            'success': True,
            'data': {
                'description': description
            }
        }), 200
    
    except Exception as e:
        logger.error(f'Error generating description: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to generate description'
            }
        }), 500


@bp.route('/chat', methods=['POST'])
def chat():
    """
    Answer customer queries using AI chatbot.
    
    Request Body:
        - query: Customer question (required)
        - context: Additional context (optional)
    
    Returns:
        200: Answer generated successfully
        400: Invalid request
        503: AI service not available
    """
    try:
        data = sanitize_input(request.get_json())
        
        if not data or 'query' not in data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Query is required'
                }
            }), 400
        
        # Generate answer
        answer = gemini_ai_service.answer_customer_query(
            query=data['query'],
            context=data.get('context')
        )
        
        if answer is None:
            return jsonify({
                'success': False,
                'error': {
                    'code': 503,
                    'message': 'AI service is not available'
                }
            }), 503
        
        return jsonify({
            'success': True,
            'data': {
                'answer': answer
            }
        }), 200
    
    except Exception as e:
        logger.error(f'Error in AI chat: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to process query'
            }
        }), 500


@bp.route('/generate-seo', methods=['POST'])
@jwt_required()
def generate_seo():
    """
    Generate SEO keywords for a product (Admin only).
    
    Request Body:
        - product_name: Product name (required)
        - category: Product category (required)
        - description: Product description (required)
    
    Returns:
        200: Keywords generated successfully
        400: Invalid request
        403: Not authorized
        503: AI service not available
    """
    try:
        # Check if user is admin
        from flask_jwt_extended import get_jwt
        jwt_data = get_jwt()
        if jwt_data.get('role') != 'admin':
            return jsonify({
                'success': False,
                'error': {
                    'code': 403,
                    'message': 'Admin access required'
                }
            }), 403
        
        data = sanitize_input(request.get_json())
        
        if not data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required'
                }
            }), 400
        
        # Validate required fields
        required_fields = ['product_name', 'category', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': f'Missing required field: {field}'
                    }
                }), 400
        
        # Generate keywords
        keywords = gemini_ai_service.generate_seo_keywords(
            product_name=data['product_name'],
            category=data['category'],
            description=data['description']
        )
        
        if keywords is None:
            return jsonify({
                'success': False,
                'error': {
                    'code': 503,
                    'message': 'AI service is not available'
                }
            }), 503
        
        return jsonify({
            'success': True,
            'data': {
                'keywords': keywords
            }
        }), 200
    
    except Exception as e:
        logger.error(f'Error generating SEO keywords: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to generate keywords'
            }
        }), 500
