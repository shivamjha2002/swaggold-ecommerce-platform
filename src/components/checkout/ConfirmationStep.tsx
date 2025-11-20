import React from 'react';
import { CheckCircle, Package, CreditCard, MapPin, Calendar } from 'lucide-react';

interface ConfirmationStepProps {
    orderData: any;
    onComplete: () => void;
}

/**
 * ConfirmationStep component - Order confirmation display
 * 
 * Features:
 * - Display order confirmation with success message
 * - Show order details (order number, payment info)
 * - Display order items
 * - Show delivery address
 * - Provide next steps
 * 
 * Requirements: 1.13.1
 */
export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ orderData, onComplete }) => {
    const order = orderData?.order;
    const payment = orderData?.payment;

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Success Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Order Placed Successfully!
                </h2>
                <p className="text-gray-600">
                    Thank you for your purchase. Your order has been confirmed.
                </p>
            </div>

            {/* Order Details */}
            {order && (
                <div className="space-y-6">
                    {/* Order Number and Payment Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center mb-2">
                                <Package className="h-5 w-5 text-yellow-600 mr-2" />
                                <h3 className="text-sm font-semibold text-gray-900">Order Number</h3>
                            </div>
                            <p className="text-lg font-bold text-gray-900">{order.order_number}</p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center mb-2">
                                <CreditCard className="h-5 w-5 text-yellow-600 mr-2" />
                                <h3 className="text-sm font-semibold text-gray-900">Payment Status</h3>
                            </div>
                            <p className="text-lg font-bold text-green-600 capitalize">
                                {order.payment_status || 'Paid'}
                            </p>
                        </div>
                    </div>

                    {/* Order Date and Total */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center mb-2">
                                <Calendar className="h-5 w-5 text-yellow-600 mr-2" />
                                <h3 className="text-sm font-semibold text-gray-900">Order Date</h3>
                            </div>
                            <p className="text-sm text-gray-700">
                                {formatDate(order.created_at || order.order_date)}
                            </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center mb-2">
                                <CreditCard className="h-5 w-5 text-yellow-600 mr-2" />
                                <h3 className="text-sm font-semibold text-gray-900">Total Amount</h3>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(order.total_amount || order.total)}
                            </p>
                        </div>
                    </div>

                    {/* Delivery Address */}
                    {order.shipping_address && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center mb-3">
                                <MapPin className="h-5 w-5 text-yellow-600 mr-2" />
                                <h3 className="text-sm font-semibold text-gray-900">Delivery Address</h3>
                            </div>
                            <div className="text-sm text-gray-700 space-y-1">
                                <p className="font-semibold">{order.shipping_address.full_name}</p>
                                <p>{order.shipping_address.address_line1}</p>
                                {order.shipping_address.address_line2 && (
                                    <p>{order.shipping_address.address_line2}</p>
                                )}
                                <p>
                                    {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pin_code}
                                </p>
                                <p className="text-gray-600">Phone: {order.shipping_address.mobile}</p>
                            </div>
                        </div>
                    )}

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                            <div className="space-y-3">
                                {order.items.map((item: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">{item.product_name || item.name}</p>
                                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                        </div>
                                        <p className="font-semibold text-gray-900">
                                            {formatCurrency(item.price * item.quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Payment Details */}
                    {payment && (
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Payment ID:</span>
                                        <span className="font-mono text-gray-900">{payment.payment_id}</span>
                                    </div>
                                    {payment.method && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-700">Payment Method:</span>
                                            <span className="font-semibold text-gray-900 capitalize">{payment.method}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Status:</span>
                                        <span className="font-semibold text-green-600 capitalize">{payment.status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Next Steps */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Next?</h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                <span>You will receive an order confirmation email shortly</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                <span>We will notify you when your order is shipped</span>
                            </li>
                            <li className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                <span>You can track your order status in the Orders section</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Action Button */}
            <div className="mt-8 text-center">
                <button
                    onClick={onComplete}
                    className="px-8 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
                >
                    View My Orders
                </button>
            </div>
        </div>
    );
};
