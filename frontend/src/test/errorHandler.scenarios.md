# Error Handler Test Scenarios

This document outlines various error scenarios that the `getErrorMessage` utility can handle.

## Supported Error Formats

### 1. Nested Error Message Format
**Backend Response:**
```json
{
  "error": {
    "message": "Invalid credentials"
  }
}
```
**Extracted Message:** "Invalid credentials"

### 2. Direct Message Format
**Backend Response:**
```json
{
  "message": "User not found"
}
```
**Extracted Message:** "User not found"

### 3. String Error Format
**Backend Response:**
```json
{
  "error": "Validation failed"
}
```
**Extracted Message:** "Validation failed"

### 4. Validation Errors with Details
**Backend Response:**
```json
{
  "error": {
    "details": {
      "username": "Username is required",
      "email": "Invalid email format"
    }
  }
}
```
**Extracted Message:** "username: Username is required, email: Invalid email format"

### 5. Direct String Response
**Backend Response:**
```
"Server error occurred"
```
**Extracted Message:** "Server error occurred"

### 6. Network Errors
**Scenario:** Request made but no response received
**Extracted Message:** "Unable to connect to server. Please check your connection and try again."

### 7. Timeout Errors
**Scenario:** Request timeout (ECONNABORTED)
**Extracted Message:** "Request timeout. Please try again."

### 8. Network Error with Message
**Scenario:** Network error with "network" in error message
**Extracted Message:** "Network error. Please check your internet connection."

### 9. Standard Error Objects
**Scenario:** JavaScript Error object
```javascript
new Error("Something went wrong")
```
**Extracted Message:** "Something went wrong"

### 10. String Errors
**Scenario:** Plain string error
```javascript
"Custom error message"
```
**Extracted Message:** "Custom error message"

### 11. Unknown Error Format
**Scenario:** Unrecognized error object
**Extracted Message:** "An unexpected error occurred. Please try again."

### 12. Fallback with Status Code
**Scenario:** Empty response data
**Backend Response:**
```json
{}
```
**HTTP Status:** 500 Internal Server Error
**Extracted Message:** "Internal Server Error (500)"

## Priority Order

When multiple error formats are present, the utility extracts in this order:
1. `response.data.error.message` (highest priority)
2. `response.data.message`
3. `response.data.error` (as string)
4. `response.data.error.details` (validation errors)
5. `response.data` (as string)
6. Status text with code (fallback)

## Special Handling

### 401 Unauthorized Errors
- Error message is extracted but toast notification is NOT shown
- Handled by auth interceptor for automatic redirect

### Network Errors
- Provides user-friendly messages
- Distinguishes between timeout, network, and connection errors
- Suggests appropriate actions (check connection, try again)

## Usage Examples

### In Login Page
```typescript
try {
  await login({ username, password });
} catch (err) {
  setError(getErrorMessage(err));
}
```

### In Signup Page
```typescript
try {
  const response = await authService.register(formData);
  if (response.success) {
    toast.success('Account created successfully!');
  } else {
    setError(response.error?.message || 'Registration failed');
  }
} catch (err) {
  setError(getErrorMessage(err));
}
```

### In Product Management
```typescript
try {
  await productService.createProduct(productData);
  toast.success('Product created successfully');
} catch (err) {
  const errorMessage = getErrorMessage(err);
  toast.error(errorMessage);
}
```

## Testing

Run the comprehensive test suite:
```bash
npm test -- errorHandler.test.ts --run
```

All 16 test cases cover:
- 13 tests for `getErrorMessage` function
- 3 tests for `handleApiError` function
