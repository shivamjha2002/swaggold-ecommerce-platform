import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShippingAddressForm, ShippingAddressFormHandle } from '../components/checkout/ShippingAddressForm';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { RazorpayCheckout } from '../components/checkout/RazorpayCheckout';
import { checkoutService, ShippingAddress } from '../services/checkoutService';
import { ShoppingBag, ArrowLeft, Truck, CreditCard, CheckCircle } from 'lucide-react';

const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const {
        items,
        subtotal,
        gstAmount,
        shippingAmount,
        discountAmount,
        totalAmount,
        itemCount,
        loading: cartLoading,
        fetchCart,
        clearCart
    } = useCart();

    const [billingIsSameAsShipping, setBillingIsSameAsShipping] = useState(true);
    const [customFields, setCustomFields] = useState<Record<string, any>>({});
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentData, setPaymentData] = useState<{
        orderId: string;
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
    } | null>(null);
    const [orderSuccess, setOrderSuccess] = useState<{
        orderId: string;
        orderNumber: string;
    } | null>(null);
    const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);

    const shippingFormRef = useRef<ShippingAddressFormHandle>(null);
    const billingFormRef = useRef<ShippingAddressFormHandle>(null);

    // fetchCart is already called in CartContext on mount
    // No need to call it again here

    // Redirect if cart is empty
    useEffect(() => {
        if (!cartLoading && items.length === 0) {
            navigate('/cart');
        }
    }, [items, cartLoading, navigate]);

    const handleShippingSubmit = (address: ShippingAddress) => {
        // This will be called when the form is valid
        // We'll handle the actual submission in handlePlaceOrder
    };

    const handleBillingSubmit = (address: ShippingAddress) => {
        // This will be called when the form is valid
        // We'll handle the actual submission in handlePlaceOrder
    };

    const handlePlaceOrder = async () => {
        setError(null);
        setProcessing(true);

        try {
            // Get and validate shipping address
            const shippingForm = shippingFormRef.current;
            if (!shippingForm) {
                throw new Error('Shipping form not found');
            }

            const shippingAddr = shippingForm.getFormData();
            if (!shippingAddr) {
                throw new Error('Please fill in all required shipping address fields');
            }

            // Store shipping address for retry
            setShippingAddress(shippingAddr);

            // Get and validate billing address if different
            let billingAddress: ShippingAddress | undefined;
            if (!billingIsSameAsShipping) {
                const billingForm = billingFormRef.current;
                if (!billingForm) {
                    throw new Error('Billing form not found');
                }

                billingAddress = billingForm.getFormData();
                if (!billingAddress) {
                    throw new Error('Please fill in all required billing address fields');
                }
            }

            // Get session_id from localStorage for guest users
            let sessionId = localStorage.getItem('cart_session_id');

            // Generate session_id if not exists
            if (!sessionId) {
                sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem('cart_session_id', sessionId);
            }

            // Sync localStorage cart to backend before creating order
            if (items.length > 0) {
                try {
                    console.log('Syncing cart to backend...', { itemCount: items.length, sessionId });

                    // Clear backend cart first
                    const { cartService } = await import('../services/cartService');
                    try {
                        await cartService.clearCart();
                    } catch (clearError) {
                        console.log('Cart already empty or error clearing:', clearError);
                    }

                    // Add each item to backend cart
                    for (const item of items) {
                        try {
                            console.log('Adding item to backend cart:', {
                                productId: item.product.id,
                                quantity: item.quantity
                            });

                            await cartService.addToCart(item.product.id, item.quantity);
                        } catch (itemError: any) {
                            console.error('Failed to add item to cart:', item.product.name, itemError);
                            // Continue with other items
                        }
                    }
                    console.log('Cart synced to backend successfully');
                } catch (syncError) {
                    console.error('Error syncing cart:', syncError);
                    throw new Error('Failed to sync cart. Please try again.');
                }
            } else {
                throw new Error('Cart is empty. Please add items before checkout.');
            }

            // Clean up addresses - remove empty email if not provided
            const cleanAddress = (addr: ShippingAddress) => {
                const cleaned = { ...addr };
                if (!cleaned.email || cleaned.email.trim() === '') {
                    delete (cleaned as any).email;
                }
                if (!cleaned.address_line2 || cleaned.address_line2.trim() === '') {
                    delete (cleaned as any).address_line2;
                }
                if (!cleaned.landmark || cleaned.landmark.trim() === '') {
                    delete (cleaned as any).landmark;
                }
                if (!cleaned.preferred_delivery_date || cleaned.preferred_delivery_date.trim() === '') {
                    delete (cleaned as any).preferred_delivery_date;
                }
                return cleaned;
            };

            const cleanedShippingAddr = cleanAddress(shippingAddr);
            const cleanedBillingAddr = billingAddress ? cleanAddress(billingAddress) : undefined;

            // Prepare checkout data
            const checkoutData = {
                shipping_address: cleanedShippingAddr,
                billing_address: cleanedBillingAddr,
                custom_fields: Object.keys(customFields).length > 0 ? customFields : undefined,
                billing_is_same_as_shipping: billingIsSameAsShipping,
                session_id: sessionId
            };

            // Log the data being sent for debugging
            console.log('Creating order with data:', {
                ...checkoutData,
                shipping_address: {
                    ...checkoutData.shipping_address,
                    mobile: checkoutData.shipping_address.mobile?.length + ' digits',
                    pin_code: checkoutData.shipping_address.pin_code?.length + ' digits'
                }
            });

            // Create order
            const response = await checkoutService.createOrder(checkoutData);

            if (response.success && response.data) {
                console.log('Order created successfully:', response.data);

                // Set payment data to trigger Razorpay checkout
                setPaymentData({
                    orderId: response.data.order_id,
                    razorpayOrderId: response.data.razorpay_order_id,
                    amount: response.data.amount,
                    currency: response.data.currency,
                    keyId: response.data.key_id
                });
            }
        } catch (err: any) {
            console.error('Checkout error:', err);

            // Extract detailed error information
            const errorResponse = err.response?.data?.error;
            let errorMessage = 'Failed to create order';

            if (errorResponse) {
                errorMessage = errorResponse.message || errorMessage;

                // Log detailed validation errors if present
                if (errorResponse.details) {
                    console.error('Validation errors:', errorResponse.details);

                    // If details is an object with field-specific errors, format them
                    if (typeof errorResponse.details === 'object' && !Array.isArray(errorResponse.details)) {
                        const fieldErrors = Object.entries(errorResponse.details)
                            .map(([field, error]) => `${field}: ${error}`)
                            .join(', ');
                        errorMessage = `${errorMessage} - ${fieldErrors}`;
                    } else if (typeof errorResponse.details === 'string') {
                        errorMessage = `${errorMessage} - ${errorResponse.details}`;
                    }
                }
            } else {
                errorMessage = err.message || errorMessage;
            }

            setError(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    const handlePaymentSuccess = async (orderId: string, orderNumber: string) => {
        console.log('Payment successful for order:', orderNumber);
        setOrderSuccess({ orderId, orderNumber });

        // Clear cart after successful payment
        try {
            await clearCart();
        } catch (err) {
            console.error('Failed to clear cart:', err);
        }
    };

    const handlePaymentFailure = (error: string) => {
        console.error('Payment failed:', error);
        setError(error);
        setPaymentData(null);
    };

    const handlePaymentRetry = async () => {
        if (!paymentData) {
            setError('No payment data available for retry');
            return;
        }

        setError(null);
        setProcessing(true);

        try {
            console.log('Retrying payment for order:', paymentData.orderId);

            const response = await checkoutService.retryPayment(paymentData.orderId);

            if (response.success && response.data) {
                console.log('Retry order created:', response.data);

                // Update payment data with new Razorpay order ID
                setPaymentData({
                    orderId: response.data.order_id,
                    razorpayOrderId: response.data.razorpay_order_id,
                    amount: response.data.amount,
                    currency: response.data.currency,
                    keyId: response.data.key_id
                });
            }
        } catch (err: any) {
            console.error('Retry error:', err);
            const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to retry payment';
            setError(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    if (cartLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading checkout...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return null; // Will redirect to cart
    }

    // Show order success page
    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <div className="mb-6">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Order Placed Successfully!
                        </h1>
                        <p className="text-lg text-gray-600 mb-2">
                            Thank you for your purchase
                        </p>
                        <p className="text-gray-500 mb-8">
                            Order Number: <span className="font-semibold text-gray-900">{orderSuccess.orderNumber}</span>
                        </p>
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                We've received your order and will start processing it shortly.
                                You'll receive a confirmation email with order details.
                            </p>
                            <div className="flex gap-4 justify-center mt-8">
                                <button
                                    onClick={() => navigate('/orders')}
                                    className="bg-yellow-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-yellow-700 transition-colors"
                                >
                                    View Orders
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="bg-gray-200 text-gray-700 font-semibold py-3 px-8 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/cart')}
                        className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-semibold mb-4"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back to Cart
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                    <p className="text-gray-600 mt-2">
                        Complete your order by providing shipping details
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Forms */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Shipping Address Section */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center mb-6">
                                <Truck className="h-6 w-6 text-yellow-600 mr-3" />
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Shipping Address
                                </h2>
                            </div>
                            <ShippingAddressForm
                                ref={shippingFormRef}
                                onSubmit={handleShippingSubmit}
                                disabled={processing}
                            />
                        </div>

                        {/* Billing Address Section */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center mb-6">
                                <CreditCard className="h-6 w-6 text-yellow-600 mr-3" />
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Billing Address
                                </h2>
                            </div>

                            <div className="mb-4">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={billingIsSameAsShipping}
                                        onChange={(e) => setBillingIsSameAsShipping(e.target.checked)}
                                        disabled={processing}
                                        className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                                    />
                                    <span className="text-gray-700 font-medium">
                                        Billing address is same as shipping address
                                    </span>
                                </label>
                            </div>

                            {!billingIsSameAsShipping && (
                                <ShippingAddressForm
                                    ref={billingFormRef}
                                    onSubmit={handleBillingSubmit}
                                    disabled={processing}
                                />
                            )}
                        </div>

                        {/* Custom Fields Section (if needed) */}
                        {/* This can be expanded based on product requirements */}
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <OrderSummary
                                items={items}
                                subtotal={subtotal}
                                gstAmount={gstAmount}
                                shippingAmount={shippingAmount}
                                discountAmount={discountAmount}
                                total={totalAmount}
                            />

                            {/* Place Order Button */}
                            <button
                                onClick={handlePlaceOrder}
                                disabled={processing || items.length === 0}
                                className="w-full mt-6 bg-yellow-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {processing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="mr-2 h-5 w-5" />
                                        Place Order
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-500 text-center mt-4">
                                By placing your order, you agree to our terms and conditions
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Razorpay Checkout Modal */}
            {paymentData && !orderSuccess && (
                <RazorpayCheckout
                    orderId={paymentData.orderId}
                    razorpayOrderId={paymentData.razorpayOrderId}
                    amount={paymentData.amount}
                    currency={paymentData.currency}
                    keyId={paymentData.keyId}
                    customerName={shippingAddress?.full_name}
                    customerEmail={shippingAddress?.email}
                    customerPhone={shippingAddress?.mobile}
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                    onRetry={handlePaymentRetry}
                />
            )}
        </div>
    );
};

export default Checkout;
