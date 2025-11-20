# Loading States and Error Handling Guide

This guide demonstrates how to implement proper loading states and error handling in the Swati Gold Platform.

## Overview

The platform provides several components and utilities for handling async operations:

1. **LoadingSpinner** - Visual loading indicator
2. **ErrorMessage** - User-friendly error display with retry
3. **LoadingState** - Wrapper component for loading/error/success states
4. **ErrorBoundary** - React error boundary for component errors
5. **useApiCall** - Custom hook for API call state management
6. **Toast Notifications** - Global notification system

## Basic Usage

### 1. Using LoadingState Component (Recommended)

The simplest way to handle loading and error states:

```tsx
import { LoadingState } from '@/components/common';
import { useApiCall } from '@/hooks/useApiCall';
import { productService } from '@/services/productService';

function ProductList() {
  const { data, loading, error, execute, retry } = useApiCall(
    productService.getProducts
  );

  useEffect(() => {
    execute();
  }, []);

  return (
    <LoadingState 
      loading={loading} 
      error={error} 
      onRetry={retry}
      loadingText="Loading products..."
    >
      <div className="grid grid-cols-3 gap-4">
        {data?.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </LoadingState>
  );
}
```

### 2. Manual Loading and Error Handling

For more control over the UI:

```tsx
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/common';
import { useState, useEffect } from 'react';
import { productService } from '@/services/productService';
import { handleApiErrorWithOptions } from '@/utils/apiErrorHandler';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err) {
      const message = handleApiErrorWithOptions(err, {
        showToast: true,
        onError: setError
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading products..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={loadProducts}
        variant="card"
      />
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### 3. Using useApiCall Hook

The custom hook simplifies state management:

```tsx
import { useApiCall } from '@/hooks/useApiCall';
import { productService } from '@/services/productService';

function ProductDetail({ productId }: { productId: string }) {
  const { 
    data: product, 
    loading, 
    error, 
    execute, 
    retry 
  } = useApiCall(productService.getProductById, {
    onSuccess: (data) => {
      console.log('Product loaded:', data);
    },
    onError: (error) => {
      console.error('Failed to load product:', error);
    }
  });

  useEffect(() => {
    execute(productId);
  }, [productId]);

  // Use with LoadingState component
  return (
    <LoadingState loading={loading} error={error} onRetry={retry}>
      <div>
        <h1>{product?.name}</h1>
        <p>{product?.description}</p>
      </div>
    </LoadingState>
  );
}
```

### 4. Form Submission with Loading Button

```tsx
import { LoadingButton } from '@/components/LoadingButton';
import { ErrorMessage } from '@/components/common';
import { useState } from 'react';
import { authService } from '@/services/authService';
import showToast from '@/utils/toast';

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.login(formData);
      showToast.success('Login successful!');
      // Redirect or update state
    } catch (err) {
      const message = handleApiErrorWithOptions(err, {
        showToast: false, // We'll show inline error instead
        onError: setError
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <ErrorMessage message={error} variant="banner" />
      )}
      
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        className="w-full px-4 py-2 border rounded"
      />
      
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        className="w-full px-4 py-2 border rounded"
      />
      
      <LoadingButton
        type="submit"
        loading={loading}
        loadingText="Logging in..."
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Login
      </LoadingButton>
    </form>
  );
}
```

### 5. Error Message Variants

```tsx
import { 
  ErrorMessage, 
  ErrorMessageCard, 
  ErrorMessageBanner,
  ErrorMessageInline 
} from '@/components/common';

// Inline error (for form fields)
<ErrorMessageInline message="Invalid email format" />

// Card error (for content sections)
<ErrorMessageCard 
  message="Failed to load products" 
  onRetry={handleRetry} 
/>

// Banner error (for page-level errors)
<ErrorMessageBanner 
  message="Unable to connect to server. Please check your connection." 
  onRetry={handleRetry}
/>

// Custom variant
<ErrorMessage 
  message="Something went wrong" 
  onRetry={handleRetry}
  variant="card"
  showIcon={true}
/>
```

### 6. Toast Notifications

```tsx
import showToast from '@/utils/toast';

// Success toast
showToast.success('Product added to cart!');

// Error toast
showToast.error('Failed to add product to cart');

// Info toast
showToast.info('Your session will expire in 5 minutes');

// Warning toast
showToast.warning('Low stock available');

// Promise toast (shows loading, then success/error)
showToast.promise(
  productService.createProduct(data),
  {
    pending: 'Creating product...',
    success: 'Product created successfully!',
    error: 'Failed to create product'
  }
);
```

### 7. API Call with Retry Logic

```tsx
import { executeWithRetry, withRetry } from '@/utils/apiErrorHandler';
import { productService } from '@/services/productService';

// One-time retry
async function loadProducts() {
  try {
    const products = await executeWithRetry(
      () => productService.getProducts(),
      {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true
      }
    );
    return products;
  } catch (error) {
    // Handle error after all retries failed
    handleApiErrorWithOptions(error);
  }
}

// Create a reusable retry wrapper
const getProductsWithRetry = withRetry(
  productService.getProducts,
  { maxRetries: 3 }
);

// Use it like the original function
const products = await getProductsWithRetry();
```

### 8. Error Boundary Usage

Wrap your app or specific sections with ErrorBoundary:

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Your routes */}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

// Or wrap specific sections
function ProductSection() {
  return (
    <ErrorBoundary fallback={<CustomErrorUI />}>
      <ProductList />
    </ErrorBoundary>
  );
}
```

## Best Practices

### 1. Always Show Loading States
- Use LoadingSpinner for async operations
- Disable buttons during submission (use LoadingButton)
- Show skeleton loaders for content that's loading

### 2. Display User-Friendly Error Messages
- Never show technical error details to users
- Use getErrorMessage() to extract user-friendly messages
- Provide actionable error messages when possible

### 3. Implement Retry Functionality
- Add retry buttons for failed API calls
- Use automatic retry for transient network errors
- Limit retry attempts to avoid infinite loops

### 4. Use Toast Notifications Appropriately
- Success: Confirm user actions (e.g., "Product added to cart")
- Error: Show critical errors that need attention
- Info: Provide helpful information
- Warning: Alert users to potential issues

### 5. Handle Different Error Types
- Network errors: "Unable to connect. Please check your connection."
- Timeout errors: "Request timed out. Please try again."
- Validation errors: Show specific field errors
- Server errors: "Something went wrong. Please try again later."

### 6. Accessibility
- Use proper ARIA labels (role="status", aria-live="polite")
- Ensure loading states are announced to screen readers
- Make retry buttons keyboard accessible

### 7. Error Boundaries
- Wrap the entire app in an ErrorBoundary
- Add ErrorBoundaries around critical sections
- Provide fallback UI for better UX

## Common Patterns

### Pattern 1: List Page with Loading and Error

```tsx
function ProductListPage() {
  const { data, loading, error, retry } = useApiCall(productService.getProducts);

  useEffect(() => {
    retry();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      
      <LoadingState loading={loading} error={error} onRetry={retry}>
        {data && data.length === 0 ? (
          <p className="text-gray-500">No products found.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {data?.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </LoadingState>
    </div>
  );
}
```

### Pattern 2: Form with Validation and Error Handling

```tsx
function CreateProductForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (data: ProductData) => {
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      await productService.createProduct(data);
      showToast.success('Product created successfully!');
      // Reset form or redirect
    } catch (err) {
      // Handle validation errors
      if (err.response?.data?.error?.details) {
        setFieldErrors(err.response.data.error.details);
      } else {
        handleApiErrorWithOptions(err, {
          showToast: false,
          onError: setError
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessageBanner message={error} />}
      
      <Input
        label="Product Name"
        error={fieldErrors.name}
        // ... other props
      />
      
      <LoadingButton loading={loading} type="submit">
        Create Product
      </LoadingButton>
    </form>
  );
}
```

### Pattern 3: Optimistic Updates with Error Recovery

```tsx
function CartItem({ item }: { item: CartItem }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [updating, setUpdating] = useState(false);

  const updateQuantity = async (newQuantity: number) => {
    const previousQuantity = quantity;
    
    // Optimistic update
    setQuantity(newQuantity);
    setUpdating(true);

    try {
      await cartService.updateItem(item.id, newQuantity);
      showToast.success('Cart updated');
    } catch (err) {
      // Revert on error
      setQuantity(previousQuantity);
      handleApiErrorWithOptions(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={updating ? 'opacity-50' : ''}>
      {/* Cart item UI */}
    </div>
  );
}
```

## Testing

When testing components with loading and error states:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

describe('ProductList', () => {
  it('shows loading state', () => {
    render(<ProductList />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state with retry button', async () => {
    vi.mocked(productService.getProducts).mockRejectedValue(
      new Error('Network error')
    );

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  it('shows products after loading', async () => {
    const mockProducts = [{ id: '1', name: 'Gold Ring' }];
    vi.mocked(productService.getProducts).mockResolvedValue(mockProducts);

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('Gold Ring')).toBeInTheDocument();
    });
  });
});
```

## Summary

The Swati Gold Platform provides a comprehensive set of tools for handling loading states and errors:

- **Components**: LoadingSpinner, ErrorMessage, LoadingState, LoadingButton, ErrorBoundary
- **Hooks**: useApiCall for state management
- **Utilities**: handleApiErrorWithOptions, executeWithRetry, showToast
- **Patterns**: Consistent patterns for lists, forms, and optimistic updates

Always prioritize user experience by showing clear loading indicators, user-friendly error messages, and providing retry options for failed operations.
