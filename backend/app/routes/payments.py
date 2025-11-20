"""Payment transactions API routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
import logging
from app.models.payment_transaction import PaymentTransaction
from app.models.order import Order

logger = logging.getLogger(__name__)

bp = Blueprint('payments', __name__, url_prefix='/admin/payments')


@bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    """
    Get payment transactions (Admin only).
    
    Query Parameters:
        - page: Page number (default: 1)
        - per_page: Items per page (default: 10)
        - status: Filter by status (optional)
        - order_id: Filter by order ID (optional)
    
    Returns:
        200: Transactions retrieved successfully
        403: Not authorized (admin only)
        500: Server error
    """
    try:
        # Check if user is admin
        jwt_data = get_jwt()
        if jwt_data.get('role') != 'admin':
            return jsonify({
                'success': False,
                'error': {
                    'code': 403,
                    'message': 'Admin access required'
                }
            }), 403
        
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        status = request.args.get('status')
        order_id = request.args.get('order_id')
        
        # Build query
        query = {}
        if status:
            query['status'] = status
        if order_id:
            query['order_id'] = order_id
        
        # Get transactions with pagination
        transactions = PaymentTransaction.objects(**query).order_by('-created_at')
        total = transactions.count()
        
        # Paginate
        transactions = transactions.skip((page - 1) * per_page).limit(per_page)
        
        # Format response
        transactions_data = []
        for txn in transactions:
            # Get order details
            order = Order.objects(id=txn.order_id).first() if txn.order_id else None
            
            transactions_data.append({
                'id': str(txn.id),
                'order_id': str(txn.order_id) if txn.order_id else None,
                'order_number': order.order_number if order else None,
                'razorpay_order_id': txn.razorpay_order_id,
                'razorpay_payment_id': txn.razorpay_payment_id,
                'amount': txn.amount,
                'currency': txn.currency,
                'status': txn.status,
                'payment_method': txn.payment_method,
                'error_code': txn.error_code,
                'error_description': txn.error_description,
                'created_at': txn.created_at.isoformat() if txn.created_at else None,
                'updated_at': txn.updated_at.isoformat() if txn.updated_at else None
            })
        
        return jsonify({
            'success': True,
            'data': {
                'transactions': transactions_data,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                }
            }
        }), 200
    
    except Exception as e:
        logger.error(f'Error fetching transactions: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to fetch transactions'
            }
        }), 500


@bp.route('/transactions/<transaction_id>', methods=['GET'])
@jwt_required()
def get_transaction(transaction_id):
    """
    Get single payment transaction details (Admin only).
    
    Returns:
        200: Transaction retrieved successfully
        403: Not authorized
        404: Transaction not found
        500: Server error
    """
    try:
        # Check if user is admin
        jwt_data = get_jwt()
        if jwt_data.get('role') != 'admin':
            return jsonify({
                'success': False,
                'error': {
                    'code': 403,
                    'message': 'Admin access required'
                }
            }), 403
        
        # Get transaction
        txn = PaymentTransaction.objects(id=transaction_id).first()
        
        if not txn:
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Transaction not found'
                }
            }), 404
        
        # Get order details
        order = Order.objects(id=txn.order_id).first() if txn.order_id else None
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(txn.id),
                'order_id': str(txn.order_id) if txn.order_id else None,
                'order_number': order.order_number if order else None,
                'razorpay_order_id': txn.razorpay_order_id,
                'razorpay_payment_id': txn.razorpay_payment_id,
                'razorpay_signature': txn.razorpay_signature,
                'amount': txn.amount,
                'currency': txn.currency,
                'status': txn.status,
                'payment_method': txn.payment_method,
                'error_code': txn.error_code,
                'error_description': txn.error_description,
                'metadata': txn.metadata,
                'created_at': txn.created_at.isoformat() if txn.created_at else None,
                'updated_at': txn.updated_at.isoformat() if txn.updated_at else None
            }
        }), 200
    
    except Exception as e:
        logger.error(f'Error fetching transaction: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to fetch transaction'
            }
        }), 500


@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_payment_stats():
    """
    Get payment statistics (Admin only).
    
    Returns:
        200: Stats retrieved successfully
        403: Not authorized
        500: Server error
    """
    try:
        # Check if user is admin
        jwt_data = get_jwt()
        if jwt_data.get('role') != 'admin':
            return jsonify({
                'success': False,
                'error': {
                    'code': 403,
                    'message': 'Admin access required'
                }
            }), 403
        
        # Get stats
        total_transactions = PaymentTransaction.objects.count()
        successful = PaymentTransaction.objects(status='captured').count()
        failed = PaymentTransaction.objects(status='failed').count()
        pending = PaymentTransaction.objects(status__in=['created', 'authorized']).count()
        
        # Calculate total amount
        total_amount = 0
        for txn in PaymentTransaction.objects(status='captured'):
            total_amount += txn.amount
        
        return jsonify({
            'success': True,
            'data': {
                'total_transactions': total_transactions,
                'successful': successful,
                'failed': failed,
                'pending': pending,
                'total_amount': total_amount,
                'success_rate': (successful / total_transactions * 100) if total_transactions > 0 else 0
            }
        }), 200
    
    except Exception as e:
        logger.error(f'Error fetching payment stats: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to fetch stats'
            }
        }), 500
