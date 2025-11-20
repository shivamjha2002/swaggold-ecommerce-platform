import React from 'react';
import { Product } from '../../types';

interface CartItemWithProduct {
    product: Product;
    quantity: number;
}

interface CheckoutSidebarProps {
    items: CartItemWithProduct[];
    subtotal: number;
    gstAmount: number;
    shippingAmount: number;
    discountAmount: number;
    total: number;
    itemCount: number;
}

/**
 * CheckoutSidebar component - Order summary sidebar
 * 
 * Features:
 * - Displays cart items with images and details
 * - Shows price breakdown: subtotal, GST, shipping, total
 * - Sticky sidebar for easy viewing during checkout
 * 
 * Requirements: 1.13.4
 */
export const CheckoutSidebar: React.FC<CheckoutSidebarProps> = ({
    items,
    subtotal,
    gstAmount,
    shippingAmount,
    discountAmount,
    total,
    itemCount
}) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                        {/* Product Image */}
                        <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                            {item.product.image_url ? (
                                <img
                                    src={item.product.image_url}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <span className="text-xs">No image</span>
                                </div>
                            )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {item.product.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Qty: {item.quantity}
                            </p>
                            <p className="text-sm font-semibold text-yellow-600 mt-1">
                                ₹{((item.product.current_price || item.product.base_price) * item.quantity).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'}):</span>
                    <span className="font-semibold">
                        ₹{subtotal.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </span>
                </div>

                <div className="flex justify-between text-gray-700">
                    <span>Tax (3% GST):</span>
                    <span className="font-semibold">
                        ₹{gstAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </span>
                </div>

                {shippingAmount > 0 && (
                    <div className="flex justify-between text-gray-700">
                        <span>Shipping:</span>
                        <span className="font-semibold">
                            ₹{shippingAmount.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>
                )}

                {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span className="font-semibold">
                            -₹{discountAmount.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>
                )}
            </div>

            {/* Total */}
            <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total:</span>
                    <span className="text-yellow-600">
                        ₹{total.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </span>
                </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">We Accept:</h3>
                <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded">Cash</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded">Card</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded">UPI</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded">Razorpay</span>
                </div>
            </div>

            {/* Security Badge */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                    🔒 Secure checkout powered by Swati Gold
                </p>
            </div>
        </div>
    );
};
