"""Customers API routes."""
from flask import Blueprint, request, jsonify
from mongoengine import ValidationError, DoesNotExist
from bson import ObjectId
from bson.errors import InvalidId
from app.models.customer import Customer
from app.models.khata import KhataTransaction

bp = Blueprint('customers', __name__)


@bp.route('/', methods=['GET'])
def get_customers():
    """
    Get all customers.
    
    Query parameters:
        limit: Maximum number of customers to return (default: 100)
        skip: Number of customers to skip for pagination (default: 0)
    
    Returns:
        200: List of customers
        500: Server error
    """
    try:
        # Get pagination parameters
        limit = request.args.get('limit', 100, type=int)
        skip = request.args.get('skip', 0, type=int)
        
        # Validate pagination parameters
        if limit < 1 or limit > 1000:
            limit = 100
        if skip < 0:
            skip = 0
        
        # Get customers
        customers = Customer.objects().skip(skip).limit(limit).order_by('-created_at')
        total_count = Customer.objects().count()
        
        # Format customer data
        customers_data = [customer.to_dict() for customer in customers]
        
        return jsonify({
            'success': True,
            'data': customers_data,
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


@bp.route('/', methods=['POST'])
def create_customer():
    """
    Create new customer.
    
    Request body:
        {
            "name": "Customer Name",
            "phone": "1234567890",
            "email": "customer@example.com",  # optional
            "address": "Customer Address"  # optional
        }
    
    Returns:
        201: Customer created successfully
        400: Validation error
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
        
        if not data.get('name'):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Customer name is required'
                }
            }), 400
        
        if not data.get('phone'):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Phone number is required'
                }
            }), 400
        
        # Check if customer with phone already exists
        existing_customer = Customer.objects(phone=data['phone']).first()
        if existing_customer:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': f'Customer with phone {data["phone"]} already exists'
                }
            }), 400
        
        # Create customer
        customer = Customer(
            name=data['name'],
            phone=data['phone'],
            email=data.get('email'),
            address=data.get('address')
        )
        customer.save()
        
        return jsonify({
            'success': True,
            'data': customer.to_dict()
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
                'message': 'An unexpected error occurred',
                'details': str(e)
            }
        }), 500


@bp.route('/<customer_id>/khata', methods=['GET'])
def get_customer_khata(customer_id):
    """
    Get customer khata transactions with transaction history.
    
    Query parameters:
        limit: Maximum number of transactions to return (default: 50)
        skip: Number of transactions to skip for pagination (default: 0)
    
    Returns:
        200: Customer khata data with transactions
        400: Invalid customer ID
        404: Customer not found
        500: Server error
    """
    try:
        # Validate customer_id format
        try:
            ObjectId(customer_id)
        except (InvalidId, TypeError):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid customer ID format'
                }
            }), 400
        
        # Get customer
        try:
            customer = Customer.objects.get(id=customer_id)
        except DoesNotExist:
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Customer not found'
                }
            }), 404
        
        # Get pagination parameters
        limit = request.args.get('limit', 50, type=int)
        skip = request.args.get('skip', 0, type=int)
        
        # Validate pagination parameters
        if limit < 1 or limit > 100:
            limit = 50
        if skip < 0:
            skip = 0
        
        # Get transactions
        transactions = KhataTransaction.get_customer_transactions(
            customer_id=customer_id,
            limit=limit,
            skip=skip
        )
        
        # Get transaction summary
        summary = KhataTransaction.get_transaction_summary(customer_id)
        
        # Get total count for pagination
        total_transactions = KhataTransaction.objects(customer=customer_id).count()
        
        return jsonify({
            'success': True,
            'data': {
                'customer': customer.to_dict(),
                'transactions': transactions,
                'summary': summary,
                'pagination': {
                    'total': total_transactions,
                    'limit': limit,
                    'skip': skip,
                    'has_more': (skip + limit) < total_transactions
                }
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
