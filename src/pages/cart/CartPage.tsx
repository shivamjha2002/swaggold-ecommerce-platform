import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { CartItem } from '../../components/cart/CartItem';
import { CartSummary } from '../../components/cart/CartSummary';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

/**
 * CartPage component - Protected cart page with item management
 * 
 * Features:
 * - Wrapped with ProtectedRoute component for authentication
 * - Fetches cart data from GET /api/cart endpoint via CartContext
 * - Displays list of cart items with product images and details
 * - Quantity adjustment controls (increment/decrement)
 * - Calls PUT /api/cart/items/:product_id when quantity changes
 * - Remove item button calling DELETE /api/cart/items/:product_id
 * - Displays price breakdown: subtotal, GST, shipping, total
 * - "Proceed to Checkout" button
 * - Empty cart state with "Continue Shopping" link
 * 
 * Requirements: 1.12.1, 1.12.2, 1.12.3, 1.12.4
 */
const CartPageContent: React.FC = () => {
    const {
        items,
        updateQuantity,
        removeFromCart,
        itemCount,
        subtotal,
        gstAmount,
        shippingAmount,
        discountAmount,
        totalAmount,
        loading,
    } = useCart();

    /**
     * Handle quantity change for a cart item
     * Calls PUT /api/cart/items/:product_id via CartContext
     */
    const handleQuantityChange = async (productId: string, newQuantity: number) => {
        try {
            await updateQuantity(productId, newQuantity);
        } catch (error) {
            console.error('Failed to update quantity:', error);
        }
    };

    /**
     * Handle removing an item from cart
     * Calls DELETE /api/cart/items/:product_id via CartContext
     */
    const handleRemoveItem = async (productId: string) => {
        try {
            await removeFromCart(productId);
        } catch (error) {
            console.error('Failed to remove item:', error);
        }
    };

    // Loading state - display spinner while fetching cart data
    if (loading && items.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading cart...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Empty cart state - show message with "Continue Shopping" link
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-16">
                        <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-6" />
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
                        <p className="text-gray-600 mb-8">
                            Looks like you haven't added any items to your cart yet.
                        </p>
                        <Link
                            to="/products"
                            className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
                        >
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Cart with items - display list of items and summary
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items - Display list of cart items with product images and details */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">
                                    Cart Items ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                                </h2>

                                {/* List of cart items with quantity adjustment and remove controls */}
                                <div className="space-y-4">
                                    {items.map((item) => (
                                        <CartItem
                                            key={item.product.id}
                                            product={item.product}
                                            quantity={item.quantity}
                                            onUpdateQuantity={handleQuantityChange}
                                            onRemove={handleRemoveItem}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Continue Shopping Button */}
                        <div className="mt-6">
                            <Link
                                to="/products"
                                className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-semibold"
                            >
                                <ArrowLeft className="mr-2 h-5 w-5" />
                                Continue Shopping
                            </Link>
                        </div>
                    </div>

                    {/* Cart Summary - Display price breakdown: subtotal, GST, shipping, total */}
                    <div className="lg:col-span-1">
                        <CartSummary
                            subtotal={subtotal}
                            gstAmount={gstAmount}
                            shippingAmount={shippingAmount}
                            discountAmount={discountAmount}
                            total={totalAmount}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * CartPage component wrapped with ProtectedRoute
 * Ensures only authenticated users can access the cart page
 */
const CartPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <CartPageContent />
        </ProtectedRoute>
    );
};

export default CartPage;
