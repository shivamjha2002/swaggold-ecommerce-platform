"""Products API routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, exceptions as jwt_exceptions
from mongoengine import ValidationError, DoesNotExist
from app.services.product_service import ProductService
from app.utils.validators import validate_product_data
from app.utils.decorators import auth_required, admin_required
import logging

bp = Blueprint('products', __name__)
logger = logging.getLogger(__name__)


@bp.route('/', methods=['GET'])
@auth_required
def get_products():
    """
    Get all products with pagination and filtering.
    
    Query Parameters:
        - page: Page number (default: 1)
        - per_page: Items per page (default: 20, max: 100)
        - category: Filter by category
        - min_price: Minimum base price
        - max_price: Maximum base price
        - min_weight: Minimum weight in grams
        - max_weight: Maximum weight in grams
        - search: Search term for product name
        - include_price: Include calculated current price (default: false)
    
    Returns:
        200: Products retrieved successfully
        400: Invalid request parameters
        500: Server error
    """
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Get filter parameters
        category = request.args.get('category')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        min_weight = request.args.get('min_weight', type=float)
        max_weight = request.args.get('max_weight', type=float)
        search = request.args.get('search')
        include_price = request.args.get('include_price', 'false').lower() == 'true'
        
        # Validate page number
        if page < 1:
            logger.warning(f'Invalid page number requested: {page}')
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid page number',
                    'details': 'Page number must be greater than 0'
                }
            }), 400
        
        # Get products with filters
        products, total = ProductService.get_products_with_filters(
            page=page,
            per_page=per_page,
            category=category,
            min_price=min_price,
            max_price=max_price,
            min_weight=min_weight,
            max_weight=max_weight,
            search=search
        )
        
        # Convert to dict
        products_data = [p.to_dict(include_current_price=include_price) for p in products]
        
        # Calculate pagination metadata
        total_pages = (total + per_page - 1) // per_page
        
        logger.info(f'Products retrieved successfully: {len(products_data)} products on page {page}')
        
        return jsonify({
            'success': True,
            'data': products_data,
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
        logger.error(f'Error retrieving products: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve products',
                'details': str(e)
            }
        }), 500


@bp.route('/admin', methods=['GET'])
@jwt_required()
@admin_required
def get_admin_products():
    """
    Get all products (including drafts) with pagination and filtering - Admin only.
    
    Query Parameters:
        - page: Page number (default: 1)
        - per_page: Items per page (default: 20, max: 100)
        - category: Filter by category
        - status: Filter by status (draft/published)
        - min_price: Minimum base price
        - max_price: Maximum base price
        - min_weight: Minimum weight in grams
        - max_weight: Maximum weight in grams
        - search: Search term for product name
        - include_price: Include calculated current price (default: false)
    
    Returns:
        200: Products retrieved successfully
        400: Invalid request parameters
        401: Authentication failed (missing or invalid JWT token)
        403: Authorization failed (admin role required)
        500: Server error
    """
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Get filter parameters
        category = request.args.get('category')
        status = request.args.get('status')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        min_weight = request.args.get('min_weight', type=float)
        max_weight = request.args.get('max_weight', type=float)
        search = request.args.get('search')
        include_price = request.args.get('include_price', 'false').lower() == 'true'
        
        # Validate page number
        if page < 1:
            logger.warning(f'Invalid page number requested: {page}')
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid page number',
                    'details': 'Page number must be greater than 0'
                }
            }), 400
        
        # Validate status filter if provided
        if status and status not in ['draft', 'published']:
            logger.warning(f'Invalid status filter requested: {status}')
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid status filter',
                    'details': 'Status must be either "draft" or "published"'
                }
            }), 400
        
        # Get products with filters (admin version - includes all statuses)
        products, total = ProductService.get_admin_products_with_filters(
            page=page,
            per_page=per_page,
            category=category,
            status=status,
            min_price=min_price,
            max_price=max_price,
            min_weight=min_weight,
            max_weight=max_weight,
            search=search
        )
        
        # Convert to dict
        products_data = [p.to_dict(include_current_price=include_price) for p in products]
        
        # Calculate pagination metadata
        total_pages = (total + per_page - 1) // per_page
        
        logger.info(f'Admin products retrieved successfully: {len(products_data)} products on page {page}')
        
        return jsonify({
            'success': True,
            'data': products_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        }), 200
        
    except jwt_exceptions.NoAuthorizationError:
        logger.warning('Admin products access attempted without JWT token')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Authentication required',
                'details': 'Missing or invalid JWT token in request headers'
            }
        }), 401
    except jwt_exceptions.InvalidHeaderError as e:
        logger.warning(f'Invalid JWT header format: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Invalid authentication header',
                'details': str(e)
            }
        }), 401
    except jwt_exceptions.JWTDecodeError as e:
        logger.warning(f'JWT decode error: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Invalid JWT token',
                'details': 'Token could not be decoded or verified'
            }
        }), 401
    except jwt_exceptions.ExpiredSignatureError:
        logger.warning('Expired JWT token used for admin products access')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Token expired',
                'details': 'Your session has expired. Please login again'
            }
        }), 401
    except Exception as e:
        logger.error(f'Error retrieving admin products: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve products',
                'details': str(e)
            }
        }), 500


@bp.route('/<product_id>', methods=['GET'])
@auth_required
def get_product(product_id):
    """
    Get product by ID.
    
    Query Parameters:
        - include_price: Include calculated current price (default: true)
    
    Returns:
        200: Product retrieved successfully
        404: Product not found
        500: Server error
    """
    try:
        include_price = request.args.get('include_price', 'true').lower() == 'true'
        
        product = ProductService.get_product_by_id(product_id)
        
        if not product:
            logger.warning(f'Product not found: {product_id}')
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Product not found',
                    'details': f'No product exists with ID: {product_id}'
                }
            }), 404
        
        logger.info(f'Product retrieved successfully: {product_id} - {product.name}')
        
        return jsonify({
            'success': True,
            'data': product.to_dict(include_current_price=include_price)
        }), 200
        
    except DoesNotExist:
        logger.warning(f'Product does not exist: {product_id}')
        return jsonify({
            'success': False,
            'error': {
                'code': 404,
                'message': 'Product not found',
                'details': f'No product exists with ID: {product_id}'
            }
        }), 404
    except Exception as e:
        logger.error(f'Error retrieving product {product_id}: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve product',
                'details': str(e)
            }
        }), 500


@bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_product():
    """
    Create new product.
    
    Required fields:
        - name: Product name
        - category: Product category
        - base_price: Base price
        - weight: Weight in grams
    
    Optional fields:
        - gold_purity: Gold purity (916, 750, 585)
        - description: Product description
        - image_url: Image URL
        - stock_quantity: Stock quantity
    
    Returns:
        201: Product created successfully
        400: Invalid request data or validation error
        500: Server error
    """
    try:
        data = request.get_json()
        
        if not data:
            logger.warning('Product creation attempted with empty request body')
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required',
                    'details': 'Product data must be provided in JSON format'
                }
            }), 400
        
        # Validate product data
        is_valid, error_message = validate_product_data(data)
        if not is_valid:
            logger.warning(f'Product validation failed: {error_message}')
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Validation error',
                    'details': error_message
                }
            }), 400
        
        # Create product
        product = ProductService.create_product(data)
        
        logger.info(f'Product created successfully: {product.id} - {product.name}')
        
        return jsonify({
            'success': True,
            'data': product.to_dict(include_current_price=True),
            'message': 'Product created successfully'
        }), 201
        
    except ValidationError as e:
        logger.error(f'MongoDB validation error during product creation: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Database validation error',
                'details': str(e)
            }
        }), 400
    except Exception as e:
        logger.error(f'Error creating product: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to create product',
                'details': str(e)
            }
        }), 500


@bp.route('/<product_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_product(product_id):
    """
    Update product.
    
    All fields are optional. Only provided fields will be updated.
    
    Returns:
        200: Product updated successfully
        400: Invalid request data or validation error
        404: Product not found
        500: Server error
    """
    try:
        data = request.get_json()
        
        if not data:
            logger.warning(f'Product update attempted with empty request body for product {product_id}')
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required',
                    'details': 'Update data must be provided in JSON format'
                }
            }), 400
        
        # Validate product data (partial validation for updates)
        is_valid, error_message = validate_product_data(data, partial=True)
        if not is_valid:
            logger.warning(f'Product update validation failed for {product_id}: {error_message}')
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Validation error',
                    'details': error_message
                }
            }), 400
        
        # Update product
        product = ProductService.update_product(product_id, data)
        
        if not product:
            logger.warning(f'Product update failed: Product {product_id} not found')
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Product not found',
                    'details': f'No product exists with ID: {product_id}'
                }
            }), 404
        
        logger.info(f'Product updated successfully: {product_id} - {product.name}')
        
        return jsonify({
            'success': True,
            'data': product.to_dict(include_current_price=True),
            'message': 'Product updated successfully'
        }), 200
        
    except ValidationError as e:
        logger.error(f'MongoDB validation error during product update: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Database validation error',
                'details': str(e)
            }
        }), 400
    except DoesNotExist:
        logger.warning(f'Product update failed: Product {product_id} does not exist')
        return jsonify({
            'success': False,
            'error': {
                'code': 404,
                'message': 'Product not found',
                'details': f'No product exists with ID: {product_id}'
            }
        }), 404
    except Exception as e:
        logger.error(f'Error updating product {product_id}: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to update product',
                'details': str(e)
            }
        }), 500


@bp.route('/<product_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_product(product_id):
    """
    Delete product (soft delete).
    
    Sets is_active flag to False instead of removing from database.
    
    Returns:
        200: Product deleted successfully
        404: Product not found
        500: Server error
    """
    try:
        success = ProductService.delete_product(product_id)
        
        if not success:
            logger.warning(f'Product deletion failed: Product {product_id} not found')
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Product not found',
                    'details': f'No product exists with ID: {product_id}'
                }
            }), 404
        
        logger.info(f'Product deleted successfully: {product_id}')
        
        return jsonify({
            'success': True,
            'message': 'Product deleted successfully'
        }), 200
        
    except DoesNotExist:
        logger.warning(f'Product deletion failed: Product {product_id} does not exist')
        return jsonify({
            'success': False,
            'error': {
                'code': 404,
                'message': 'Product not found',
                'details': f'No product exists with ID: {product_id}'
            }
        }), 404
    except Exception as e:
        logger.error(f'Error deleting product {product_id}: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to delete product',
                'details': str(e)
            }
        }), 500


@bp.route('/<product_id>/publish', methods=['POST'])
@jwt_required()
@admin_required
def publish_product(product_id):
    """
    Publish a draft product - Admin only.
    
    Changes product status from 'draft' to 'published' and sets published_at timestamp.
    
    Returns:
        200: Product published successfully
        401: Authentication failed (missing or invalid JWT token)
        403: Authorization failed (admin role required)
        404: Product not found
        500: Server error
    """
    try:
        product = ProductService.publish_product(product_id)
        
        if not product:
            logger.warning(f'Product publish failed: Product {product_id} not found')
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Product not found',
                    'details': f'No product exists with ID: {product_id}'
                }
            }), 404
        
        logger.info(f'Product published successfully: {product_id} - {product.name}')
        
        return jsonify({
            'success': True,
            'data': product.to_dict(include_current_price=True),
            'message': 'Product published successfully'
        }), 200
        
    except jwt_exceptions.NoAuthorizationError:
        logger.warning(f'Product publish attempted without JWT token for product {product_id}')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Authentication required',
                'details': 'Missing or invalid JWT token in request headers'
            }
        }), 401
    except jwt_exceptions.InvalidHeaderError as e:
        logger.warning(f'Invalid JWT header format during product publish: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Invalid authentication header',
                'details': str(e)
            }
        }), 401
    except jwt_exceptions.JWTDecodeError as e:
        logger.warning(f'JWT decode error during product publish: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Invalid JWT token',
                'details': 'Token could not be decoded or verified'
            }
        }), 401
    except jwt_exceptions.ExpiredSignatureError:
        logger.warning(f'Expired JWT token used for product publish: {product_id}')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Token expired',
                'details': 'Your session has expired. Please login again'
            }
        }), 401
    except DoesNotExist:
        logger.warning(f'Product publish failed: Product {product_id} does not exist')
        return jsonify({
            'success': False,
            'error': {
                'code': 404,
                'message': 'Product not found',
                'details': f'No product exists with ID: {product_id}'
            }
        }), 404
    except Exception as e:
        logger.error(f'Error publishing product {product_id}: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to publish product',
                'details': str(e)
            }
        }), 500


@bp.route('/<product_id>/unpublish', methods=['POST'])
@jwt_required()
@admin_required
def unpublish_product(product_id):
    """
    Unpublish a product back to draft - Admin only.
    
    Changes product status from 'published' to 'draft' and clears published_at timestamp.
    
    Returns:
        200: Product unpublished successfully
        401: Authentication failed (missing or invalid JWT token)
        403: Authorization failed (admin role required)
        404: Product not found
        500: Server error
    """
    try:
        product = ProductService.unpublish_product(product_id)
        
        if not product:
            logger.warning(f'Product unpublish failed: Product {product_id} not found')
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Product not found',
                    'details': f'No product exists with ID: {product_id}'
                }
            }), 404
        
        logger.info(f'Product unpublished successfully: {product_id} - {product.name}')
        
        return jsonify({
            'success': True,
            'data': product.to_dict(include_current_price=True),
            'message': 'Product unpublished successfully'
        }), 200
        
    except jwt_exceptions.NoAuthorizationError:
        logger.warning(f'Product unpublish attempted without JWT token for product {product_id}')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Authentication required',
                'details': 'Missing or invalid JWT token in request headers'
            }
        }), 401
    except jwt_exceptions.InvalidHeaderError as e:
        logger.warning(f'Invalid JWT header format during product unpublish: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Invalid authentication header',
                'details': str(e)
            }
        }), 401
    except jwt_exceptions.JWTDecodeError as e:
        logger.warning(f'JWT decode error during product unpublish: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Invalid JWT token',
                'details': 'Token could not be decoded or verified'
            }
        }), 401
    except jwt_exceptions.ExpiredSignatureError:
        logger.warning(f'Expired JWT token used for product unpublish: {product_id}')
        return jsonify({
            'success': False,
            'error': {
                'code': 401,
                'message': 'Token expired',
                'details': 'Your session has expired. Please login again'
            }
        }), 401
    except DoesNotExist:
        logger.warning(f'Product unpublish failed: Product {product_id} does not exist')
        return jsonify({
            'success': False,
            'error': {
                'code': 404,
                'message': 'Product not found',
                'details': f'No product exists with ID: {product_id}'
            }
        }), 404
    except Exception as e:
        logger.error(f'Error unpublishing product {product_id}: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to unpublish product',
                'details': str(e)
            }
        }), 500
