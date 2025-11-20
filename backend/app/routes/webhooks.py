"""Webhook routes for Razorpay payment events."""
import logging
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from app.services.payment_service import payment_service
from app.models.order import Order
from app.models.payment_transaction import PaymentTransaction
from app.utils.rate_limiter import limiter, get_rate_limit
from app.utils.security import log_security_event
from app.utils.audit_logger import log_webhook_event
from mongoengine.errors import DoesNotExist


logger = logging.getLogger(__name__)

bp = Blueprint('webhooks', __name__)


@bp.route('/razorpay', methods=['POST'])
@limiter.limit(get_rate_limit('webhook'))
def razorpay_webhook():
    """
    Handle Razorpay webhook events.
    
    This endpoint receives payment status notifications from Razorpay.
    It verifies the webhook signature and processes payment events.
    
    SECURITY:
    - Rate limited to 100 requests per minute
    - Signature verification required
    - All events logged for audit trail
    
    Expected events:
    - payment.authorized: Payment has been authorized
    - payment.captured: Payment has been captured
    - payment.failed: Payment has failed
    
    Returns:
        JSON response with success status
    """
    # Get client IP for logging
    client_ip = request.remote_addr or 'unknown'
    
    # Get raw payload and signature
    payload = request.get_data(as_text=True)
    signature = request.headers.get('X-Razorpay-Signature', '')
    
    # Log webhook attempt
    logger.info(
        f'Webhook received from {client_ip}: '
        f'signature={signature[:20]}..., payload_size={len(payload)}'
    )
    
    # Verify webhook signature
    if not payment_service.verify_webhook_signature(payload, signature):
        logger.error(
            f'Webhook signature verification failed from {client_ip}. '
            f'Signature: {signature[:20]}...'
        )
        
        # Log security event
        log_security_event('webhook_signature_failed', {
            'ip': client_ip,
            'signature': signature[:20] + '...',
            'payload_size': len(payload)
        })
        
        # Log full payload for security audit
        logger.error(f'Invalid webhook payload: {payload}')
        
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Invalid signature',
                'details': 'Webhook signature verification failed'
            }
        }), 401
    
    # Parse webhook data
    try:
        webhook_data = request.get_json()
        
        if not webhook_data:
            logger.error('Webhook payload is empty or invalid JSON')
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid payload',
                    'details': 'Webhook payload must be valid JSON'
                }
            }), 400
        
        event = webhook_data.get('event')
        payload_data = webhook_data.get('payload', {})
        
        logger.info(f'Processing webhook event: {event}')
        logger.debug(f'Webhook payload: {webhook_data}')
        
        # Process the webhook event
        result = process_webhook_event(event, payload_data, webhook_data)
        
        # Log webhook event for audit trail
        payment_entity = payload_data.get('payment', {}).get('entity', {})
        log_webhook_event(
            event_type=event,
            razorpay_order_id=payment_entity.get('order_id', ''),
            razorpay_payment_id=payment_entity.get('id'),
            status='success' if result['success'] else 'failure',
            payload=webhook_data,
            error_message=result.get('message') if not result['success'] else None
        )
        
        if result['success']:
            logger.info(f'Webhook processed successfully: {event}')
            return jsonify(result), 200
        else:
            logger.warning(f'Webhook processing failed: {event} - {result.get("message")}')
            return jsonify(result), 200  # Return 200 to acknowledge receipt
            
    except Exception as e:
        logger.error(f'Error processing webhook: {str(e)}', exc_info=True)
        
        # Return 200 to prevent Razorpay from retrying
        # Log the error for manual investigation
        return jsonify({
            'success': False,
            'message': 'Webhook received but processing failed',
            'error': str(e)
        }), 200


def process_webhook_event(event, payload_data, full_webhook_data):
    """
    Process different types of webhook events.
    
    Args:
        event: Event type (e.g., 'payment.captured')
        payload_data: Event payload data
        full_webhook_data: Complete webhook data for logging
        
    Returns:
        dict: Processing result with success status and message
    """
    try:
        # Extract payment entity from payload
        payment_entity = payload_data.get('payment', {}).get('entity', {})
        
        if not payment_entity:
            logger.warning(f'No payment entity in webhook payload for event: {event}')
            return {
                'success': False,
                'message': 'No payment entity in payload'
            }
        
        razorpay_order_id = payment_entity.get('order_id')
        razorpay_payment_id = payment_entity.get('id')
        
        if not razorpay_order_id:
            logger.warning(f'No order_id in payment entity for event: {event}')
            return {
                'success': False,
                'message': 'No order_id in payment entity'
            }
        
        logger.info(
            f'Processing {event} for order: {razorpay_order_id}, '
            f'payment: {razorpay_payment_id}'
        )
        
        # Find the order
        order = Order.objects(razorpay_order_id=razorpay_order_id).first()
        
        if not order:
            logger.error(f'Order not found for razorpay_order_id: {razorpay_order_id}')
            return {
                'success': False,
                'message': f'Order not found: {razorpay_order_id}'
            }
        
        # Find or create payment transaction
        transaction = PaymentTransaction.objects(
            razorpay_order_id=razorpay_order_id
        ).first()
        
        if not transaction:
            logger.warning(
                f'Payment transaction not found for order: {razorpay_order_id}. '
                f'Creating new transaction.'
            )
            transaction = PaymentTransaction(
                order_id=order,
                razorpay_order_id=razorpay_order_id,
                amount=payment_entity.get('amount', 0),
                currency=payment_entity.get('currency', 'INR'),
                status='pending'
            )
            transaction.save()
        
        # Store webhook event in transaction
        transaction.add_webhook_event(full_webhook_data)
        
        # Process based on event type
        if event == 'payment.authorized':
            return handle_payment_authorized(order, transaction, payment_entity)
        
        elif event == 'payment.captured':
            return handle_payment_captured(order, transaction, payment_entity)
        
        elif event == 'payment.failed':
            return handle_payment_failed(order, transaction, payment_entity)
        
        else:
            logger.info(f'Unhandled webhook event type: {event}')
            return {
                'success': True,
                'message': f'Event {event} acknowledged but not processed'
            }
            
    except Exception as e:
        logger.error(f'Error in process_webhook_event: {str(e)}', exc_info=True)
        return {
            'success': False,
            'message': f'Processing error: {str(e)}'
        }


def handle_payment_authorized(order, transaction, payment_entity):
    """
    Handle payment.authorized event.
    
    Args:
        order: Order document
        transaction: PaymentTransaction document
        payment_entity: Payment entity from webhook
        
    Returns:
        dict: Processing result
    """
    razorpay_payment_id = payment_entity.get('id')
    
    logger.info(
        f'Payment authorized: order={order.order_number}, '
        f'payment={razorpay_payment_id}'
    )
    
    # Update transaction
    transaction.razorpay_payment_id = razorpay_payment_id
    transaction.payment_method = payment_entity.get('method')
    transaction.status = 'success'
    transaction.save()
    
    # Update order status if still pending
    if order.status == 'pending_payment':
        order.status = 'processing'
        order.razorpay_payment_id = razorpay_payment_id
        order.save()
        
        logger.info(f'Order {order.order_number} status updated to processing')
    
    return {
        'success': True,
        'message': 'Payment authorized event processed'
    }


def handle_payment_captured(order, transaction, payment_entity):
    """
    Handle payment.captured event.
    
    Args:
        order: Order document
        transaction: PaymentTransaction document
        payment_entity: Payment entity from webhook
        
    Returns:
        dict: Processing result
    """
    razorpay_payment_id = payment_entity.get('id')
    
    logger.info(
        f'Payment captured: order={order.order_number}, '
        f'payment={razorpay_payment_id}'
    )
    
    # Check for idempotency - if already processed, skip
    if order.payment_status == 'paid' and order.status not in ['pending_payment', 'payment_failed']:
        logger.info(
            f'Payment already captured for order {order.order_number}. '
            f'Skipping duplicate processing.'
        )
        return {
            'success': True,
            'message': 'Payment already captured (idempotent)'
        }
    
    # Update transaction
    transaction.razorpay_payment_id = razorpay_payment_id
    transaction.payment_method = payment_entity.get('method')
    transaction.status = 'success'
    transaction.save()
    
    # Update order
    order.status = 'processing'
    order.payment_status = 'paid'
    order.razorpay_payment_id = razorpay_payment_id
    order.payment_captured_at = datetime.utcnow()
    order.payment_raw_payload = payment_entity
    order.save()
    
    logger.info(
        f'Order {order.order_number} marked as paid. '
        f'Status: {order.status}, Payment status: {order.payment_status}'
    )
    
    return {
        'success': True,
        'message': 'Payment captured event processed'
    }


def handle_payment_failed(order, transaction, payment_entity):
    """
    Handle payment.failed event.
    
    Args:
        order: Order document
        transaction: PaymentTransaction document
        payment_entity: Payment entity from webhook
        
    Returns:
        dict: Processing result
    """
    razorpay_payment_id = payment_entity.get('id')
    error_code = payment_entity.get('error_code')
    error_description = payment_entity.get('error_description')
    
    logger.warning(
        f'Payment failed: order={order.order_number}, '
        f'payment={razorpay_payment_id}, error={error_code}'
    )
    
    # Update transaction
    transaction.razorpay_payment_id = razorpay_payment_id
    transaction.payment_method = payment_entity.get('method')
    transaction.status = 'failed'
    transaction.error_code = error_code
    transaction.error_description = error_description
    transaction.save()
    
    # Update order status
    order.status = 'payment_failed'
    order.razorpay_payment_id = razorpay_payment_id
    order.save()
    
    logger.info(
        f'Order {order.order_number} marked as payment_failed. '
        f'Error: {error_code} - {error_description}'
    )
    
    return {
        'success': True,
        'message': 'Payment failed event processed'
    }
