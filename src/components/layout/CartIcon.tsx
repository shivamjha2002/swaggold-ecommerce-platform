import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

/**
 * CartIcon Component
 * 
 * Displays a shopping cart icon with item count badge in the navbar.
 * Features:
 * - Shows current cart item count from CartContext
 * - Clickable to navigate to cart page
 * - Badge displays item count when > 0
 * - Only visible for authenticated users
 * - Updates automatically when items are added/removed
 */
export const CartIcon: React.FC = () => {
    const navigate = useNavigate();
    const { itemCount } = useCart();
    const { isAuthenticated } = useAuth();

    // Only show cart icon for authenticated users
    if (!isAuthenticated) {
        return null;
    }

    const handleClick = () => {
        navigate('/cart');
    };

    return (
        <button
            onClick={handleClick}
            className="relative p-2 rounded-lg text-neutral-700 hover:text-gold-600 hover:bg-gold-50 transition-all duration-200"
            aria-label={`Shopping cart with ${itemCount} items`}
        >
            <ShoppingCart className="h-6 w-6" />

            {/* Item count badge */}
            {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-gradient-to-r from-gold-500 to-gold-600 rounded-full shadow-md">
                    {itemCount > 99 ? '99+' : itemCount}
                </span>
            )}
        </button>
    );
};

export default CartIcon;
