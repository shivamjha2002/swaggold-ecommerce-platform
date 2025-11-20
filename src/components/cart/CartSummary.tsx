import React from 'react';
import { Link } from 'react-router-dom';

interface CartSummaryProps {
    subtotal: number;
    gstAmount: number;
    shippingAmount: number;
    discountAmount: number;
    total: number;
    onCheckout?: () => void;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
    subtotal,
    gstAmount,
    shippingAmount,
    discountAmount,
    total,
    onCheckout
}) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                        ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>

                <div className="flex justify-between text-gray-700">
                    <span>Tax (3% GST):</span>
                    <span className="font-semibold">
                        ₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>

                {shippingAmount > 0 && (
                    <div className="flex justify-between text-gray-700">
                        <span>Shipping:</span>
                        <span className="font-semibold">
                            ₹{shippingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                )}

                {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span className="font-semibold">
                            -₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                        <span>Total:</span>
                        <span className="text-yellow-600">
                            ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            {onCheckout ? (
                <button
                    onClick={onCheckout}
                    className="w-full bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-yellow-700 transition-colors mb-3"
                >
                    Proceed to Checkout
                </button>
            ) : (
                <Link
                    to="/checkout"
                    className="block w-full bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-yellow-700 transition-colors mb-3 text-center"
                >
                    Proceed to Checkout
                </Link>
            )}

            <p className="text-xs text-gray-500 text-center">
                Secure checkout powered by Swati Jewellers
            </p>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">We Accept:</h3>
                <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">Cash</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">Card</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">UPI</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">Khata</span>
                </div>
            </div>
        </div>
    );
};
