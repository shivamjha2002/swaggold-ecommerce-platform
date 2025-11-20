"""Khata API routes."""
from flask import Blueprint, request, jsonify
from mongoengine import ValidationError, DoesNotExist
from bson import ObjectId
from bson.errors import InvalidId
from app.models.customer import Customer
from app.models.khata import KhataTransaction
from app.services.khata_service import KhataService

bp = Blueprint('khata', __name__)
khata_service = KhataService()


@bp.route('/transactions', methods=['POST'])
def create_transaction():
    """
    Create khata transaction with atomic balance update.
    
    Request body:
        {
            "customer_id": "507f1f77bcf86cd799439011",
            "transaction_type": "credit",  # or "debit"
            "amount": 50000,
            "description": "Payment for gold necklace",  # optional
            "payment_method": "cash",  # optional: cash, upi, card, cheque, bank_transfer
            "reference_number": "UPI123456",  # optional
            "created_by": "admin_user"  # optional
        }
    
    Returns:
        201: Transaction created successfully
        400: Validation error
        404: Customer not found
        500: Server error
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required'
                }
            }), 400
        
        if not data.get('customer_id'):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'customer_id is required'
                }
            }), 400
        
        if not data.get('transaction_type'):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'transaction_type is required'
                }
            }), 400
        
        if data['transaction_type'] not in ['credit', 'debit']:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'transaction_type must be either "credit" or "debit"'
                }
            }), 400
        
        if not data.get('amount'):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'amount is required'
                }
            }), 400
        
        try:
            amount = float(data['amount'])
            if amount <= 0:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'amount must be greater than 0'
                    }
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'amount must be a valid number'
                }
            }), 400
        
        # Validate customer_id format
        try:
            ObjectId(data['customer_id'])
        except (InvalidId, TypeError):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid customer_id format'
                }
            }), 400
        
        # Create transaction using service (with atomic balance update)
        transaction = khata_service.create_transaction(
            customer_id=data['customer_id'],
            transaction_type=data['transaction_type'],
            amount=amount,
            description=data.get('description'),
            payment_method=data.get('payment_method'),
            reference_number=data.get('reference_number'),
            created_by=data.get('created_by')
        )
        
        return jsonify({
            'success': True,
            'data': transaction
        }), 201
        
    except DoesNotExist:
        return jsonify({
            'success': False,
            'error': {
                'code': 404,
                'message': 'Customer not found'
            }
        }), 404
    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': str(e)
            }
        }), 400
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': str(e)
            }
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'An unexpected error occurred',
                'details': str(e)
            }
        }), 500


@bp.route('/transactions', methods=['GET'])
def get_transactions():
    """
    Get khata transactions with optional date range filtering.
    
    Query parameters:
        start_date: Start date for filtering (ISO format: YYYY-MM-DD)
        end_date: End date for filtering (ISO format: YYYY-MM-DD)
        customer_id: Filter by specific customer (optional)
        limit: Maximum number of transactions to return (default: 100)
        skip: Number of transactions to skip for pagination (default: 0)
    
    Returns:
        200: List of transactions
        400: Invalid date format or customer ID
        500: Server error
    """
    try:
        from datetime import datetime
        
        # Get query parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        customer_id = request.args.get('customer_id')
        limit = request.args.get('limit', 100, type=int)
        skip = request.args.get('skip', 0, type=int)
        
        # Validate pagination parameters
        if limit < 1 or limit > 1000:
            limit = 100
        if skip < 0:
            skip = 0
        
        # Build query
        query = {}
        
        if start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str)
                query['created_at__gte'] = start_date
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid start_date format. Use YYYY-MM-DD'
                    }
                }), 400
        
        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str)
                # Set to end of day
                end_date = end_date.replace(hour=23, minute=59, second=59)
                query['created_at__lte'] = end_date
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid end_date format. Use YYYY-MM-DD'
                    }
                }), 400
        
        if customer_id:
            # Validate customer_id format
            try:
                ObjectId(customer_id)
                query['customer'] = customer_id
            except (InvalidId, TypeError):
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid customer_id format'
                    }
                }), 400
        
        # Get transactions
        transactions = KhataTransaction.objects(**query).order_by('-created_at').skip(skip).limit(limit)
        total_count = KhataTransaction.objects(**query).count()
        
        # Format transaction data for export
        transactions_data = []
        for transaction in transactions:
            transactions_data.append({
                'id': str(transaction.id),
                'customer_id': str(transaction.customer.id),
                'customer_name': transaction.customer.name if transaction.customer else 'Unknown',
                'transaction_type': transaction.transaction_type,
                'amount': transaction.amount,
                'balance_after': transaction.balance_after,
                'description': transaction.description or '',
                'payment_method': transaction.payment_method or 'N/A',
                'reference_number': transaction.reference_number or '',
                'created_at': transaction.created_at.isoformat() if transaction.created_at else None,
                'created_by': transaction.created_by or 'N/A'
            })
        
        return jsonify({
            'success': True,
            'data': transactions_data,
            'pagination': {
                'total': total_count,
                'limit': limit,
                'skip': skip,
                'has_more': (skip + limit) < total_count
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'An unexpected error occurred',
                'details': str(e)
            }
        }), 500


@bp.route('/summary', methods=['GET'])
def get_summary():
    """
    Get overall khata summary across all customers.
    
    Returns:
        200: Summary data
        500: Server error
    """
    try:
        summary = khata_service.get_overall_summary()
        
        return jsonify({
            'success': True,
            'data': summary
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'An unexpected error occurred',
                'details': str(e)
            }
        }), 500
