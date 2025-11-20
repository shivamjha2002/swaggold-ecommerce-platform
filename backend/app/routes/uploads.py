"""File upload routes."""
import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required
from app.utils.decorators import admin_required
import uuid
from datetime import datetime

bp = Blueprint('uploads', __name__)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Maximum file size: 5MB
MAX_FILE_SIZE = 5 * 1024 * 1024


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_file_extension(filename):
    """Get file extension from filename."""
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''


@bp.route('/image', methods=['POST'])
@jwt_required()
@admin_required
def upload_image():
    """
    Upload product image - Admin only.
    
    Accepts multipart/form-data with 'image' field.
    Returns the URL path to the uploaded image.
    """
    try:
        # Check if file is in request
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'No image file provided'
                }
            }), 400
        
        file = request.files['image']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'No file selected'
                }
            }), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': f'File size exceeds maximum limit of {MAX_FILE_SIZE // (1024 * 1024)}MB'
                }
            }), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
                }
            }), 400
        
        # Generate unique filename
        file_ext = get_file_extension(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.{file_ext}"
        
        # Get upload directory from config or use default
        upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads/products')
        
        # Create upload directory if it doesn't exist
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)
        
        # Return URL path (relative to static serving)
        image_url = f"/uploads/products/{unique_filename}"
        
        return jsonify({
            'success': True,
            'data': {
                'image_url': image_url,
                'filename': unique_filename
            },
            'message': 'Image uploaded successfully'
        }), 201
        
    except Exception as e:
        current_app.logger.error(f'Image upload failed: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to upload image',
                'details': str(e)
            }
        }), 500


@bp.route('/image/<filename>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_image(filename):
    """
    Delete uploaded image - Admin only.
    
    Removes the image file from the server.
    """
    try:
        # Validate filename (security check)
        if not filename or '..' in filename or '/' in filename:
            return jsonify({
                'success': False,
                'error': {
                    'code': 400,
                    'message': 'Invalid filename'
                }
            }), 400
        
        # Get upload directory
        upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads/products')
        file_path = os.path.join(upload_dir, filename)
        
        # Check if file exists
        if not os.path.exists(file_path):
            return jsonify({
                'success': False,
                'error': {
                    'code': 404,
                    'message': 'Image not found'
                }
            }), 404
        
        # Delete file
        os.remove(file_path)
        
        return jsonify({
            'success': True,
            'message': 'Image deleted successfully'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Image deletion failed: {str(e)}')
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'Failed to delete image',
                'details': str(e)
            }
        }), 500
