import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { cartService, Cart, CartTotals, CartItem } from '../services/cartService';
import { Product } from '../types';
import { useAuth } from './AuthContext';

interface CartState {
  items: CartItemWithProduct[];
  subtotal: number;
  gstAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  itemCount: number;
  loading: boolean;
}

interface CartItemWithProduct {
  product: Product;
  quantity: number;
}

interface CartContextType extends CartState {
  addToCart: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeFromCart: (productId: string, variantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [totals, setTotals] = useState<CartTotals>({
    subtotal: 0,
    gst_rate: 0.03,
    gst_amount: 0,
    shipping_amount: 0,
    discount_amount: 0,
    total: 0,
    item_count: 0
  });
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCartFromStorage = () => {
      try {
        const savedCart = localStorage.getItem('swati_jewellers_cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart)) {
            setItems(parsedCart);
            calculateTotals(parsedCart);
          }
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        setItems([]);
      }
    };

    loadCartFromStorage();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('swati_jewellers_cart', JSON.stringify(items));
      calculateTotals(items);
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items]);

  // Fetch cart from backend only when user logs in
  // Don't fetch on mount or logout - only when isAuthenticated becomes true
  useEffect(() => {
    // Only fetch if user just logged in (isAuthenticated changed from false to true)
    // This prevents fetching on every mount
    if (isAuthenticated) {
      // Small delay to ensure localStorage is loaded first
      const timer = setTimeout(() => {
        fetchCart();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const calculateTotals = (cartItems: CartItemWithProduct[]) => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.product?.current_price || item.product?.base_price || 0;
      return sum + (price * item.quantity);
    }, 0);
    const gstAmount = subtotal * 0.03;
    const shippingAmount = subtotal > 0 ? 100 : 0;
    const total = subtotal + gstAmount + shippingAmount;

    setTotals({
      subtotal,
      gst_rate: 0.03,
      gst_amount: gstAmount,
      shipping_amount: shippingAmount,
      discount_amount: 0,
      total,
      item_count: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    });
  };

  const fetchCart = useCallback(async () => {
    // Only fetch from backend if user is authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, using localStorage cart only');
      return;
    }

    // Get current localStorage cart before fetching from backend
    const localStorageCart = items;

    try {
      setLoading(true);
      const response = await cartService.getCart();

      if (response.success && response.data) {
        const backendItems = response.data.cart.items || [];

        if (backendItems.length > 0) {
          // Convert backend cart items to frontend format
          const cartItems: CartItemWithProduct[] = backendItems.map(item => ({
            product: {
              id: item.product_id,
              name: item.product_name,
              current_price: item.unit_price,
              base_price: item.unit_price,
              image_url: item.image_url || '',
              weight: item.weight || 0,
              gold_purity: item.gold_purity || '',
              category: '',
              description: '',
              stock_quantity: 999,
              is_active: true,
              status: 'published' as const,
              created_at: new Date().toISOString()
            },
            quantity: item.quantity
          }));

          // Merge with localStorage cart (backend takes priority)
          const mergedCart = [...cartItems];

          // Add localStorage items that are not in backend cart
          localStorageCart.forEach(localItem => {
            const existsInBackend = cartItems.some(
              backendItem => backendItem.product.id === localItem.product.id
            );
            if (!existsInBackend) {
              mergedCart.push(localItem);
            }
          });

          setItems(mergedCart);

          if (response.data.totals) {
            setTotals(response.data.totals);
          }
        } else {
          // Backend cart is empty, keep localStorage cart
          console.log('Backend cart is empty, keeping localStorage cart');
        }
      }
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      // Don't clear localStorage cart on error - keep existing items
      console.log('Keeping localStorage cart due to backend error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addToCart = async (productId: string, quantity: number = 1, variantId?: string) => {
    try {
      setLoading(true);
      const response = await cartService.addToCart(productId, quantity, variantId);

      if (response.success && response.data) {
        // Convert backend cart items to frontend format
        const cartItems: CartItemWithProduct[] = response.data.cart.items.map(item => ({
          product: {
            id: item.product_id,
            name: item.product_name,
            current_price: item.unit_price,
            image_url: item.image_url || '',
            weight: item.weight || 0,
            gold_purity: item.gold_purity || '',
            category: '',
            base_price: item.unit_price,
            description: '',
            stock_quantity: 999,
            is_active: true,
            status: 'published' as const,
            created_at: new Date().toISOString()
          },
          quantity: item.quantity
        }));

        setItems(cartItems);

        if (response.data.totals) {
          setTotals(response.data.totals);
        }

        // Show success notification
        console.log('Item added to cart successfully');
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to add item to cart';
      alert(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number, variantId?: string) => {
    try {
      // Optimistic update - update localStorage immediately
      const optimisticItems = items.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      ).filter(item => item.quantity > 0);

      setItems(optimisticItems);
      calculateTotals(optimisticItems);

      // Only sync with backend if user is authenticated
      if (!isAuthenticated) {
        return;
      }

      setLoading(true);
      const response = await cartService.updateQuantity(productId, quantity, variantId);

      if (response.success && response.data) {
        // Update with server response
        const cartItems: CartItemWithProduct[] = response.data.cart.items.map(item => ({
          product: {
            id: item.product_id,
            name: item.product_name,
            current_price: item.unit_price,
            image_url: item.image_url || '',
            weight: item.weight || 0,
            gold_purity: item.gold_purity || '',
            category: '',
            base_price: item.unit_price,
            description: '',
            stock_quantity: 999,
            is_active: true,
            status: 'published' as const,
            created_at: new Date().toISOString()
          },
          quantity: item.quantity
        }));

        setItems(cartItems);

        if (response.data.totals) {
          setTotals(response.data.totals);
        }
      }
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      // Revert optimistic update
      await fetchCart();
      const errorMessage = error.response?.data?.error?.message || 'Failed to update quantity';
      alert(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: string, variantId?: string) => {
    try {
      // Optimistic update - remove from localStorage immediately
      const updatedItems = items.filter(item => item.product.id !== productId);
      setItems(updatedItems);
      calculateTotals(updatedItems);

      // Only sync with backend if user is authenticated
      if (!isAuthenticated) {
        return;
      }

      setLoading(true);
      const response = await cartService.removeItem(productId, variantId);

      if (response.success && response.data) {
        const cartItems: CartItemWithProduct[] = response.data.cart.items.map(item => ({
          product: {
            id: item.product_id,
            name: item.product_name,
            current_price: item.unit_price,
            image_url: item.image_url || '',
            weight: item.weight || 0,
            gold_purity: item.gold_purity || '',
            category: '',
            base_price: item.unit_price,
            description: '',
            stock_quantity: 999,
            is_active: true,
            status: 'published' as const,
            created_at: new Date().toISOString()
          },
          quantity: item.quantity
        }));

        setItems(cartItems);

        if (response.data.totals) {
          setTotals(response.data.totals);
        }

        console.log('Item removed from cart successfully');
      }
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to remove item';
      alert(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      // Clear localStorage cart immediately
      setItems([]);
      setTotals({
        subtotal: 0,
        gst_rate: 0.03,
        gst_amount: 0,
        shipping_amount: 0,
        discount_amount: 0,
        total: 0,
        item_count: 0
      });

      // Also clear backend cart if user is authenticated
      if (isAuthenticated) {
        setLoading(true);
        const response = await cartService.clearCart();
        if (response.success) {
          console.log('Backend cart cleared successfully');
        }
      }
    } catch (error: any) {
      console.error('Error clearing backend cart:', error);
      // Don't show error - localStorage cart is already cleared
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Local-only methods for backward compatibility with tests
  const addItem = (product: Product, quantity: number = 1) => {
    // Update localStorage cart immediately
    const existingItemIndex = items.findIndex(item => item.product.id === product.id);

    if (existingItemIndex > -1) {
      const newItems = [...items];
      newItems[existingItemIndex].quantity += quantity;
      setItems(newItems);
    } else {
      setItems([...items, { product, quantity }]);
    }

    // Also sync to backend if user is authenticated (fire and forget)
    if (isAuthenticated) {
      cartService.addToCart(product.id, quantity).catch(err => {
        console.error('Failed to sync cart to backend:', err);
      });
    }
  };

  const removeItem = (productId: string) => {
    // Update localStorage cart immediately
    setItems(items.filter(item => item.product.id !== productId));

    // Also sync to backend if user is authenticated (fire and forget)
    if (isAuthenticated) {
      cartService.removeItem(productId).catch(err => {
        console.error('Failed to sync cart removal to backend:', err);
      });
    }
  };

  const value: CartContextType = {
    items,
    subtotal: totals.subtotal,
    gstAmount: totals.gst_amount,
    shippingAmount: totals.shipping_amount,
    discountAmount: totals.discount_amount,
    totalAmount: totals.total,
    itemCount: totals.item_count,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
    addItem,
    removeItem,
    total: totals.subtotal
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
};
