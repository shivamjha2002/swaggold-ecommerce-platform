# Admin Dashboard Authentication Fix

## Problem
Admin Dashboard was getting 422 errors when trying to load products and orders because:
1. It was using custom hardcoded authentication (`sj_admin_token`)
2. API endpoints require JWT authentication
3. No JWT token was being sent with API requests

## Root Cause
The AdminDashboard component had its own authentication system:
```typescript
// OLD - Hardcoded credentials
const ADMIN_USERNAME = 'Nagendra Jha';
const ADMIN_PASSWORD = '943162';
localStorage.setItem('sj_admin_token', 'logged_in'); // Not a JWT token!
```

This meant:
- API calls had no Authorization header
- Backend rejected requests with 422 (Unprocessable Entity)
- Products and orders couldn't load

## Solution
Integrated AdminDashboard with the existing AuthContext for proper JWT authentication:

### Changes Made:

1. **Import AuthContext**:
```typescript
import { useAuth } from '../context/AuthContext';
```

2. **Use JWT Authentication**:
```typescript
const { user, login, logout } = useAuth();
const isAuthenticated = !!user && user.role === 'admin';
```

3. **Updated Login Handler**:
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await login({ username: username.trim(), password });
    // JWT token automatically stored by AuthContext
  } catch (err) {
    setLoginError(getErrorMessage(err));
  }
};
```

4. **Updated Logout Handler**:
```typescript
const handleLogout = () => {
  logout(); // Clears JWT token
  setActiveTab('dashboard');
};
```

5. **Removed Hardcoded Credentials**:
- Removed `ADMIN_USERNAME` and `ADMIN_PASSWORD` constants
- Removed custom `sj_admin_token` localStorage logic
- Now uses proper backend authentication

## How It Works Now

1. **Admin Login**:
   - User enters credentials
   - `login()` calls `/api/auth/login`
   - Backend validates and returns JWT token
   - Token stored in localStorage as `token`
   - User object stored in AuthContext

2. **API Requests**:
   - Axios interceptor adds `Authorization: Bearer <token>` header
   - Backend validates JWT token
   - Admin-only endpoints check user role
   - Requests succeed ✅

3. **Admin Logout**:
   - `logout()` clears token and user data
   - User redirected to login screen

## Testing

1. **Login**:
   - Go to `/admin`
   - Enter admin credentials (from backend database)
   - Should login successfully

2. **Load Products**:
   - After login, products should load automatically
   - No 422 errors

3. **Load Orders**:
   - Switch to Orders tab
   - Orders should load successfully

4. **Upload Image**:
   - Create new product
   - Upload image
   - Should work without 422 errors

## Backend Requirements

Make sure you have an admin user in the database:
```javascript
// Create admin user (run once)
db.users.insertOne({
  username: "admin",
  email: "admin@swatijewellers.com",
  password: "<hashed_password>",
  role: "admin",
  is_active: true,
  created_at: new Date()
});
```

## Benefits

✅ Proper JWT authentication
✅ Secure token-based auth
✅ No hardcoded credentials
✅ Works with all backend endpoints
✅ Consistent with rest of app
✅ Role-based access control
