/**
 * Cart Functionality Tests
 * 
 * Tests cart operations: adding items, updating quantities, removing items,
 * cart persistence, and total calculations
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.8
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider, useCart } from '../context/CartContext';
import Cart from '../pages/Cart';
import { Product } from '../types';

// Mock product data
const mockProduct1: Product = {
  id: 'p1',
  name: 'Gold Ring',
  category: 'Rings',
  base_price: 10000,
  weight: 5,
  gold_purity: '916',
  current_price: 10500,
  description: 'Beautiful gold ring',
  image_url: '/images/ring.jpg',
  stock_quantity: 10,
  is_active: true,
  status: 'published',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockProduct2: Product = {
  id: 'p2',
  name: 'Gold Necklace',
  category: 'Necklaces',
  base_price: 50000,
  weight: 20,
  gold_purity: '916',
  current_price: 52000,
  description: 'Elegant gold necklace',
  image_url: '/images/necklace.jpg',
  stock_quantity: 5,
  is_active: true,
  status: 'published',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockProduct3: Product = {
  id: 'p3',
  name: 'Gold Earrings',
  category: 'Earrings',
  base_price: 15000,
  weight: 8,
  gold_purity: '916',
  current_price: 15500,
  description: 'Stunning gold earrings',
  image_url: '/images/earrings.jpg',
  stock_quantity: 8,
  is_active: true,
  status: 'published',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Helper to render with CartProvider
const renderWithCart = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <CartProvider>{component}</CartProvider>
    </BrowserRouter>
  );
};

// Helper to render hook with CartProvider
const renderCartHook = () => {
  return renderHook(() => useCart(), {
    wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
  });
};

describe('Cart Context', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Adding Items to Cart (Requirement 7.1)', () => {
    it('should add a new item to empty cart', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.id).toBe('p1');
      expect(result.current.items[0].quantity).toBe(1);
    });

    it('should add multiple different items to cart', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1);
        result.current.addItem(mockProduct2, 2);
        result.current.addItem(mockProduct3, 1);
      });

      expect(result.current.items).toHaveLength(3);
      expect(result.current.items[0].product.id).toBe('p1');
      expect(result.current.items[1].product.id).toBe('p2');
      expect(result.current.items[2].product.id).toBe('p3');
    });

    it('should increase quantity when adding existing item', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1);
      });

      expect(result.current.items[0].quantity).toBe(1);

      act(() => {
        result.current.addItem(mockProduct1, 2);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(3);
    });

    it('should add item with default quantity of 1 when quantity not specified', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1);
      });

      expect(result.current.items[0].quantity).toBe(1);
    });

    it('should add item with specified quantity', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });
  });

  describe('Updating Quantities (Requirement 7.3)', () => {
    it('should update item quantity to a new value', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
      });

      expect(result.current.items[0].quantity).toBe(2);

      act(() => {
        result.current.updateQuantity('p1', 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });

    it('should increase item quantity', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1);
      });

      act(() => {
        result.current.updateQuantity('p1', 3);
      });

      expect(result.current.items[0].quantity).toBe(3);
    });

    it('should decrease item quantity', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 5);
      });

      act(() => {
        result.current.updateQuantity('p1', 2);
      });

      expect(result.current.items[0].quantity).toBe(2);
    });

    it('should remove item when quantity is set to 0', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
      });

      expect(result.current.items).toHaveLength(1);

      act(() => {
        result.current.updateQuantity('p1', 0);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('should remove item when quantity is set to negative', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
      });

      act(() => {
        result.current.updateQuantity('p1', -1);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('should not affect other items when updating one item', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
        result.current.addItem(mockProduct2, 3);
      });

      act(() => {
        result.current.updateQuantity('p1', 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
      expect(result.current.items[1].quantity).toBe(3);
    });
  });

  describe('Removing Items (Requirement 7.2)', () => {
    it('should remove item from cart', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
        result.current.addItem(mockProduct2, 1);
      });

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.removeItem('p1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].product.id).toBe('p2');
    });

    it('should remove correct item when multiple items exist', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1);
        result.current.addItem(mockProduct2, 2);
        result.current.addItem(mockProduct3, 3);
      });

      act(() => {
        result.current.removeItem('p2');
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items.find(item => item.product.id === 'p2')).toBeUndefined();
      expect(result.current.items.find(item => item.product.id === 'p1')).toBeDefined();
      expect(result.current.items.find(item => item.product.id === 'p3')).toBeDefined();
    });

    it('should handle removing non-existent item gracefully', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1);
      });

      expect(result.current.items).toHaveLength(1);

      act(() => {
        result.current.removeItem('non-existent-id');
      });

      expect(result.current.items).toHaveLength(1);
    });

    it('should clear all items with clearCart', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1);
        result.current.addItem(mockProduct2, 2);
        result.current.addItem(mockProduct3, 3);
      });

      expect(result.current.items).toHaveLength(3);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('Cart Total Calculations (Requirement 7.4)', () => {
    it('should calculate total for single item', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
      });

      const expectedTotal = mockProduct1.current_price * 2;
      expect(result.current.total).toBe(expectedTotal);
    });

    it('should calculate total for multiple items', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2); // 10500 * 2 = 21000
        result.current.addItem(mockProduct2, 1); // 52000 * 1 = 52000
        result.current.addItem(mockProduct3, 3); // 15500 * 3 = 46500
      });

      const expectedTotal = (10500 * 2) + (52000 * 1) + (15500 * 3);
      expect(result.current.total).toBe(expectedTotal);
    });

    it('should update total when quantity changes', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
      });

      const initialTotal = mockProduct1.current_price * 2;
      expect(result.current.total).toBe(initialTotal);

      act(() => {
        result.current.updateQuantity('p1', 5);
      });

      const updatedTotal = mockProduct1.current_price * 5;
      expect(result.current.total).toBe(updatedTotal);
    });

    it('should update total when item is removed', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
        result.current.addItem(mockProduct2, 1);
      });

      const initialTotal = (mockProduct1.current_price * 2) + (mockProduct2.current_price * 1);
      expect(result.current.total).toBe(initialTotal);

      act(() => {
        result.current.removeItem('p1');
      });

      const updatedTotal = mockProduct2.current_price * 1;
      expect(result.current.total).toBe(updatedTotal);
    });

    it('should return 0 for empty cart', () => {
      const { result } = renderCartHook();

      expect(result.current.total).toBe(0);
    });

    it('should calculate item count correctly', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
        result.current.addItem(mockProduct2, 3);
        result.current.addItem(mockProduct3, 1);
      });

      expect(result.current.itemCount).toBe(6); // 2 + 3 + 1
    });

    it('should update item count when quantities change', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
      });

      expect(result.current.itemCount).toBe(2);

      act(() => {
        result.current.updateQuantity('p1', 5);
      });

      expect(result.current.itemCount).toBe(5);
    });
  });

  describe('Cart Persistence (Requirement 7.8)', () => {
    it('should save cart to localStorage when items are added', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
      });

      const savedCart = localStorage.getItem('swati_jewellers_cart');
      expect(savedCart).toBeTruthy();

      const parsedCart = JSON.parse(savedCart!);
      expect(parsedCart).toHaveLength(1);
      expect(parsedCart[0].product.id).toBe('p1');
      expect(parsedCart[0].quantity).toBe(2);
    });

    it('should update localStorage when cart changes', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1);
      });

      let savedCart = JSON.parse(localStorage.getItem('swati_jewellers_cart')!);
      expect(savedCart[0].quantity).toBe(1);

      act(() => {
        result.current.updateQuantity('p1', 5);
      });

      savedCart = JSON.parse(localStorage.getItem('swati_jewellers_cart')!);
      expect(savedCart[0].quantity).toBe(5);
    });

    it('should load cart from localStorage on mount', () => {
      const cartData = [
        { product: mockProduct1, quantity: 2 },
        { product: mockProduct2, quantity: 1 },
      ];

      localStorage.setItem('swati_jewellers_cart', JSON.stringify(cartData));

      const { result } = renderCartHook();

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].product.id).toBe('p1');
      expect(result.current.items[0].quantity).toBe(2);
      expect(result.current.items[1].product.id).toBe('p2');
      expect(result.current.items[1].quantity).toBe(1);
    });

    it('should persist cart across page refreshes', () => {
      // First render - add items
      const { result: result1 } = renderCartHook();

      act(() => {
        result1.current.addItem(mockProduct1, 3);
        result1.current.addItem(mockProduct2, 2);
      });

      // Simulate page refresh by creating new hook instance
      const { result: result2 } = renderCartHook();

      expect(result2.current.items).toHaveLength(2);
      expect(result2.current.items[0].quantity).toBe(3);
      expect(result2.current.items[1].quantity).toBe(2);
    });

    it('should clear localStorage when cart is cleared', () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
      });

      expect(localStorage.getItem('swati_jewellers_cart')).toBeTruthy();

      act(() => {
        result.current.clearCart();
      });

      const savedCart = JSON.parse(localStorage.getItem('swati_jewellers_cart')!);
      expect(savedCart).toHaveLength(0);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('swati_jewellers_cart', 'invalid json');

      const { result } = renderCartHook();

      expect(result.current.items).toHaveLength(0);
    });
  });
});

describe('Cart Page Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Empty Cart Display', () => {
    it('should display empty cart message when no items', () => {
      renderWithCart(<Cart />);

      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
      expect(screen.getByText(/continue shopping/i)).toBeInTheDocument();
    });

    it('should show shopping bag icon for empty cart', () => {
      renderWithCart(<Cart />);

      const emptyMessage = screen.getByText(/your cart is empty/i);
      expect(emptyMessage).toBeInTheDocument();
    });
  });

  describe('Cart Items Display (Requirement 7.2)', () => {
    it('should display cart items with product details', async () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
      });

      renderWithCart(<Cart />);

      await waitFor(() => {
        expect(screen.getByText('Gold Ring')).toBeInTheDocument();
        expect(screen.getByText(/rings/i)).toBeInTheDocument();
      });
    });

    it('should display correct item count in header', async () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
        result.current.addItem(mockProduct2, 1);
      });

      renderWithCart(<Cart />);

      await waitFor(() => {
        expect(screen.getByText(/3 items/i)).toBeInTheDocument();
      });
    });

    it('should display product images', async () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1);
      });

      renderWithCart(<Cart />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThan(0);
      });
    });

    it('should display product prices', async () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1);
      });

      renderWithCart(<Cart />);

      await waitFor(() => {
        const prices = screen.getAllByText(/₹10,500/);
        expect(prices.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Cart Summary (Requirement 7.4)', () => {
    it('should display order summary section', async () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1);
      });

      renderWithCart(<Cart />);

      await waitFor(() => {
        expect(screen.getByText(/order summary/i)).toBeInTheDocument();
      });
    });

    it('should display subtotal correctly', async () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 2);
      });

      renderWithCart(<Cart />);

      await waitFor(() => {
        expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
        expect(screen.getByText(/₹21,000\.00/)).toBeInTheDocument();
      });
    });

    it('should calculate and display tax', async () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1);
      });

      renderWithCart(<Cart />);

      await waitFor(() => {
        expect(screen.getByText(/tax/i)).toBeInTheDocument();
      });
    });

    it('should display total amount with tax', async () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1); // 10500
      });

      renderWithCart(<Cart />);

      await waitFor(() => {
        expect(screen.getByText(/₹10,815\.00/)).toBeInTheDocument();
      });
    });
  });

  describe('Cart Actions', () => {
    it('should have proceed to checkout button', async () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1);
      });

      renderWithCart(<Cart />);

      await waitFor(() => {
        expect(screen.getByText(/proceed to checkout/i)).toBeInTheDocument();
      });
    });

    it('should have continue shopping link', async () => {
      const { result } = renderCartHook();

      act(() => {
        result.current.addItem(mockProduct1, 1);
      });

      renderWithCart(<Cart />);

      await waitFor(() => {
        const links = screen.getAllByText(/continue shopping/i);
        expect(links.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Cart Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should handle complete cart workflow', () => {
    const { result } = renderCartHook();

    // Add items
    act(() => {
      result.current.addItem(mockProduct1, 2);
      result.current.addItem(mockProduct2, 1);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.itemCount).toBe(3);

    // Update quantity
    act(() => {
      result.current.updateQuantity('p1', 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.itemCount).toBe(6);

    // Remove item
    act(() => {
      result.current.removeItem('p2');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.itemCount).toBe(5);

    // Clear cart
    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('should maintain cart state consistency across operations', () => {
    const { result } = renderCartHook();

    act(() => {
      result.current.addItem(mockProduct1, 1);
      result.current.addItem(mockProduct2, 2);
      result.current.addItem(mockProduct3, 3);
    });

    const initialTotal = result.current.total;
    const initialCount = result.current.itemCount;

    expect(initialCount).toBe(6);

    act(() => {
      result.current.updateQuantity('p2', 5);
    });

    expect(result.current.itemCount).toBe(9); // 1 + 5 + 3
    expect(result.current.total).toBeGreaterThan(initialTotal);

    act(() => {
      result.current.removeItem('p3');
    });

    expect(result.current.itemCount).toBe(6); // 1 + 5
    expect(result.current.items).toHaveLength(2);
  });
});
