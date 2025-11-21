# API Services

This directory contains the API client and service modules for interacting with the Flask backend.

## Structure

- `api.ts` - Axios instance with request/response interceptors
- `productService.ts` - Product management API calls
- `customerService.ts` - Customer and Khata management API calls
- `predictionService.ts` - ML prediction and price history API calls
- `authService.ts` - Authentication and authorization API calls

## Usage

### API Client

The API client is configured with:
- Base URL from environment variable `VITE_API_URL`
- 10-second timeout
- Automatic JWT token injection in request headers
- Automatic 401 error handling (clears token and redirects to login)

```typescript
import api from './services/api';

// The api instance is already configured
const response = await api.get('/endpoint');
```

### Product Service

```typescript
import { productService } from './services';

// Get all products with filters
const products = await productService.getProducts({
  category: 'Necklace',
  price_min: 10000,
  price_max: 50000,
  page: 1,
  per_page: 20
});

// Get single product
const product = await productService.getProductById('product-id');

// Create product (admin only)
const newProduct = await productService.createProduct({
  name: 'Gold Ring',
  category: 'Ring',
  base_price: 25000,
  weight: 5,
  gold_purity: '916'
});

// Update product (admin only)
const updated = await productService.updateProduct('product-id', {
  base_price: 30000
});

// Delete product (admin only)
await productService.deleteProduct('product-id');
```

### Customer Service

```typescript
import { customerService } from './services';

// Get all customers
const customers = await customerService.getCustomers(1, 20);

// Create customer
const customer = await customerService.createCustomer({
  name: 'John Doe',
  phone: '9876543210',
  email: 'john@example.com'
});

// Get customer's khata
const khata = await customerService.getCustomerKhata('customer-id');

// Create khata transaction
const transaction = await customerService.createKhataTransaction({
  customer_id: 'customer-id',
  transaction_type: 'credit',
  amount: 50000,
  description: 'Payment received',
  payment_method: 'cash'
});

// Get khata summary
const summary = await customerService.getKhataSummary();
```

### Prediction Service

```typescript
import { predictionService } from './services';

// Predict gold price
const goldPrediction = await predictionService.predictGoldPrice({
  date: '2025-12-01',
  weight_grams: 10
});

// Predict diamond price
const diamondPrediction = await predictionService.predictDiamondPrice({
  carat: 1.5,
  cut: 'Ideal',
  color: 'E',
  clarity: 'VS1'
});

// Get price trends
const trends = await predictionService.getGoldPriceTrends(30);

// Get current gold price
const currentPrice = await predictionService.getCurrentGoldPrice();

// Add gold price (admin only)
await predictionService.addGoldPrice({
  date: '2025-11-14',
  price_per_gram: 6800,
  purity: '916',
  source: 'manual'
});

// Retrain models (admin only)
await predictionService.retrainModels('gold');
```

### Auth Service

```typescript
import { authService } from './services';

// Login
await authService.login({
  username: 'admin',
  password: 'password123'
});

// Logout
authService.logout();

// Get current user
const user = authService.getCurrentUser();

// Check authentication
const isAuth = authService.isAuthenticated();

// Check admin role
const isAdmin = authService.isAdmin();

// Register new user (admin only)
await authService.register({
  username: 'newuser',
  email: 'newuser@example.com',
  password: 'password123',
  role: 'staff'
});
```

## Authentication Context

Use the `AuthContext` for managing authentication state in React components:

```typescript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, isAdmin, login, logout } = useAuth();

  // Use authentication state
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return <div>Welcome, {user?.username}</div>;
}
```

## Protected Routes

Use the `ProtectedRoute` component to protect routes that require authentication:

```typescript
import { ProtectedRoute } from './components/ProtectedRoute';

<Route 
  path="/admin" 
  element={
    <ProtectedRoute requireAdmin={true}>
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

## Environment Variables

Create a `.env` file in the project root:

```
VITE_API_URL=http://localhost:5000/api
```

## Error Handling

All services return responses in the format:

```typescript
{
  success: boolean;
  data: T;
  error?: {
    code: number;
    message: string;
    details?: any;
  };
}
```

Errors are automatically logged to the console. For user-facing error messages, catch errors and display them appropriately:

```typescript
try {
  const result = await productService.getProducts();
  // Handle success
} catch (error) {
  // Handle error
  console.error('Failed to fetch products:', error);
}
```

## Testing

Tests are located in `__tests__` directories. Run tests with:

```bash
npm test
```

Tests use Vitest and mock the axios API client to test service methods in isolation.
