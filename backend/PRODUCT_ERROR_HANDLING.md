# Product Route Error Handling Enhancement

## Overview

This document describes the enhanced error handling implemented for product routes in the Swati Jewellers backend API. All product endpoints now return consistent error responses with detailed messages for debugging and user feedback.

## Consistent Error Response Format

All error responses follow this standardized format:

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "User-friendly error message",
    "details": "Detailed technical information for debugging"
  }
}
```

## Enhanced Endpoints

### 1. GET /api/products/admin

**Admin-only endpoint to retrieve all products including drafts**

**Error Responses:**

- **401 Unauthorized - Missing Token**
  ```json
  {
    "success": false,
    "error": {
      "code": 401,
      "message": "Authentication required",
      "details": "Missing or invalid JWT token in request headers"
    }
  }
  ```

- **401 Unauthorized - Invalid Token**
  ```json
  {
    "success": false,
    "error": {
      "code": 401,
      "message": "Invalid JWT token",
      "details": "Token could not be decoded or verified"
    }
  }
  ```

- **401 Unauthorized - Expired Token**
  ```json
  {
    "success": false,
    "error": {
      "code": 401,
      "message": "Token expired",
      "details": "Your session has expired. Please login again"
    }
  }
  ```

- **403 Forbidden - Insufficient Permissions**
  ```json
  {
    "success": false,
    "error": {
      "code": 403,
      "message": "Admin access required",
      "details": "You do not have permission to access this resource"
    }
  }
  ```

- **400 Bad Request - Invalid Page Number**
  ```json
  {
    "success": false,
    "error": {
      "code": 400,
      "message": "Invalid page number",
      "details": "Page number must be greater than 0"
    }
  }
  ```

- **400 Bad Request - Invalid Status Filter**
  ```json
  {
    "success": false,
    "error": {
      "code": 400,
      "message": "Invalid status filter",
      "details": "Status must be either \"draft\" or \"published\""
    }
  }
  ```

### 2. POST /api/products/

**Create a new product**

**Error Responses:**

- **400 Bad Request - Empty Body**
  ```json
  {
    "success": false,
    "error": {
      "code": 400,
      "message": "Request body is required",
      "details": "Product data must be provided in JSON format"
    }
  }
  ```

- **400 Bad Request - Validation Error**
  ```json
  {
    "success": false,
    "error": {
      "code": 400,
      "message": "Validation error",
      "details": "Missing required field: category"
    }
  }
  ```

- **400 Bad Request - Invalid Category**
  ```json
  {
    "success": false,
    "error": {
      "code": 400,
      "message": "Validation error",
      "details": "Invalid category. Must be one of: Nath, Pendant Set, Tika, Necklace, Earrings, Bangles, Ring, Bracelet, Bridal Set"
    }
  }
  ```

### 3. PUT /api/products/<product_id>

**Update an existing product**

**Error Responses:**

- **400 Bad Request - Empty Body**
  ```json
  {
    "success": false,
    "error": {
      "code": 400,
      "message": "Request body is required",
      "details": "Update data must be provided in JSON format"
    }
  }
  ```

- **404 Not Found**
  ```json
  {
    "success": false,
    "error": {
      "code": 404,
      "message": "Product not found",
      "details": "No product exists with ID: 507f1f77bcf86cd799439011"
    }
  }
  ```

### 4. GET /api/products/<product_id>

**Get a single product by ID**

**Error Responses:**

- **404 Not Found**
  ```json
  {
    "success": false,
    "error": {
      "code": 404,
      "message": "Product not found",
      "details": "No product exists with ID: 507f1f77bcf86cd799439011"
    }
  }
  ```

### 5. DELETE /api/products/<product_id>

**Soft delete a product**

**Error Responses:**

- **404 Not Found**
  ```json
  {
    "success": false,
    "error": {
      "code": 404,
      "message": "Product not found",
      "details": "No product exists with ID: 507f1f77bcf86cd799439011"
    }
  }
  ```

### 6. POST /api/products/<product_id>/publish

**Publish a draft product (Admin only)**

**Error Responses:**

- **401 Unauthorized** - Same as admin endpoint
- **403 Forbidden** - Same as admin endpoint
- **404 Not Found** - Same as other endpoints

### 7. POST /api/products/<product_id>/unpublish

**Unpublish a product back to draft (Admin only)**

**Error Responses:**

- **401 Unauthorized** - Same as admin endpoint
- **403 Forbidden** - Same as admin endpoint
- **404 Not Found** - Same as other endpoints

## JWT Error Handling

All JWT-related errors are now handled consistently across the application through Flask-JWT-Extended callbacks:

### Error Types

1. **Missing Authorization Header**
   - Status: 401
   - Message: "Authentication required"
   - Details: "Missing or invalid JWT token in request headers"

2. **Invalid Token Format**
   - Status: 401
   - Message: "Invalid JWT token"
   - Details: "Token could not be decoded or verified"

3. **Expired Token**
   - Status: 401
   - Message: "Token expired"
   - Details: "Your session has expired. Please login again"

4. **Revoked Token**
   - Status: 401
   - Message: "Token revoked"
   - Details: "This token has been revoked. Please login again"

5. **Fresh Token Required**
   - Status: 401
   - Message: "Fresh token required"
   - Details: "This action requires a fresh login token"

## Logging

All error responses are now logged with appropriate log levels:

- **INFO**: Successful operations
- **WARNING**: Client errors (4xx), authentication failures, validation errors
- **ERROR**: Server errors (5xx), unexpected exceptions

### Log Format

```
[LEVEL] [timestamp] Error type: details
```

Examples:
```
[WARNING] Admin products access attempted without JWT token
[WARNING] Invalid page number requested: 0
[ERROR] Error retrieving admin products: Connection timeout
```

## Testing

A comprehensive test suite has been created in `backend/test_product_errors.py` that verifies:

1. ✅ Admin endpoint without JWT token
2. ✅ Admin endpoint with invalid JWT token
3. ✅ Admin endpoint with malformed JWT token
4. ✅ Admin endpoint with valid JWT token
5. ✅ Product creation with empty body
6. ✅ Product creation with missing fields
7. ✅ Product creation with invalid category
8. ✅ Product not found error
9. ✅ Invalid page number error
10. ✅ Publish product without authentication

### Running Tests

```bash
python backend/test_product_errors.py
```

## Benefits

1. **Consistent Error Format**: All errors follow the same structure, making frontend error handling predictable
2. **Detailed Error Messages**: Both user-friendly messages and technical details for debugging
3. **Proper HTTP Status Codes**: Correct status codes for different error types
4. **Comprehensive Logging**: All errors are logged with appropriate context
5. **JWT Validation**: Explicit error messages for authentication failures
6. **Field-Specific Validation**: Clear indication of which fields are invalid or missing

## Frontend Integration

The frontend can now reliably extract error messages using:

```typescript
const errorMessage = 
  error.response?.data?.error?.message || 
  error.response?.data?.message || 
  error.message || 
  'An unexpected error occurred';

const errorDetails = error.response?.data?.error?.details;
```

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **Requirement 3.3**: Backend verifies JWT token and returns appropriate errors
- **Requirement 4.3**: Product creation failures return detailed error messages
- **Requirement 5.5**: All endpoints return consistent error format with detailed messages

## Future Enhancements

Potential improvements for future iterations:

1. Add request ID tracking for error correlation
2. Implement error rate limiting
3. Add error analytics and monitoring
4. Create error code documentation for frontend
5. Add localization support for error messages
