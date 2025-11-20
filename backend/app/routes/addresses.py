"""Address management API routes."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from mongoengine.errors import ValidationError as MongoValidationError, DoesNotExist
from app.models.address import Address
from app.models.user import User
from app.utils.decorators import auth_required
from app.utils.validators import (
    validate_mobile_number,
    validate_pin_code,
    sanitize_string,
    validate_string_length
)
from app.utils.exceptions import ValidationError, ResourceNotFoundError
import logging

bp = Blueprint('addresses', __name__)
logger = logging.getLogger(__name__)


def validate_address_data(data, partial=False):
    """
    Validate address data.
    
    Args:
        data: Address data dictionary
        partial: If True, only validate provided fields (for updates)
        
    Returns:
        dict: Validated and sanitized data
        
    Raises:
        ValidationError: If validation fails
    """
    errors = {}
    validated_data = {}
    
    # Required fields for creation
    if not partial:
        required_fields = ['full_name', 'phone', 'address_line1', 'city', 'state', 'pin_code']
        for field in required_fields:
            if field not in data or not data[field]:
                errors[field] = f'{field.replace("_", " ").title()} is required'
    
    # Validate full_name
    if 'full_name' in data:
        try:
            full_name = sanitize_string(data['full_name'], max_length=200)
            is_valid, error_msg = validate_string_length(full_name, 'Full name', min_length=2, max_length=200)
            if not is_valid:
                errors['full_name'] = error_msg
            else:
                validated_data['full_name'] = full_name
        except ValueError as e:
            errors['full_name'] = str(e)
    
    # Validate phone
    if 'phone' in data:
        is_valid, result = validate_mobile_number(data['phone'])
        if not is_valid:
            errors['phone'] = result
        else:
            validated_data['phone'] = result
    
    # Validate address_line1
    if 'address_line1' in data:
        try:
            address_line1 = sanitize_string(data['address_line1'], max_length=500)
            is_valid, error_msg = validate_string_length(address_line1, 'Address line 1', min_length=5, max_length=500)
            if not is_valid:
                errors['address_line1'] = error_msg
            else:
                validated_data['address_line1'] = address_line1
        except ValueError as e:
            errors['address_line1'] = str(e)
    
    # Validate address_line2 (optional)
    if 'address_line2' in data and data['address_line2']:
        try:
            address_line2 = sanitize_string(data['address_line2'], max_length=500)
            validated_data['address_line2'] = address_line2
        except ValueError as e:
            errors['address_line2'] = str(e)
    
    # Validate city
    if 'city' in data:
        try:
            city = sanitize_string(data['city'], max_length=100)
            is_valid, error_msg = validate_string_length(city, 'City', min_length=2, max_length=100)
            if not is_valid:
                errors['city'] = error_msg
            else:
                validated_data['city'] = city
        except ValueError as e:
            errors['city'] = str(e)
    
    # Validate state
    if 'state' in data:
        try:
            state = sanitize_string(data['state'], max_length=100)
            is_valid, error_msg = validate_string_length(state, 'State', min_length=2, max_length=100)
            if not is_valid:
                errors['state'] = error_msg
            else:
                validated_data['state'] = state
        except ValueError as e:
            errors['state'] = str(e)
    
    # Validate pin_code
    if 'pin_code' in data:
        is_valid, result = validate_pin_code(data['pin_code'])
        if not is_valid:
            errors['pin_code'] = result
        else:
            validated_data['pin_code'] = result
    
    # Validate landmark (optional)
    if 'landmark' in data and data['landmark']:
        try:
            landmark = sanitize_string(data['landmark'], max_length=200)
            validated_data['landmark'] = landmark
        except ValueError as e:
            errors['landmark'] = str(e)
    
    # Validate is_default (optional)
    if 'is_default' in data:
        if not isinstance(data['is_default'], bool):
            errors['is_default'] = 'is_default must be a boolean'
        else:
            validated_data['is_default'] = data['is_default']
    
    if errors:
        raise ValidationError('Validation failed', details=errors)
    
    return validated_data


@bp.route('', methods=['GET'])
@auth_required
def get_addresses():
    """
    Get all addresses for the authenticated user.
    
    Returns:
        200: List of addresses
        401: Authentication required
        500: Server error
    """
    try:
        user_id = get_jwt_identity()
        
        # Get user
        user = User.objects(id=user_id, is_active=True).first()
        if not user:
            return jsonify({
                'success': False,
                'error': {
                    'code': 401,
                    'message': 'User not found or inactive'
                }
            }), 401
        
        # Get all addresses for user
        addresses = Address.objects(user_id=user).order_by('-is_default', '-created_at')
        
        logger.info(f'Retrieved {len(addresses)} addresses for user: user_id={user_id}')
        
        return jsonify({
            'success': True,
            'data': [address.to_dict() for address in addresses]
        }), 200
        
    except Exception as e:
        logger.error(f'Error retrieving addresses: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to retrieve addresses',
                'details': str(e)
            }
        }), 500


@bp.route('', methods=['POST'])
@auth_required
def create_address():
    """
    Create a new address for the authenticated user.
    
    Request Body:
        - full_name: Full name (required)
        - phone: 10-digit phone number (required)
        - address_line1: Address line 1 (required)
        - address_line2: Address line 2 (optional)
        - city: City (required)
        - state: State (required)
        - pin_code: 6-digit PIN code (required)
        - landmark: Landmark (optional)
        - is_default: Set as default address (optional, default: false)
    
    Returns:
        201: Address created successfully
        400: Validation error
        401: Authentication required
        500: Server error
    """
    try:
        user_id = get_jwt_identity()
        
        # Get user
        user = User.objects(id=user_id, is_active=True).first()
        if not user:
            return jsonify({
                'success': False,
                'error': {
                    'code': 401,
                    'message': 'User not found or inactive'
                }
            }), 401
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required'
                }
            }), 400
        
        # Validate address data
        validated_data = validate_address_data(data, partial=False)
        
        # If this is set as default, unset other default addresses
        if validated_data.get('is_default', False):
            Address.objects(user_id=user, is_default=True).update(is_default=False)
        
        # Create address
        address = Address(
            user_id=user,
            **validated_data
        )
        address.save()
        
        logger.info(f'Address created: address_id={address.id}, user_id={user_id}')
        
        return jsonify({
            'success': True,
            'data': address.to_dict(),
            'message': 'Address created successfully'
        }), 201
        
    except ValidationError as e:
        logger.warning(f'Validation error creating address: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': e.details if hasattr(e, 'details') else str(e)
            }
        }), 400
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
        logger.error(f'Error creating address: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to create address',
                'details': str(e)
            }
        }), 500


@bp.route('/<address_id>', methods=['PUT'])
@auth_required
def update_address(address_id):
    """
    Update an existing address.
    
    Path Parameters:
        - address_id: Address ID
    
    Request Body:
        - full_name: Full name (optional)
        - phone: 10-digit phone number (optional)
        - address_line1: Address line 1 (optional)
        - address_line2: Address line 2 (optional)
        - city: City (optional)
        - state: State (optional)
        - pin_code: 6-digit PIN code (optional)
        - landmark: Landmark (optional)
        - is_default: Set as default address (optional)
    
    Returns:
        200: Address updated successfully
        400: Validation error
        401: Authentication required
        403: Not authorized to update this address
        404: Address not found
        500: Server error
    """
    try:
        user_id = get_jwt_identity()
        
        # Get user
        user = User.objects(id=user_id, is_active=True).first()
        if not user:
            return jsonify({
                'success': False,
                'error': {
                    'code': 401,
                    'message': 'User not found or inactive'
                }
            }), 401
        
        # Get address
        try:
            address = Address.objects.get(id=address_id)
        except DoesNotExist:
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Address not found'
                }
            }), 404
        
        # Verify address belongs to user
        if str(address.user_id.id) != user_id:
            logger.warning(f'Unauthorized address update attempt: address_id={address_id}, user_id={user_id}')
            return jsonify({
                'success': False,
                'error': {
                    'code': 403,
                    'message': 'Not authorized to update this address'
                }
            }), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Request body is required'
                }
            }), 400
        
        # Validate address data (partial update)
        validated_data = validate_address_data(data, partial=True)
        
        # If this is set as default, unset other default addresses
        if validated_data.get('is_default', False):
            Address.objects(user_id=user, is_default=True).update(is_default=False)
        
        # Update address fields
        for field, value in validated_data.items():
            setattr(address, field, value)
        
        address.save()
        
        logger.info(f'Address updated: address_id={address_id}, user_id={user_id}')
        
        return jsonify({
            'success': True,
            'data': address.to_dict(),
            'message': 'Address updated successfully'
        }), 200
        
    except ValidationError as e:
        logger.warning(f'Validation error updating address: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 400,
                'message': 'Validation error',
                'details': e.details if hasattr(e, 'details') else str(e)
            }
        }), 400
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
        logger.error(f'Error updating address: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to update address',
                'details': str(e)
            }
        }), 500


@bp.route('/<address_id>', methods=['DELETE'])
@auth_required
def delete_address(address_id):
    """
    Delete an address.
    
    Path Parameters:
        - address_id: Address ID
    
    Returns:
        200: Address deleted successfully
        401: Authentication required
        403: Not authorized to delete this address
        404: Address not found
        500: Server error
    """
    try:
        user_id = get_jwt_identity()
        
        # Get user
        user = User.objects(id=user_id, is_active=True).first()
        if not user:
            return jsonify({
                'success': False,
                'error': {
                    'code': 401,
                    'message': 'User not found or inactive'
                }
            }), 401
        
        # Get address
        try:
            address = Address.objects.get(id=address_id)
        except DoesNotExist:
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Address not found'
                }
            }), 404
        
        # Verify address belongs to user
        if str(address.user_id.id) != user_id:
            logger.warning(f'Unauthorized address delete attempt: address_id={address_id}, user_id={user_id}')
            return jsonify({
                'success': False,
                'error': {
                    'code': 403,
                    'message': 'Not authorized to delete this address'
                }
            }), 403
        
        # Delete address
        address.delete()
        
        logger.info(f'Address deleted: address_id={address_id}, user_id={user_id}')
        
        return jsonify({
            'success': True,
            'message': 'Address deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f'Error deleting address: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to delete address',
                'details': str(e)
            }
        }), 500
