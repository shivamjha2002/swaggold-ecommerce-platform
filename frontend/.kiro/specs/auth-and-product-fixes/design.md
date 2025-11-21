# Design Document

## Overview

This design document outlines the solution for fixing authentication and product management issues in the Swati Jewellers application. The fixes address login/signup problems, admin authentication, product page loading failures, and product creation errors.

## Architecture

### System Components

1. **Frontend Authentication Layer**
   - Login/Signup pages
   - AuthContext for state management
   - AuthService for API communication
   - Protected routes with authentication checks

2. **Frontend Product Management Layer**
   - AdminDashboard component
   - ProductFormModal for create/edit operations
   - ProductService for API communication
   - Product list with filtering and status management

3. **Backend Authentication Layer**
   - Auth routes (`/auth/login`, `/auth/register`)
   - JWT token generation and validation
   - User model with password hashing
   - Admin role verification

4. **Backend Product Management Layer**
   - Product routes (`/products`, `/products/admin`)
   - ProductService for business logic
   - Product model with status management
   - Admin-only endpoints with JWT protection

5. **API Communication Layer**
   - Axios instance with interceptors
   - Token attachment to requests
   - Error handling and retry logic
   - Response transformation

## Components and Interfaces

### Frontend Components

#### 1. Login Page (`src/pages/Login.tsx`)
**Current Issues:**
- Error handling may not properly display backend error messages
- Token storage happens in authService but may not trigger context update properly

**Design Changes:**
- Ensure error messages from backend are properly extracted and displayed
- Verify AuthContext updates immediately after successful login
- Add loading states to prevent double submissions

#### 2. Signup Page (`src/pages/Signup.tsx`)
**Current Issues:**
- Registration endpoint requires admin authentication but signup page doesn't handle this
- Error responses may not be properly parsed

**Design Changes:**
- Update to use a public registration endpoint or handle admin-only registration differently
- Improve error message extraction from API responses
- Add proper validation feedback for all fields

#### 3. AdminDashboard (`src/pages/AdminDashboard.tsx`)
**Current Issues:**
- Product loading may fail silently
- Error states not properly displayed
- Token may not be attached to admin product requests

**Design Changes:**
- Add comprehensive error handling for product loading
- Display loading states and error messages clearly
- Ensure authentication check before making API calls
- Add retry mechanism for failed product loads

#### 4. AuthContext (`src/context/AuthContext.tsx`)
**Current Issues:**
- May not properly handle token updates
- User state may not sync with localStorage

**Design Changes:**
- Ensure user state updates immediately after login
- Add token validation on app initialization
- Handle token expiration gracefully

### Backend Components

#### 1. Auth Routes (`backend/app/routes/auth.py`)
**Current Issues:**
- Register endpoint requires JWT authentication, making public signup impossible
- Error responses may not follow consistent format

**Design Changes:**
- Create a public registration endpoint for regular users
- Keep admin-only registration for staff accounts
- Ensure consistent error response format
- Add proper validation error messages

#### 2. Product Routes (`backend/app/routes/products.py`)
**Current Issues:**
- Admin product endpoint requires JWT but may not properly validate
- Error responses may not include enough detail

**Design Changes:**
- Ensure JWT validation works correctly
- Add detailed error messages for debugging
- Verify admin role in decorator
- Return proper HTTP status codes

#### 3. User Model (`backend/app/models/user.py`)
**Current Issues:**
- Authentication method works correctly
- Password hashing is properly implemented

**Design Changes:**
- No changes needed - model is working correctly

#### 4. Product Model (`backend/app/models/product.py`)
**Current Issues:**
- Model structure is correct
- Status management works properly

**Design Changes:**
- No changes needed - model is working correctly

### API Service Layer

#### API Service (`src/services/api.ts`)
**Current Issues:**
- Token attachment works correctly
- Retry logic is implemented
- 401 handling redirects to login

**Design Changes:**
- Ensure token is read from localStorage on every request
- Add better error message extraction
- Log authentication failures for debugging

#### Auth Service (`src/services/authService.ts`)
**Current Issues:**
- Token storage works correctly
- Login method properly stores user data

**Design Changes:**
- Add better error handling for network failures
- Ensure user data is properly formatted before storage
- Add token validation method

#### Product Service (`src/services/productService.ts`)
**Current Issues:**
- Admin product endpoint is called correctly
- Cache management works properly

**Design Changes:**
- Add better error handling for failed requests
- Clear cache on authentication changes
- Add retry logic for failed product loads

## Data Models

### User Model
```python
{
    "id": "string",
    "username": "string",
    "email": "string",
    "password_hash": "string",
    "role": "admin" | "staff",
    "is_active": boolean,
    "created_at": datetime,
    "updated_at": datetime,
    "last_login": datetime
}
```

### Product Model
```python
{
    "id": "string",
    "name": "string",
    "category": "string",
    "base_price": float,
    "weight": float,
    "gold_purity": "916" | "750" | "585",
    "description": "string",
    "image_url": "string",
    "stock_quantity": integer,
    "status": "draft" | "published",
    "published_at": datetime,
    "is_active": boolean,
    "created_at": datetime,
    "updated_at": datetime
}
```

### API Response Format
```typescript
{
    "success": boolean,
    "data": any,
    "error": {
        "code": number,
        "message": string,
        "details": string
    },
    "pagination": {
        "page": number,
        "per_page": number,
        "total": number,
        "total_pages": number,
        "has_next": boolean,
        "has_prev": boolean
    }
}
```

## Error Handling

### Frontend Error Handling Strategy

1. **API Errors**
   - Extract error message from response.data.error.message
   - Fall back to response.data.message
   - Fall back to error.message
   - Display user-friendly message in toast or inline

2. **Network Errors**
   - Retry up to 3 times with exponential backoff
   - Display "Network error, please try again" message
   - Provide manual retry button

3. **Authentication Errors (401)**
   - Clear stored token and user data
   - Redirect to login page
   - Display "Session expired, please login again" message

4. **Validation Errors (400)**
   - Extract field-specific errors from response
   - Display errors next to relevant form fields
   - Highlight invalid fields

5. **Server Errors (500)**
   - Log error details to console
   - Display "Server error, please try again later" message
   - Provide contact support option

### Backend Error Handling Strategy

1. **Validation Errors**
   - Return 400 status code
   - Include specific field errors in response
   - Use consistent error format

2. **Authentication Errors**
   - Return 401 for invalid credentials
   - Return 403 for insufficient permissions
   - Include clear error messages

3. **Not Found Errors**
   - Return 404 status code
   - Include resource type in error message

4. **Server Errors**
   - Return 500 status code
   - Log full error details server-side
   - Return sanitized error message to client

## Testing Strategy

### Unit Tests
- Test authentication service methods
- Test product service methods
- Test error handling utilities
- Test form validation logic

### Integration Tests
- Test login flow end-to-end
- Test signup flow end-to-end
- Test product creation flow
- Test product loading with authentication
- Test error scenarios

### Manual Testing Checklist
1. Login with valid admin credentials
2. Login with invalid credentials
3. Signup with valid data
4. Signup with invalid data
5. Access admin dashboard after login
6. Load products in admin dashboard
7. Create new product
8. Edit existing product
9. Publish/unpublish product
10. Handle network errors gracefully
11. Handle session expiration
12. Verify token attachment to requests

## Implementation Notes

### Critical Fixes Required

1. **Registration Endpoint**
   - Create public `/auth/signup` endpoint without JWT requirement
   - Keep `/auth/register` as admin-only for staff creation
   - Update frontend to use correct endpoint

2. **Error Message Extraction**
   - Standardize error extraction in `getErrorMessage` utility
   - Ensure all API responses follow consistent format
   - Handle nested error objects properly

3. **Product Loading**
   - Add explicit error handling in `loadProducts` function
   - Display error messages to user
   - Add retry button for failed loads
   - Verify token is attached to admin product requests

4. **Authentication State Management**
   - Ensure AuthContext updates immediately after login
   - Verify token is stored before making authenticated requests
   - Handle token expiration gracefully

5. **Form Validation**
   - Add client-side validation before API calls
   - Display field-specific errors
   - Prevent submission with invalid data

### Performance Considerations

- Cache product data for 5 minutes to reduce API calls
- Clear cache on authentication changes
- Use lazy loading for heavy components
- Implement pagination for large product lists

### Security Considerations

- Never log sensitive data (passwords, tokens)
- Validate all input on both client and server
- Use HTTPS for all API communication
- Implement rate limiting on authentication endpoints
- Hash passwords with bcrypt
- Use secure JWT tokens with expiration
