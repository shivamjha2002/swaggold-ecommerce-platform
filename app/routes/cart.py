"""Cart API routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from mongoengine import ValidationError as MongoValidationError
from app.services.cart_service import CartService
from app.utils.exceptions import ValidationError, ResourceNotFoundError
from app.utils.decorators import auth_required
import logging
import bleach

bp = Blueprint('cart', __name__)
logger = logging.getLogger(__name__)


def sanitize_input(value):
    """Sanitize string input to prevent XSS attacks."""
    if isinstance(value, str):
        return bleach.clean(value, strip=True)
    return value


@bp.route('', methods=['POST'])
@auth_required
def add_to_cart():
    """
    Add or update item in cart.
    
    For authenticated users, uses user_id from JWT token.
    For guest users, requires session_id in request body.
    
    Request Body:
        - product_id: Product ID (required)
        - quantity: Quantity to add (required, min: 1)
        - variant_id: Variant identifier (optional)
        - session_id: Session ID for guest users (required if not authenticated)
    
    Returns:
        200: Item added/updated successfully
        400: Invalid request data or validation error
        401: Authentication failed (if JWT provided but invalid)
        404: Product not found
        500: Server error
    """
    try:
        data = request.get_json()
        
        if not data:
            logger.warning('Add to cart attempted with empty request body')
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required',
                    'details': 'Cart data must be provided in JSON format'
                }
            }), 400
        
        # Sanitize inputs
        product_id = sanitize_input(data.get('product_id'))
        variant_id = sanitize_input(data.get('variant_id'))
        quantity = data.get('quantity')
        session_id = sanitize_input(data.get('session_id'))
        
        # Validate required fields
        if not product_id:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Missing required field',
                    'details': 'product_id is required'
                }
            }), 400
        
        if not quantity or not isinstance(quantity, int):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid quantity',
                    'details': 'quantity must be a positive integer'
                }
            }), 400
        
        # Get user_id from JWT if authenticated
        user_id = None
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            pass
        
        # Require session_id for guest users
        if not user_id and not session_id:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Missing required field',
                    'details': 'session_id is required for guest users'
                }
            }), 400
        
        # Get or create cart
        cart = CartService.get_or_create_cart(user_id=user_id, session_id=session_id)
        
        # Add item to cart
        cart = CartService.add_item(cart, product_id, quantity, variant_id)
        
        # Calculate totals
        totals = CartService.calculate_cart_totals(cart)
        
        logger.info(f'Item added to cart: product={product_id}, quantity={quantity}, cart_id={cart.id}')
        
        return jsonify({
            'success': True,
            'data': {
                'cart': cart.to_dict(),
                'totals': totals
            },
            'message': 'Item added to cart successfully'
        }), 200
        
    except ValidationError as e:
        logger.warning(f'Validation error adding to cart: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': str(e)
            }
        }), 400
    except ResourceNotFoundError as e:
        logger.warning(f'Resource not found: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 404,
                'message': 'Resource not found',
                'details': str(e)
            }
        }), 404
    except MongoValidationError as e:
        logger.error(f'MongoDB validation error: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Database validation error',
                'details': str(e)
            }
        }), 400
    except Exception as e:
        logger.error(f'Error adding to cart: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to add item to cart',
                'details': str(e)
            }
        }), 500



@bp.route('', methods=['GET'])
@auth_required
def get_cart():
    """
    Get current cart with totals.
    
    For authenticated users, uses user_id from JWT token.
    For guest users, requires session_id query parameter.
    
    Query Parameters:
        - session_id: Session ID for guest users (required if not authenticated)
    
    Returns:
        200: Cart retrieved successfully
        400: Missing session_id for guest users
        401: Authentication failed (if JWT provided but invalid)
        404: Cart not found
        500: Server error
    """
    try:
        # Get user_id from JWT if authenticated
        user_id = None
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            pass
        
        # Get session_id from query params for guest users
        session_id = sanitize_input(request.args.get('session_id'))
        
        # Require session_id for guest users
        if not user_id and not session_id:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Missing required parameter',
                    'details': 'session_id is required for guest users'
                }
            }), 400
        
        # Get or create cart
        cart = CartService.get_or_create_cart(user_id=user_id, session_id=session_id)
        
        # Calculate totals
        totals = CartService.calculate_cart_totals(cart)
        
        logger.info(f'Cart retrieved: cart_id={cart.id}, items={len(cart.items)}')
        
        return jsonify({
            'success': True,
            'data': {
                'cart': cart.to_dict(),
                'totals': totals
            }
        }), 200
        
    except ValidationError as e:
        logger.warning(f'Validation error getting cart: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': str(e)
            }
        }), 400
    except ResourceNotFoundError as e:
        logger.warning(f'Resource not found: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 404,
                'message': 'Resource not found',
                'details': str(e)
            }
        }), 404
    except Exception as e:
        logger.error(f'Error getting cart: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve cart',
                'details': str(e)
            }
        }), 500


@bp.route('/<product_id>', methods=['DELETE'])
@auth_required
def remove_from_cart(product_id):
    """
    Remove specific item from cart.
    
    For authenticated users, uses user_id from JWT token.
    For guest users, requires session_id query parameter.
    
    Query Parameters:
        - session_id: Session ID for guest users (required if not authenticated)
        - variant_id: Variant identifier (optional)
    
    Returns:
        200: Item removed successfully
        400: Missing session_id for guest users
        401: Authentication failed (if JWT provided but invalid)
        404: Cart or item not found
        500: Server error
    """
    try:
        # Sanitize product_id
        product_id = sanitize_input(product_id)
        variant_id = sanitize_input(request.args.get('variant_id'))
        
        # Get user_id from JWT if authenticated
        user_id = None
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            pass
        
        # Get session_id from query params for guest users
        session_id = sanitize_input(request.args.get('session_id'))
        
        # Require session_id for guest users
        if not user_id and not session_id:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Missing required parameter',
                    'details': 'session_id is required for guest users'
                }
            }), 400
        
        # Get cart
        cart = CartService.get_or_create_cart(user_id=user_id, session_id=session_id)
        
        # Remove item
        cart = CartService.remove_item(cart, product_id, variant_id)
        
        # Calculate totals
        totals = CartService.calculate_cart_totals(cart)
        
        logger.info(f'Item removed from cart: product={product_id}, cart_id={cart.id}')
        
        return jsonify({
            'success': True,
            'data': {
                'cart': cart.to_dict(),
                'totals': totals
            },
            'message': 'Item removed from cart successfully'
        }), 200
        
    except ValidationError as e:
        logger.warning(f'Validation error removing from cart: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': str(e)
            }
        }), 400
    except ResourceNotFoundError as e:
        logger.warning(f'Resource not found: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 404,
                'message': 'Resource not found',
                'details': str(e)
            }
        }), 404
    except Exception as e:
        logger.error(f'Error removing from cart: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to remove item from cart',
                'details': str(e)
            }
        }), 500


@bp.route('', methods=['DELETE'])
@auth_required
def clear_cart():
    """
    Clear entire cart.
    
    For authenticated users, uses user_id from JWT token.
    For guest users, requires session_id query parameter.
    
    Query Parameters:
        - session_id: Session ID for guest users (required if not authenticated)
    
    Returns:
        200: Cart cleared successfully
        400: Missing session_id for guest users
        401: Authentication failed (if JWT provided but invalid)
        404: Cart not found
        500: Server error
    """
    try:
        # Get user_id from JWT if authenticated
        user_id = None
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            pass
        
        # Get session_id from query params for guest users
        session_id = sanitize_input(request.args.get('session_id'))
        
        # Require session_id for guest users
        if not user_id and not session_id:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Missing required parameter',
                    'details': 'session_id is required for guest users'
                }
            }), 400
        
        # Get cart
        cart = CartService.get_or_create_cart(user_id=user_id, session_id=session_id)
        
        # Clear cart
        CartService.clear_cart(cart)
        
        logger.info(f'Cart cleared: cart_id={cart.id}')
        
        return jsonify({
            'success': True,
            'data': {
                'cart': cart.to_dict(),
                'totals': {
                    'subtotal': 0.0,
                    'gst_amount': 0.0,
                    'shipping_amount': 0.0,
                    'discount_amount': 0.0,
                    'total': 0.0,
                    'item_count': 0
                }
            },
            'message': 'Cart cleared successfully'
        }), 200
        
    except ValidationError as e:
        logger.warning(f'Validation error clearing cart: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': str(e)
            }
        }), 400
    except ResourceNotFoundError as e:
        logger.warning(f'Resource not found: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 404,
                'message': 'Resource not found',
                'details': str(e)
            }
        }), 404
    except Exception as e:
        logger.error(f'Error clearing cart: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to clear cart',
                'details': str(e)
            }
        }), 500


@bp.route('/update', methods=['PUT'])
@auth_required
def update_cart_item():
    """
    Update item quantity in cart.
    
    For authenticated users, uses user_id from JWT token.
    For guest users, requires session_id in request body.
    
    Request Body:
        - product_id: Product ID (required)
        - quantity: New quantity (required, 0 to remove)
        - variant_id: Variant identifier (optional)
        - session_id: Session ID for guest users (required if not authenticated)
    
    Returns:
        200: Item updated successfully
        400: Invalid request data or validation error
        401: Authentication failed (if JWT provided but invalid)
        404: Product or cart item not found
        500: Server error
    """
    try:
        data = request.get_json()
        
        if not data:
            logger.warning('Update cart attempted with empty request body')
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required',
                    'details': 'Update data must be provided in JSON format'
                }
            }), 400
        
        # Sanitize inputs
        product_id = sanitize_input(data.get('product_id'))
        variant_id = sanitize_input(data.get('variant_id'))
        quantity = data.get('quantity')
        session_id = sanitize_input(data.get('session_id'))
        
        # Validate required fields
        if not product_id:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Missing required field',
                    'details': 'product_id is required'
                }
            }), 400
        
        if quantity is None or not isinstance(quantity, int):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid quantity',
                    'details': 'quantity must be a non-negative integer'
                }
            }), 400
        
        # Get user_id from JWT if authenticated
        user_id = None
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            pass
        
        # Require session_id for guest users
        if not user_id and not session_id:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Missing required field',
                    'details': 'session_id is required for guest users'
                }
            }), 400
        
        # Get cart
        cart = CartService.get_or_create_cart(user_id=user_id, session_id=session_id)
        
        # Update item quantity
        cart = CartService.update_item_quantity(cart, product_id, quantity, variant_id)
        
        # Calculate totals
        totals = CartService.calculate_cart_totals(cart)
        
        logger.info(f'Cart item updated: product={product_id}, quantity={quantity}, cart_id={cart.id}')
        
        return jsonify({
            'success': True,
            'data': {
                'cart': cart.to_dict(),
                'totals': totals
            },
            'message': 'Cart item updated successfully'
        }), 200
        
    except ValidationError as e:
        logger.warning(f'Validation error updating cart: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': str(e)
            }
        }), 400
    except ResourceNotFoundError as e:
        logger.warning(f'Resource not found: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 404,
                'message': 'Resource not found',
                'details': str(e)
            }
        }), 404
    except MongoValidationError as e:
        logger.error(f'MongoDB validation error: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Database validation error',
                'details': str(e)
            }
        }), 400
    except Exception as e:
        logger.error(f'Error updating cart: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to update cart item',
                'details': str(e)
            }
        }), 500


@bp.route('/sync', methods=['POST'])
@jwt_required()
def sync_guest_cart():
    """
    Sync guest cart with user cart on login.
    
    Requires authentication. Merges guest cart items into user cart.
    
    Request Body:
        - session_id: Guest session ID (required)
    
    Returns:
        200: Cart synced successfully
        400: Missing session_id
        401: Authentication failed
        404: User not found
        500: Server error
    """
    try:
        data = request.get_json()
        
        if not data:
            logger.warning('Cart sync attempted with empty request body')
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required',
                    'details': 'session_id must be provided'
                }
            }), 400
        
        # Sanitize input
        session_id = sanitize_input(data.get('session_id'))
        
        if not session_id:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Missing required field',
                    'details': 'session_id is required'
                }
            }), 400
        
        # Get user_id from JWT
        user_id = get_jwt_identity()
        
        # Sync carts
        cart = CartService.sync_guest_cart_on_login(session_id, user_id)
        
        # Calculate totals
        totals = CartService.calculate_cart_totals(cart)
        
        logger.info(f'Guest cart synced: session={session_id}, user={user_id}, cart_id={cart.id}')
        
        return jsonify({
            'success': True,
            'data': {
                'cart': cart.to_dict(),
                'totals': totals
            },
            'message': 'Cart synced successfully'
        }), 200
        
    except ValidationError as e:
        logger.warning(f'Validation error syncing cart: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': str(e)
            }
        }), 400
    except ResourceNotFoundError as e:
        logger.warning(f'Resource not found: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 404,
                'message': 'Resource not found',
                'details': str(e)
            }
        }), 404
    except Exception as e:
        logger.error(f'Error syncing cart: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to sync cart',
                'details': str(e)
            }
        }), 500
