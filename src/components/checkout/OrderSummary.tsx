import React from 'react';
import { Product } from '../../types';
import { getImageUrl } from '../../utils/imageUtils';

interface OrderSummaryItem {
    product: Product;
    quantity: number;
}

interface OrderSummaryProps {
    items: OrderSummaryItem[];
    subtotal: number;
    gstAmount: number;
    shippingAmount: number;
    discountAmount: number;
    total: number;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
    items,
    subtotal,
    gstAmount,
    shippingAmount,
    discountAmount,
    total
}) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

            {/* Items List */}
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                    <div key={item.product.id} className="flex items-start space-x-4">
                        <img
                            src={getImageUrl(item.product.image_url)}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded bg-gray-100"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop';
                            }}
                        />
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                {item.product.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                                Qty: {item.quantity}
                            </p>
                            {item.product?.weight > 0 && (
                                <p className="text-xs text-gray-500">
                                    {item.product.weight}g • {item.product.gold_purity}
                                </p>
                            )}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                            ₹{((item.product?.current_price || item.product?.base_price || 0) * item.quantity).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-medium">
                        ₹{subtotal.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </span>
                </div>

                <div className="flex justify-between text-sm text-gray-700">
                    <span>Tax (3% GST):</span>
                    <span className="font-medium">
                        ₹{gstAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </span>
                </div>

                {shippingAmount > 0 && (
                    <div className="flex justify-between text-sm text-gray-700">
                        <span>Shipping:</span>
                        <span className="font-medium">
                            ₹{shippingAmount.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>
                )}

                {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Discount:</span>
                        <span className="font-medium">
                            -₹{discountAmount.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>
                )}

                <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-900">Total:</span>
                        <span className="text-yellow-600">
                            ₹{total.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Security Badge */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center text-sm text-gray-500">
                    <svg
                        className="w-5 h-5 mr-2 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                    </svg>
                    Secure Checkout
                </div>
            </div>
        </div>
    );
};
