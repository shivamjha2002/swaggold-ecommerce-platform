"""Checkout API routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from mongoengine import ValidationError as MongoValidationError
from datetime import datetime
from app.services.cart_service import CartService
from app.services.checkout_service import CheckoutService
from app.services.payment_service import payment_service
from app.models.order import Order
from app.models.payment_transaction import PaymentTransaction
from app.utils.exceptions import ValidationError, ResourceNotFoundError, PaymentError
from app.utils.decorators import auth_required
from app.utils.audit_logger import log_payment_attempt, log_payment_verification
import logging
import bleach
import os

bp = Blueprint('checkout', __name__)
logger = logging.getLogger(__name__)


def sanitize_input(value):
    """Sanitize string input to prevent XSS attacks."""
    if isinstance(value, str):
        return bleach.clean(value, strip=True)
    elif isinstance(value, dict):
        return {k: sanitize_input(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [sanitize_input(item) for item in value]
    return value


@bp.route('/create-order', methods=['POST'])
@auth_required
def create_order():
    """
    Create order from cart and prepare for payment.
    
    For authenticated users, uses user_id from JWT token.
    For guest users, requires session_id in request body.
    
    Request Body:
        - shipping_address: Shipping address object (required)
            - full_name: Full name (required)
            - mobile: 10-digit mobile number (required)
            - email: Email address (optional)
            - address_line1: Address line 1 (required)
            - address_line2: Address line 2 (optional)
            - city: City (required)
            - state: State (required)
            - pin_code: 6-digit PIN code (required)
            - landmark: Landmark (optional)
            - preferred_delivery_date: Preferred delivery date (optional)
        - billing_address: Billing address object (optional, defaults to shipping)
        - billing_is_same_as_shipping: Boolean (default: true)
        - custom_fields: Custom product-specific fields (optional)
        - notes: Customer notes (optional)
        - session_id: Session ID for guest users (required if not authenticated)
    
    Returns:
        200: Order created successfully with razorpay_order_id
        400: Invalid request data or validation error
        401: Authentication failed (if JWT provided but invalid)
        404: Cart or product not found
        500: Server error
    """
    try:
        data = request.get_json()
        
        if not data:
            logger.warning('Create order attempted with empty request body')
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required',
                    'details': 'Checkout data must be provided in JSON format'
                }
            }), 400
        
        # Sanitize inputs
        data = sanitize_input(data)
        
        # Get user_id from JWT if authenticated
        user_id = None
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            pass
        
        # Get session_id for guest users
        session_id = data.get('session_id')
        
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
        
        # Validate cart is not empty
        if not cart.items or len(cart.items) == 0:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Cart is empty',
                    'details': 'Cannot create order from empty cart'
                }
            }), 400
        
        # Validate checkout data
        validated_data = CheckoutService.validate_checkout_data(data)
        
        # Get configuration values
        gst_rate = float(os.environ.get('GST_RATE', '0.03'))
        shipping_rate = float(os.environ.get('SHIPPING_RATE', '100.0'))
        discount_amount = data.get('discount_amount', 0.0)
        
        # Validate and calculate amounts server-side
        amounts = CheckoutService.validate_and_calculate_amounts(
            cart=cart,
            client_total=data.get('total_amount'),
            gst_rate=gst_rate,
            shipping_rate=shipping_rate,
            discount_amount=discount_amount
        )
        
        # Create order from cart
        order = CheckoutService.create_order_from_cart(
            cart=cart,
            checkout_data=validated_data,
            gst_rate=gst_rate,
            shipping_rate=shipping_rate,
            discount_amount=discount_amount
        )
        
        logger.info(
            f'Order created: order_id={order.id}, order_number={order.order_number}, '
            f'total={order.total_amount}, customer={order.customer_name}'
        )
        
        # Create Razorpay order
        try:
            razorpay_order = payment_service.create_razorpay_order(
                amount=order.total_amount,
                currency='INR',
                receipt=order.order_number,
                notes={
                    'order_id': str(order.id),
                    'order_number': order.order_number,
                    'customer_name': order.customer_name
                }
            )
            
            # Update order with Razorpay order ID
            order.razorpay_order_id = razorpay_order['id']
            order.save()
            
            # Create payment transaction record
            payment_transaction = PaymentTransaction(
                order_id=order,
                razorpay_order_id=razorpay_order['id'],
                amount=razorpay_order['amount'],
                currency=razorpay_order['currency'],
                status='pending'
            )
            payment_transaction.save()
            
            logger.info(
                f'Razorpay order created: razorpay_order_id={razorpay_order["id"]}, '
                f'order_id={order.id}'
            )
            
            # Log payment attempt for audit trail
            log_payment_attempt(
                order_id=str(order.id),
                razorpay_order_id=razorpay_order['id'],
                amount=order.total_amount,
                status='success'
            )
            
            # Return order details with Razorpay order ID for client
            return jsonify({
                'success': True,
                'data': {
                    'order_id': str(order.id),
                    'order_number': order.order_number,
                    'razorpay_order_id': razorpay_order['id'],
                    'amount': order.total_amount,
                    'currency': 'INR',
                    'key_id': payment_service.key_id,
                    'customer': {
                        'name': order.customer_name,
                        'email': order.customer_email,
                        'contact': order.customer_phone
                    }
                },
                'message': 'Order created successfully'
            }), 200
            
        except PaymentError as e:
            logger.error(f'Failed to create Razorpay order: {str(e)}')
            # Order is created but payment order failed
            # Update order status to indicate payment creation failed
            order.status = 'payment_failed'
            order.save()
            
            # Log failed payment attempt
            log_payment_attempt(
                order_id=str(order.id),
                razorpay_order_id='',
                amount=order.total_amount,
                status='failure',
                error_message=str(e)
            )
            
            return jsonify({
                'success': False,
                'error': {
                    'code': 402,
                    'message': 'Failed to initialize payment',
                    'details': str(e)
                }
            }), 402
        
    except ValidationError as e:
        logger.warning(f'Validation error creating order: {str(e)}')
        error_response = {
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': e.details if hasattr(e, 'details') else str(e)
            }
        }
        return jsonify(error_response), 400
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
        logger.error(f'Error creating order: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to create order',
                'details': str(e)
            }
        }), 500


@bp.route('/validate', methods=['POST'])
@auth_required
def validate_checkout():
    """
    Validate checkout data without creating order.
    
    Useful for client-side validation before final submission.
    
    Request Body:
        - shipping_address: Shipping address object (required)
        - billing_address: Billing address object (optional)
        - billing_is_same_as_shipping: Boolean (default: true)
        - custom_fields: Custom fields (optional)
    
    Returns:
        200: Validation successful
        400: Validation errors
        500: Server error
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
        
        # Sanitize inputs
        data = sanitize_input(data)
        
        # Validate checkout data
        validated_data = CheckoutService.validate_checkout_data(data)
        
        logger.info('Checkout data validated successfully')
        
        return jsonify({
            'success': True,
            'data': {
                'validated': True,
                'message': 'Checkout data is valid'
            }
        }), 200
        
    except ValidationError as e:
        logger.warning(f'Validation error: {str(e)}')
        error_response = {
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': e.details if hasattr(e, 'details') else str(e)
            }
        }
        return jsonify(error_response), 400
    except Exception as e:
        logger.error(f'Error validating checkout data: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to validate checkout data',
                'details': str(e)
            }
        }), 500


@bp.route('/calculate-totals', methods=['POST'])
@auth_required
def calculate_totals():
    """
    Calculate order totals without creating order.
    
    For authenticated users, uses user_id from JWT token.
    For guest users, requires session_id in request body.
    
    Request Body:
        - session_id: Session ID for guest users (required if not authenticated)
        - discount_amount: Discount amount (optional, default: 0)
    
    Returns:
        200: Totals calculated successfully
        400: Invalid request or empty cart
        401: Authentication failed (if JWT provided but invalid)
        404: Cart not found
        500: Server error
    """
    try:
        data = request.get_json() or {}
        
        # Get user_id from JWT if authenticated
        user_id = None
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            pass
        
        # Get session_id for guest users
        session_id = sanitize_input(data.get('session_id'))
        
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
        
        # Validate cart is not empty
        if not cart.items or len(cart.items) == 0:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Cart is empty',
                    'details': 'Cannot calculate totals for empty cart'
                }
            }), 400
        
        # Get configuration values
        gst_rate = float(os.environ.get('GST_RATE', '0.03'))
        shipping_rate = float(os.environ.get('SHIPPING_RATE', '100.0'))
        discount_amount = data.get('discount_amount', 0.0)
        
        # Calculate amounts
        amounts = CheckoutService.validate_and_calculate_amounts(
            cart=cart,
            gst_rate=gst_rate,
            shipping_rate=shipping_rate,
            discount_amount=discount_amount
        )
        
        logger.info(f'Totals calculated: cart_id={cart.id}, total={amounts["total_amount"]}')
        
        return jsonify({
            'success': True,
            'data': {
                'amounts': amounts,
                'cart_item_count': len(cart.items)
            }
        }), 200
        
    except ValidationError as e:
        logger.warning(f'Validation error calculating totals: {str(e)}')
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
        logger.error(f'Error calculating totals: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to calculate totals',
                'details': str(e)
            }
        }), 500



@bp.route('/verify', methods=['POST'])
@auth_required
def verify_payment():
    """
    Verify Razorpay payment signature and finalize order.
    
    Request Body:
        - order_id: Internal order ID (required)
        - razorpay_order_id: Razorpay order ID (required)
        - razorpay_payment_id: Razorpay payment ID (required)
        - razorpay_signature: Payment signature (required)
    
    Returns:
        200: Payment verified successfully, order updated to 'paid'
        400: Invalid request data or validation error
        401: Signature verification failed
        404: Order or payment transaction not found
        409: Payment already processed (idempotency check)
        500: Server error
    """
    try:
        data = request.get_json()
        
        if not data:
            logger.warning('Payment verification attempted with empty request body')
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required',
                    'details': 'Payment verification data must be provided'
                }
            }), 400
        
        # Validate required fields
        required_fields = ['order_id', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Missing required fields',
                    'details': f'Required fields: {", ".join(missing_fields)}'
                }
            }), 400
        
        order_id = sanitize_input(data['order_id'])
        razorpay_order_id = sanitize_input(data['razorpay_order_id'])
        razorpay_payment_id = sanitize_input(data['razorpay_payment_id'])
        razorpay_signature = sanitize_input(data['razorpay_signature'])
        
        # Get order
        try:
            order = Order.objects.get(id=order_id)
        except Exception:
            logger.warning(f'Order not found for payment verification: order_id={order_id}')
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Order not found',
                    'details': f'Order with ID {order_id} does not exist'
                }
            }), 404
        
        # Idempotency check: If payment already processed, return success
        if order.payment_status == 'paid' and order.razorpay_payment_id:
            logger.info(
                f'Payment already processed for order: order_id={order_id}, '
                f'payment_id={order.razorpay_payment_id}'
            )
            return jsonify({
                'success': True,
                'data': {
                    'order': order.to_dict(),
                    'message': 'Payment already processed',
                    'idempotent': True
                },
                'message': 'Payment verified successfully'
            }), 200
        
        # Verify Razorpay order ID matches
        if order.razorpay_order_id != razorpay_order_id:
            logger.warning(
                f'Razorpay order ID mismatch: expected={order.razorpay_order_id}, '
                f'received={razorpay_order_id}'
            )
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Order ID mismatch',
                    'details': 'Razorpay order ID does not match the order'
                }
            }), 400
        
        # Verify payment signature
        is_valid = payment_service.verify_signature(
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_signature=razorpay_signature
        )
        
        if not is_valid:
            logger.error(
                f'Payment signature verification failed: order_id={order_id}, '
                f'razorpay_order_id={razorpay_order_id}, razorpay_payment_id={razorpay_payment_id}'
            )
            
            # Log failed verification for audit trail
            log_payment_verification(
                order_id=order_id,
                razorpay_payment_id=razorpay_payment_id,
                status='failure',
                error_message='Signature verification failed'
            )
            
            # Update order status to payment_failed
            order.status = 'payment_failed'
            order.save()
            
            # Update payment transaction
            try:
                payment_transaction = PaymentTransaction.objects.get(
                    razorpay_order_id=razorpay_order_id
                )
                payment_transaction.status = 'failed'
                payment_transaction.error_code = 'SIGNATURE_VERIFICATION_FAILED'
                payment_transaction.error_description = 'Payment signature verification failed'
                payment_transaction.save()
            except Exception as e:
                logger.warning(f'Could not update payment transaction: {str(e)}')
            
            return jsonify({
                'success': False,
                'error': {
                    'code': 401,
                    'message': 'Payment verification failed',
                    'details': 'Invalid payment signature'
                }
            }), 401
        
        # Signature is valid - fetch payment details from Razorpay
        try:
            payment_details = payment_service.fetch_payment_details(razorpay_payment_id)
        except PaymentError as e:
            logger.error(f'Failed to fetch payment details: {str(e)}')
            payment_details = {}
        
        # Update order with payment information
        order.razorpay_payment_id = razorpay_payment_id
        order.razorpay_signature = razorpay_signature
        order.payment_status = 'paid'
        order.status = 'processing'  # Move to processing after successful payment
        order.payment_captured_at = datetime.utcnow()
        order.payment_raw_payload = payment_details
        order.save()
        
        # Update payment transaction
        try:
            payment_transaction = PaymentTransaction.objects.get(
                razorpay_order_id=razorpay_order_id
            )
            payment_transaction.razorpay_payment_id = razorpay_payment_id
            payment_transaction.razorpay_signature = razorpay_signature
            payment_transaction.status = 'success'
            payment_transaction.payment_method = payment_details.get('method', 'unknown')
            payment_transaction.save()
            
            logger.info(
                f'Payment transaction updated: transaction_id={payment_transaction.id}, '
                f'payment_id={razorpay_payment_id}'
            )
        except Exception as e:
            logger.error(f'Failed to update payment transaction: {str(e)}')
        
        # Clear cart after successful payment
        try:
            # Get user_id from JWT if authenticated
            user_id = None
            try:
                from flask_jwt_extended import verify_jwt_in_request
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
            except Exception:
                pass
            
            if user_id:
                cart = CartService.get_or_create_cart(user_id=user_id)
                CartService.clear_cart(cart)
                logger.info(f'Cart cleared after successful payment: user_id={user_id}')
        except Exception as e:
            logger.warning(f'Failed to clear cart: {str(e)}')
        
        logger.info(
            f'Payment verified successfully: order_id={order_id}, '
            f'order_number={order.order_number}, payment_id={razorpay_payment_id}, '
            f'amount={order.total_amount}'
        )
        
        # Log successful verification for audit trail
        log_payment_verification(
            order_id=order_id,
            razorpay_payment_id=razorpay_payment_id,
            status='success'
        )
        
        return jsonify({
            'success': True,
            'data': {
                'order': order.to_dict(),
                'payment': {
                    'payment_id': razorpay_payment_id,
                    'order_id': razorpay_order_id,
                    'status': 'success',
                    'method': payment_details.get('method'),
                    'captured_at': order.payment_captured_at.isoformat() if order.payment_captured_at else None
                }
            },
            'message': 'Payment verified successfully'
        }), 200
        
    except ValidationError as e:
        logger.warning(f'Validation error verifying payment: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': str(e)
            }
        }), 400
    except PaymentError as e:
        logger.error(f'Payment error: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 402,
                'message': 'Payment processing error',
                'details': str(e)
            }
        }), 402
    except Exception as e:
        logger.error(f'Error verifying payment: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to verify payment',
                'details': str(e)
            }
        }), 500



@bp.route('/retry/<order_id>', methods=['POST'])
@auth_required
def retry_payment(order_id):
    """
    Retry payment for a failed order.
    
    Creates a new Razorpay order for an existing order with payment_failed status.
    
    Path Parameters:
        - order_id: Internal order ID
    
    Returns:
        200: New Razorpay order created successfully
        400: Invalid request or order not in payment_failed status
        404: Order not found
        402: Failed to create Razorpay order
        500: Server error
    """
    try:
        # Sanitize order_id
        order_id = sanitize_input(order_id)
        
        # Get order
        try:
            order = Order.objects.get(id=order_id)
        except Exception:
            logger.warning(f'Order not found for payment retry: order_id={order_id}')
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Order not found',
                    'details': f'Order with ID {order_id} does not exist'
                }
            }), 404
        
        # Validate order is in payment_failed status
        if order.status not in ['payment_failed', 'pending_payment']:
            logger.warning(
                f'Payment retry attempted for order not in failed state: '
                f'order_id={order_id}, status={order.status}'
            )
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid order status',
                    'details': f'Payment retry is only allowed for failed payments. Current status: {order.status}'
                }
            }), 400
        
        # Create new Razorpay order
        try:
            razorpay_order = payment_service.create_razorpay_order(
                amount=order.total_amount,
                currency='INR',
                receipt=f'{order.order_number}-RETRY',
                notes={
                    'order_id': str(order.id),
                    'order_number': order.order_number,
                    'customer_name': order.customer_name,
                    'retry': 'true'
                }
            )
            
            # Update order with new Razorpay order ID
            order.razorpay_order_id = razorpay_order['id']
            order.status = 'pending_payment'  # Reset to pending_payment
            order.save()
            
            # Create new payment transaction record
            payment_transaction = PaymentTransaction(
                order_id=order,
                razorpay_order_id=razorpay_order['id'],
                amount=razorpay_order['amount'],
                currency=razorpay_order['currency'],
                status='pending'
            )
            payment_transaction.save()
            
            logger.info(
                f'Payment retry initiated: order_id={order_id}, '
                f'new_razorpay_order_id={razorpay_order["id"]}'
            )
            
            # Return new Razorpay order details for client
            return jsonify({
                'success': True,
                'data': {
                    'order_id': str(order.id),
                    'order_number': order.order_number,
                    'razorpay_order_id': razorpay_order['id'],
                    'amount': order.total_amount,
                    'currency': 'INR',
                    'key_id': payment_service.key_id,
                    'customer': {
                        'name': order.customer_name,
                        'email': order.customer_email,
                        'contact': order.customer_phone
                    }
                },
                'message': 'Payment retry initiated successfully'
            }), 200
            
        except PaymentError as e:
            logger.error(f'Failed to create Razorpay order for retry: {str(e)}')
            return jsonify({
                'success': False,
                'error': {
                    'code': 402,
                    'message': 'Failed to initialize payment retry',
                    'details': str(e)
                }
            }), 402
        
    except ValidationError as e:
        logger.warning(f'Validation error retrying payment: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': str(e)
            }
        }), 400
    except Exception as e:
        logger.error(f'Error retrying payment: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retry payment',
                'details': str(e)
            }
        }), 500
