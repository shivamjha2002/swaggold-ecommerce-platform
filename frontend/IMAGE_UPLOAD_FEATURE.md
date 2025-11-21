# Product Image Upload Feature

## Overview
Added functionality for admins to upload product images directly when creating or editing products in the admin panel.

## Features

### Backend
- **New Upload Endpoint**: `/api/uploads/image` (POST) - Admin only
  - Accepts multipart/form-data with 'image' field
  - Validates file type (PNG, JPG, JPEG, GIF, WebP)
  - Validates file size (max 5MB)
  - Generates unique filename with UUID and timestamp
  - Stores images in `backend/uploads/products/` directory
  - Returns relative URL path for database storage

- **Image Serving**: `/uploads/products/<filename>` (GET)
  - Serves uploaded product images
  - No authentication required for viewing

- **Delete Endpoint**: `/api/uploads/image/<filename>` (DELETE) - Admin only
  - Removes uploaded images from server

### Frontend
- **Enhanced Product Form Modal**:
  - Drag-and-drop or click to upload image
  - Real-time image preview
  - File validation (type and size)
  - Upload progress indication
  - Option to use external URL instead
  - Remove/replace uploaded image

- **Image Display**:
  - All product images now use the `getImageUrl()` utility
  - Automatically converts relative paths to absolute URLs
  - Fallback to placeholder for missing images
  - Updated in: Products page, Homepage, Cart, Navbar, Product Detail Modal

## Usage

### For Admins
1. Navigate to Admin Dashboard
2. Click "Add Product" or edit existing product
3. In the product form:
   - Click the upload area or drag an image file
   - Preview appears immediately
   - Click "Add Product" or "Save Changes"
   - Image is uploaded first, then product is saved with image URL

### File Requirements
- **Allowed formats**: PNG, JPG, JPEG, GIF, WebP
- **Maximum size**: 5MB
- **Recommended dimensions**: 800x800px or higher for best quality

## Technical Details

### Image Storage
- Images are stored in: `backend/uploads/products/`
- Filename format: `{uuid}_{timestamp}.{extension}`
- Example: `a1b2c3d4e5f6_20231117120000.jpg`

### Database Storage
- Only the relative URL path is stored in MongoDB
- Format: `/uploads/products/{filename}`
- This allows for easy migration or CDN integration later

### Image URL Utility
The `getImageUrl()` utility function handles:
- Relative URLs (starts with `/`) → Converts to absolute using backend base URL
- Absolute URLs (starts with `http://` or `https://`) → Returns as-is
- Empty/undefined → Returns default placeholder image

## Configuration

### Environment Variables
Ensure your `.env` files have the correct API URL:

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:5000/api
```

**Backend** (`backend/.env`):
```
FLASK_APP=app
FLASK_ENV=development
```

### Upload Directory
The upload directory is automatically created on app startup:
- Path: `backend/uploads/products/`
- Added to `.gitignore` to avoid committing uploaded files

## Security
- Upload endpoint requires JWT authentication and admin role
- File type validation prevents malicious uploads
- File size limit prevents DoS attacks
- Unique filenames prevent overwriting
- Filename sanitization prevents directory traversal

## Future Enhancements
- Image compression/optimization on upload
- Multiple image support per product
- CDN integration for better performance
- Image cropping/editing tools
- Bulk image upload
