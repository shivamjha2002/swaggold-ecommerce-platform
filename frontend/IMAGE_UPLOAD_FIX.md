# Image Upload 422 Error Fix

## Problem
When uploading images from the admin panel, getting 422 error:
```
API Error: Request failed with status code 422
{url: '/uploads/image', method: 'post', retries: 0}
```

## Root Cause
The issue was with how `Content-Type` header was being set for FormData requests:

1. **Manually setting Content-Type**: When we explicitly set `'Content-Type': 'multipart/form-data'`, it doesn't include the boundary parameter that the browser needs to parse the multipart data.

2. **Correct approach**: Let the browser automatically set the Content-Type header with the proper boundary for FormData requests.

## Solution

### 1. Updated ProductFormModal.tsx
Removed the explicit Content-Type header from the upload request:

```typescript
// Before (WRONG):
const response = await api.post('/uploads/image', formDataUpload, {
  headers: {
    'Content-Type': 'multipart/form-data',  // ❌ Missing boundary
  },
});

// After (CORRECT):
const response = await api.post('/uploads/image', formDataUpload);
// Browser automatically sets: Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

### 2. Updated api.ts Interceptor
Added logic to remove Content-Type for FormData to ensure browser sets it correctly:

```typescript
// Remove Content-Type for FormData to let browser set it with boundary
if (config.data instanceof FormData && config.headers['Content-Type']) {
  delete config.headers['Content-Type'];
}
```

## Why This Works

When uploading files with FormData:
- The browser needs to set a unique boundary string to separate form fields
- The Content-Type header must include this boundary: `multipart/form-data; boundary=----WebKitFormBoundary...`
- If we manually set `Content-Type: multipart/form-data` without the boundary, the server can't parse the request
- By letting the browser set it automatically, it includes the correct boundary

## Testing
1. Login as admin
2. Go to Admin Dashboard
3. Click "Add Product"
4. Fill in product details
5. Upload an image (PNG, JPG, GIF, WebP up to 5MB)
6. Click "Add Product"
7. Image should upload successfully and product should be created

## Backend Status
✅ Backend running on http://localhost:5000
✅ MongoDB connected
✅ All routes registered including /api/uploads/image
✅ JWT authentication working
✅ Admin authorization working

## Additional Notes
- The Authorization header (JWT token) is still properly added by the axios interceptor
- File validation (type, size) happens on both client and server side
- Images are stored in `backend/uploads/products/` directory
- Image URLs are stored as relative paths in MongoDB (e.g., `/uploads/products/abc123.jpg`)
