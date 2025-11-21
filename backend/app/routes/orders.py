"""Orders API routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from mongoengine import ValidationError
from app.services.order_service import OrderService
from app.utils.decorators import admin_required

bp = Blueprint('orders', __name__)


@bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def get_orders():
    """
    Get all orders with pagination and filtering - Admin only.
    
    Query Parameters:
        - page: Page number (default: 1)
        - per_page: Items per page (default: 20, max: 100)
        - status: Filter by order status (pending, processing, completed, cancelled)
        - payment_status: Filter by payment status (unpaid, partial, paid)
        - customer_id: Filter by customer ID
        - date_from: Filter by start date (ISO format)
        - date_to: Filter by end date (ISO format)
        - search: Search term for order number or customer name
    """
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Get filter parameters
        status = request.args.get('status')
        payment_status = request.args.get('payment_status')
        customer_id = request.args.get('customer_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        search = request.args.get('search')
        
        # Validate page number
        if page < 1:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Page number must be greater than 0'
                }
            }), 400
        
        # Get orders with filters
        orders, total = OrderService.get_orders_with_filters(
            page=page,
            per_page=per_page,
            status=status,
            payment_status=payment_status,
            customer_id=customer_id,
            date_from=date_from,
            date_to=date_to,
            search=search
        )
        
        # Convert to dict
        orders_data = [order.to_dict() for order in orders]
        
        # Calculate pagination metadata
        total_pages = (total + per_page - 1) // per_page
        
        return jsonify({
            'success': True,
            'data': orders_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve orders',
                'details': str(e)
            }
        }), 500


@bp.route('/<order_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_order(order_id):
    """
    Get order by ID - Admin only.
    
    Returns complete order details including items and customer information.
    """
    try:
        order = OrderService.get_order_by_id(order_id)
        
        if not order:
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Order not found'
                }
            }), 404
        
        return jsonify({
            'success': True,
            'data': order.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve order',
                'details': str(e)
            }
        }), 500


@bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_order():
    """
    Create new order - Admin only.
    
    Required fields:
        - customer_id: Customer ID
        - items: List of order items, each containing:
            - product_id: Product ID
            - quantity: Quantity (default: 1)
            - unit_price: Unit price (optional, uses product base_price if not provided)
    
    Optional fields:
        - tax_amount: Tax amount (default: 0)
        - discount_amount: Discount amount (default: 0)
        - payment_status: Payment status (unpaid, partial, paid) (default: unpaid)
        - payment_method: Payment method
        - notes: Customer-facing notes
        - admin_notes: Internal admin notes
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
        if 'customer_id' not in data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'customer_id is required'
                }
            }), 400
        
        if 'items' not in data or not data['items']:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'items is required and must contain at least one item'
                }
            }), 400
        
        # Create order
        order = OrderService.create_order(data)
        
        return jsonify({
            'success': True,
            'data': order.to_dict(),
            'message': 'Order created successfully'
        }), 201
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': str(e)
            }
        }), 400
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
                'message': 'Failed to create order',
                'details': str(e)
            }
        }), 500


@bp.route('/<order_id>/status', methods=['PUT'])
@jwt_required()
@admin_required
def update_order_status(order_id):
    """
    Update order status - Admin only.
    
    Required fields:
        - status: New status (pending, processing, completed, cancelled)
    
    Automatically updates timestamps:
        - completed_at: Set when status changes to 'completed'
        - cancelled_at: Set when status changes to 'cancelled'
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
        
        if 'status' not in data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'status is required'
                }
            }), 400
        
        # Update order status
        order = OrderService.update_order_status(order_id, data['status'])
        
        if not order:
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Order not found'
                }
            }), 404
        
        return jsonify({
            'success': True,
            'data': order.to_dict(),
            'message': 'Order status updated successfully'
        }), 200
        
    except ValueError as e:
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
                'message': 'Failed to update order status',
                'details': str(e)
            }
        }), 500


@bp.route('/<order_id>/payment-status', methods=['PUT'])
@jwt_required()
@admin_required
def update_payment_status(order_id):
    """
    Update order payment status - Admin only.
    
    Required fields:
        - payment_status: New payment status (unpaid, partial, paid)
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
        
        if 'payment_status' not in data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'payment_status is required'
                }
            }), 400
        
        # Update payment status
        order = OrderService.update_payment_status(order_id, data['payment_status'])
        
        if not order:
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Order not found'
                }
            }), 404
        
        return jsonify({
            'success': True,
            'data': order.to_dict(),
            'message': 'Payment status updated successfully'
        }), 200
        
    except ValueError as e:
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
                'message': 'Failed to update payment status',
                'details': str(e)
            }
        }), 500


@bp.route('/<order_id>/notes', methods=['PUT'])
@jwt_required()
@admin_required
def add_order_note(order_id):
    """
    Add a note to an order - Admin only.
    
    Required fields:
        - note: Note text to add
    
    Optional fields:
        - is_admin: Whether this is an admin note (default: true for admin users)
    
    Notes are timestamped automatically.
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
        
        if 'note' not in data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'note is required'
                }
            }), 400
        
        # Add note (default to admin note for admin users)
        is_admin = data.get('is_admin', True)
        order = OrderService.add_order_note(order_id, data['note'], is_admin=is_admin)
        
        if not order:
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Order not found'
                }
            }), 404
        
        return jsonify({
            'success': True,
            'data': order.to_dict(),
            'message': 'Note added successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to add note',
                'details': str(e)
            }
        }), 500


@bp.route('/statistics', methods=['GET'])
@jwt_required()
@admin_required
def get_order_statistics():
    """
    Get order statistics - Admin only.
    
    Query Parameters:
        - date_from: Start date (ISO format)
        - date_to: End date (ISO format)
    
    Returns statistics including:
        - Total orders
        - Total revenue
        - Average order value
        - Status breakdown
        - Payment breakdown
    """
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        statistics = OrderService.get_order_statistics(
            date_from=date_from,
            date_to=date_to
        )
        
        return jsonify({
            'success': True,
            'data': statistics
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve statistics',
                'details': str(e)
            }
        }), 500


@bp.route('/customer/<customer_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_customer_orders(customer_id):
    """
    Get all orders for a specific customer - Admin only.
    
    Query Parameters:
        - page: Page number (default: 1)
        - per_page: Items per page (default: 20, max: 100)
    """
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Validate page number
        if page < 1:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Page number must be greater than 0'
                }
            }), 400
        
        # Get customer orders
        orders, total = OrderService.get_customer_orders(
            customer_id=customer_id,
            page=page,
            per_page=per_page
        )
        
        # Convert to dict
        orders_data = [order.to_dict() for order in orders]
        
        # Calculate pagination metadata
        total_pages = (total + per_page - 1) // per_page
        
        return jsonify({
            'success': True,
            'data': orders_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve customer orders',
                'details': str(e)
            }
        }), 500
