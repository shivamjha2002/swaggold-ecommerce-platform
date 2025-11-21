"""Orders API routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from mongoengine import ValidationError
from app.services.order_service import OrderService
from app.services.payment_service import payment_service
from app.services.notification_service import notification_service
from app.models.order import Order
from app.models.refund import Refund
from app.models.payment_transaction import PaymentTransaction
from app.models.user import User
from app.utils.decorators import admin_required
from app.utils.exceptions import PaymentError
from app.utils.audit_logger import log_refund, log_order_status_change, log_admin_action
from datetime import datetime
import logging

bp = Blueprint('orders', __name__)
logger = logging.getLogger(__name__)


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
        
        # Get old status before update
        try:
            old_order = Order.objects.get(id=order_id)
            old_status = old_order.status
        except Order.DoesNotExist:
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Order not found'
                }
            }), 404
        
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
        
        # Log status change for audit trail
        log_order_status_change(
            order_id=order_id,
            old_status=old_status,
            new_status=data['status']
        )
        
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


@bp.route('/<order_id>/refund', methods=['POST'])
@jwt_required()
@admin_required
def process_refund(order_id):
    """
    Process a refund for an order - Admin only.
    
    Required fields:
        - amount: Refund amount in INR (optional, defaults to full refund)
        - reason: Reason for refund
    
    Optional fields:
        - refund_type: 'full' or 'partial' (auto-detected if not provided)
    
    The order must have status 'paid' and a valid razorpay_payment_id.
    On successful refund, the order status is updated to 'refunded'.
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
        
        # Get the order
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Order not found'
                }
            }), 404
        
        # Validate order has payment
        if not order.razorpay_payment_id:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Order does not have a valid payment to refund'
                }
            }), 400
        
        # Check if order is already refunded
        if order.status == 'refunded':
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Order has already been refunded'
                }
            }), 400
        
        # Get refund amount (None for full refund)
        refund_amount = data.get('amount')
        reason = data.get('reason', 'Refund requested by admin')
        
        # Validate refund amount if provided
        if refund_amount is not None:
            try:
                refund_amount = float(refund_amount)
                if refund_amount <= 0:
                    return jsonify({
                        'success': False,
                        'error': {
                            'code': 400,
                            'message': 'Refund amount must be greater than 0'
                        }
                    }), 400
                
                if refund_amount > order.total_amount:
                    return jsonify({
                        'success': False,
                        'error': {
                            'code': 400,
                            'message': f'Refund amount cannot exceed order total ({order.total_amount})'
                        }
                    }), 400
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid refund amount format'
                    }
                }), 400
        
        # Determine refund type
        if refund_amount is None or refund_amount == order.total_amount:
            refund_type = 'full'
            refund_amount_to_process = None  # Full refund
        else:
            refund_type = 'partial'
            refund_amount_to_process = refund_amount
        
        # Get admin user
        current_user_id = get_jwt_identity()
        try:
            admin_user = User.objects.get(id=current_user_id)
        except User.DoesNotExist:
            admin_user = None
        
        # Get payment transaction
        payment_transaction = PaymentTransaction.objects(
            razorpay_payment_id=order.razorpay_payment_id
        ).first()
        
        # Create refund record
        refund = Refund(
            order_id=order,
            payment_transaction_id=payment_transaction,
            amount=int((refund_amount_to_process or order.total_amount) * 100),  # Convert to paise
            refund_type=refund_type,
            reason=reason,
            initiated_by=admin_user,
            status='pending'
        )
        refund.save()
        
        logger.info(
            f'Refund record created: refund_id={refund.id}, '
            f'order_id={order_id}, amount={refund_amount_to_process or order.total_amount}, '
            f'type={refund_type}'
        )
        
        try:
            # Process refund through Razorpay
            razorpay_response = payment_service.process_refund(
                payment_id=order.razorpay_payment_id,
                amount=refund_amount_to_process,
                notes={
                    'order_id': order.order_number,
                    'reason': reason,
                    'refund_type': refund_type
                }
            )
            
            # Update refund record with Razorpay refund ID
            refund.razorpay_refund_id = razorpay_response.get('id')
            refund.mark_processed()
            
            # Update order status to refunded
            order.status = 'refunded'
            order.payment_status = 'unpaid'  # Reset payment status
            order.save()
            
            # Add admin note to order
            admin_name = admin_user.username if admin_user else 'Admin'
            order.add_note(
                f'Refund processed by {admin_name}: {refund_type} refund of ₹{refund_amount_to_process or order.total_amount}. Reason: {reason}',
                is_admin=True
            )
            
            # Update payment transaction status
            if payment_transaction:
                payment_transaction.status = 'refunded'
                payment_transaction.save()
            
            logger.info(
                f'Refund processed successfully: '
                f'refund_id={refund.id}, razorpay_refund_id={refund.razorpay_refund_id}, '
                f'order_id={order_id}'
            )
            
            # Log refund for audit trail
            log_refund(
                order_id=order_id,
                refund_id=refund.razorpay_refund_id,
                amount=refund_amount_to_process or order.total_amount,
                status='success',
                reason=reason
            )
            
            # Send refund notification to customer
            try:
                notification_result = notification_service.send_refund_notification(
                    customer_email=order.customer_email,
                    customer_phone=order.customer_phone,
                    customer_name=order.customer_name,
                    order_number=order.order_number,
                    refund_amount=refund_amount_to_process or order.total_amount,
                    refund_type=refund_type,
                    expected_timeline='5-7 business days'
                )
                
                logger.info(
                    f'Refund notification sent: order={order.order_number}, '
                    f'email_sent={notification_result["email_sent"]}, '
                    f'sms_sent={notification_result["sms_sent"]}'
                )
            except Exception as e:
                # Don't fail the refund if notification fails
                logger.error(f'Failed to send refund notification: {str(e)}')
            
            return jsonify({
                'success': True,
                'data': {
                    'refund': refund.to_dict(),
                    'order': order.to_dict(),
                    'razorpay_refund_id': refund.razorpay_refund_id
                },
                'message': f'{refund_type.capitalize()} refund processed successfully'
            }), 200
            
        except PaymentError as e:
            # Mark refund as failed
            refund.mark_failed()
            
            # Log failed refund for audit trail
            log_refund(
                order_id=order_id,
                refund_id=str(refund.id),
                amount=refund_amount_to_process or order.total_amount,
                status='failure',
                reason=reason,
                error_message=str(e)
            )
            
            logger.error(f'Refund failed: {str(e)}')
            
            return jsonify({
                'success': False,
                'error': {
                    'code': 502,
                    'message': 'Refund processing failed',
                    'details': str(e)
                }
            }), 502
        
        except Exception as e:
            # Mark refund as failed
            refund.mark_failed()
            
            logger.error(f'Unexpected error processing refund: {str(e)}')
            
            return jsonify({
                'success': False,
                'error': {
                    'code': 500,
                    'message': 'Failed to process refund',
                    'details': str(e)
                }
            }), 500
        
    except Exception as e:
        logger.error(f'Error in refund endpoint: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to process refund request',
                'details': str(e)
            }
        }), 500
