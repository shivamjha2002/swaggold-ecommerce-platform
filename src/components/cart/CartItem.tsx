import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { ResponsiveImage } from '../ResponsiveImage';
import { getImageUrl } from '../../utils/imageUtils';
import { Product } from '../../types';

interface CartItemProps {
    product: Product;
    quantity: number;
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onRemove: (productId: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
    product,
    quantity,
    onUpdateQuantity,
    onRemove
}) => {
    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity >= 1) {
            onUpdateQuantity(product.id, newQuantity);
        }
    };

    const handleRemove = () => {
        onRemove(product.id);
    };

    const itemTotal = (product?.current_price || product?.base_price || 0) * quantity;

    return (
        <div className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-lg hover:border-yellow-500 transition-colors">
            {/* Product Image */}
            <div className="flex-shrink-0">
                <ResponsiveImage
                    src={getImageUrl(product.image_url)}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-lg"
                    sizes="96px"
                    loading="eager"
                />
            </div>

            {/* Product Details */}
            <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                    {product?.category || 'N/A'} • {product?.gold_purity || 'N/A'} Gold • {product?.weight || 0}g
                </p>
                <p className="text-lg font-bold text-yellow-600">
                    ₹{(product?.current_price || product?.base_price || 0).toLocaleString('en-IN')}
                </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4">
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                    <button
                        onClick={() => handleQuantityChange(quantity - 1)}
                        className="p-3 min-w-touch min-h-touch hover:bg-gray-100 rounded-l-lg transition-colors flex items-center justify-center"
                        aria-label="Decrease quantity"
                    >
                        <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="px-4 py-2 font-semibold text-gray-900 min-w-[3rem] text-center">
                        {quantity}
                    </span>
                    <button
                        onClick={() => handleQuantityChange(quantity + 1)}
                        className="p-3 min-w-touch min-h-touch hover:bg-gray-100 rounded-r-lg transition-colors flex items-center justify-center disabled:opacity-50"
                        aria-label="Increase quantity"
                        disabled={quantity >= product.stock_quantity}
                    >
                        <Plus className="h-4 w-4 text-gray-600" />
                    </button>
                </div>

                {/* Remove Button */}
                <button
                    onClick={handleRemove}
                    className="p-3 min-w-touch min-h-touch text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                    aria-label="Remove item"
                >
                    <Trash2 className="h-5 w-5" />
                </button>
            </div>

            {/* Item Total */}
            <div className="flex sm:flex-col items-center justify-between sm:justify-center">
                <span className="text-sm text-gray-600 sm:mb-2">Total:</span>
                <span className="text-lg font-bold text-gray-900">
                    ₹{(itemTotal || 0).toLocaleString('en-IN')}
                </span>
            </div>
        </div>
    );
};
