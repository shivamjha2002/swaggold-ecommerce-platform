"""File upload validation utilities."""
import os
import mimetypes
from typing import Tuple, List, Optional
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename


# Allowed file extensions and MIME types for different file types
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'}
ALLOWED_IMAGE_MIMES = {
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
}

ALLOWED_DOCUMENT_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'}
ALLOWED_DOCUMENT_MIMES = {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
}

# File size limits (in bytes)
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB (general limit)


class FileValidationError(Exception):
    """Custom exception for file validation errors."""
    pass


def validate_file_extension(filename: str, allowed_extensions: set) -> bool:
    """
    Validate file extension.
    
    Args:
        filename: Name of the file
        allowed_extensions: Set of allowed extensions (with dots, e.g., {'.jpg', '.png'})
        
    Returns:
        True if extension is allowed
    """
    if not filename:
        return False
    
    # Get extension (lowercase)
    ext = os.path.splitext(filename)[1].lower()
    
    return ext in allowed_extensions


def validate_file_mime_type(file: FileStorage, allowed_mimes: set) -> bool:
    """
    Validate file MIME type.
    
    Args:
        file: FileStorage object
        allowed_mimes: Set of allowed MIME types
        
    Returns:
        True if MIME type is allowed
    """
    if not file or not file.content_type:
        return False
    
    return file.content_type.lower() in allowed_mimes


def validate_file_size(file: FileStorage, max_size: int) -> bool:
    """
    Validate file size.
    
    Args:
        file: FileStorage object
        max_size: Maximum allowed size in bytes
        
    Returns:
        True if size is within limit
    """
    if not file:
        return False
    
    # Seek to end to get file size
    file.seek(0, os.SEEK_END)
    size = file.tell()
    # Reset file pointer
    file.seek(0)
    
    return size <= max_size


def sanitize_filename_secure(filename: str) -> str:
    """
    Sanitize filename using werkzeug's secure_filename and additional checks.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    if not filename:
        return ""
    
    # Use werkzeug's secure_filename
    filename = secure_filename(filename)
    
    # Additional sanitization
    # Remove any remaining dangerous characters
    filename = filename.replace('..', '').replace('/', '').replace('\\', '')
    
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:250] + ext
    
    return filename


def validate_image_file(file: FileStorage, max_size: int = MAX_IMAGE_SIZE) -> Tuple[bool, str]:
    """
    Validate image file upload.
    
    Args:
        file: FileStorage object
        max_size: Maximum allowed size in bytes
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not file or not file.filename:
        return False, "No file provided"
    
    # Validate extension
    if not validate_file_extension(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        return False, f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
    
    # Validate MIME type
    if not validate_file_mime_type(file, ALLOWED_IMAGE_MIMES):
        return False, f"Invalid file format. File must be an image."
    
    # Validate size
    if not validate_file_size(file, max_size):
        max_size_mb = max_size / (1024 * 1024)
        return False, f"File size exceeds maximum limit of {max_size_mb:.1f} MB"
    
    return True, ""


def validate_document_file(file: FileStorage, max_size: int = MAX_DOCUMENT_SIZE) -> Tuple[bool, str]:
    """
    Validate document file upload.
    
    Args:
        file: FileStorage object
        max_size: Maximum allowed size in bytes
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not file or not file.filename:
        return False, "No file provided"
    
    # Validate extension
    if not validate_file_extension(file.filename, ALLOWED_DOCUMENT_EXTENSIONS):
        return False, f"Invalid file type. Allowed types: {', '.join(ALLOWED_DOCUMENT_EXTENSIONS)}"
    
    # Validate MIME type
    if not validate_file_mime_type(file, ALLOWED_DOCUMENT_MIMES):
        return False, f"Invalid file format."
    
    # Validate size
    if not validate_file_size(file, max_size):
        max_size_mb = max_size / (1024 * 1024)
        return False, f"File size exceeds maximum limit of {max_size_mb:.1f} MB"
    
    return True, ""


def validate_product_image(file: FileStorage) -> Tuple[bool, str]:
    """
    Validate product image upload with specific requirements.
    
    Args:
        file: FileStorage object
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Use standard image validation
    is_valid, error = validate_image_file(file, MAX_IMAGE_SIZE)
    
    if not is_valid:
        return False, error
    
    # Additional checks for product images
    # Could add dimension checks here if needed
    
    return True, ""


def get_safe_filename(original_filename: str, prefix: str = "") -> str:
    """
    Generate a safe filename with optional prefix.
    
    Args:
        original_filename: Original filename
        prefix: Optional prefix to add
        
    Returns:
        Safe filename
    """
    import uuid
    from datetime import datetime
    
    # Sanitize original filename
    safe_name = sanitize_filename_secure(original_filename)
    
    # Get extension
    _, ext = os.path.splitext(safe_name)
    
    # Generate unique filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_id = uuid.uuid4().hex[:8]
    
    if prefix:
        filename = f"{prefix}_{timestamp}_{unique_id}{ext}"
    else:
        filename = f"{timestamp}_{unique_id}{ext}"
    
    return filename


def validate_file_content(file: FileStorage, allowed_extensions: set, 
                         allowed_mimes: set, max_size: int) -> Tuple[bool, str]:
    """
    Generic file validation function.
    
    Args:
        file: FileStorage object
        allowed_extensions: Set of allowed extensions
        allowed_mimes: Set of allowed MIME types
        max_size: Maximum allowed size in bytes
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not file or not file.filename:
        return False, "No file provided"
    
    # Validate extension
    if not validate_file_extension(file.filename, allowed_extensions):
        return False, f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
    
    # Validate MIME type
    if not validate_file_mime_type(file, allowed_mimes):
        return False, "Invalid file format"
    
    # Validate size
    if not validate_file_size(file, max_size):
        max_size_mb = max_size / (1024 * 1024)
        return False, f"File size exceeds maximum limit of {max_size_mb:.1f} MB"
    
    return True, ""


def check_file_signature(file: FileStorage, expected_signatures: List[bytes]) -> bool:
    """
    Check file signature (magic bytes) to verify actual file type.
    
    This provides additional security beyond extension and MIME type checks.
    
    Args:
        file: FileStorage object
        expected_signatures: List of expected file signatures (magic bytes)
        
    Returns:
        True if file signature matches one of the expected signatures
    """
    if not file:
        return False
    
    # Read first few bytes
    file.seek(0)
    header = file.read(16)
    file.seek(0)  # Reset
    
    # Check against expected signatures
    for signature in expected_signatures:
        if header.startswith(signature):
            return True
    
    return False


# Common file signatures (magic bytes)
IMAGE_SIGNATURES = {
    'jpeg': [b'\xFF\xD8\xFF'],
    'png': [b'\x89PNG\r\n\x1a\n'],
    'gif': [b'GIF87a', b'GIF89a'],
    'webp': [b'RIFF'],  # WebP files start with RIFF
}


def validate_image_signature(file: FileStorage) -> bool:
    """
    Validate image file signature.
    
    Args:
        file: FileStorage object
        
    Returns:
        True if file has a valid image signature
    """
    all_signatures = []
    for signatures in IMAGE_SIGNATURES.values():
        all_signatures.extend(signatures)
    
    return check_file_signature(file, all_signatures)
