import React, { useEffect, useState } from 'react';
import { checkoutService, PaymentVerificationRequest } from '../../services/checkoutService';

// Razorpay types
interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpaySuccessResponse) => void;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
        color?: string;
    };
    modal?: {
        ondismiss?: () => void;
    };
}

interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface RazorpayInstance {
    open: () => void;
    on: (event: string, handler: (response: any) => void) => void;
}

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayCheckoutProps {
    orderId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    onSuccess: (orderId: string, orderNumber: string) => void;
    onFailure: (error: string) => void;
    onRetry?: () => void;
}

export const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
    orderId,
    razorpayOrderId,
    amount,
    currency,
    keyId,
    customerName,
    customerEmail,
    customerPhone,
    onSuccess,
    onFailure,
    onRetry
}) => {
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load Razorpay script dynamically
    useEffect(() => {
        const loadRazorpayScript = () => {
            return new Promise<boolean>((resolve) => {
                // Check if script is already loaded
                if (window.Razorpay) {
                    resolve(true);
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.async = true;
                script.onload = () => {
                    console.log('Razorpay script loaded successfully');
                    resolve(true);
                };
                script.onerror = () => {
                    console.error('Failed to load Razorpay script');
                    resolve(false);
                };
                document.body.appendChild(script);
            });
        };

        loadRazorpayScript().then((loaded) => {
            setScriptLoaded(loaded);
            if (!loaded) {
                setError('Failed to load payment gateway. Please refresh and try again.');
            }
        });
    }, []);

    const handlePaymentSuccess = async (response: RazorpaySuccessResponse) => {
        setLoading(true);
        setError(null);

        try {
            console.log('Payment successful, verifying...', response);

            const verificationData: PaymentVerificationRequest = {
                order_id: orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
            };

            const verificationResponse = await checkoutService.verifyPayment(verificationData);

            if (verificationResponse.success && verificationResponse.data) {
                console.log('Payment verified successfully');
                onSuccess(
                    verificationResponse.data.order.id,
                    verificationResponse.data.order.order_number
                );
            } else {
                throw new Error('Payment verification failed');
            }
        } catch (err: any) {
            console.error('Payment verification error:', err);
            const errorMessage = err.response?.data?.error?.message ||
                err.message ||
                'Payment verification failed. Please contact support.';
            setError(errorMessage);
            onFailure(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentFailure = (error: any) => {
        console.error('Payment failed:', error);
        const errorMessage = error.description ||
            error.reason ||
            'Payment failed. Please try again.';
        setError(errorMessage);
        onFailure(errorMessage);
    };

    const openRazorpayCheckout = () => {
        if (!scriptLoaded || !window.Razorpay) {
            setError('Payment gateway not loaded. Please refresh the page.');
            return;
        }

        setError(null);

        const options: RazorpayOptions = {
            key: keyId,
            amount: amount, // Amount in paise
            currency: currency,
            name: 'Swati Jewellers',
            description: 'Order Payment',
            order_id: razorpayOrderId,
            handler: handlePaymentSuccess,
            prefill: {
                name: customerName,
                email: customerEmail,
                contact: customerPhone
            },
            notes: {
                order_id: orderId
            },
            theme: {
                color: '#D97706' // Yellow-600 to match the theme
            },
            modal: {
                ondismiss: () => {
                    console.log('Payment modal closed by user');
                    setError('Payment cancelled. You can retry the payment.');
                    if (onRetry) {
                        // Don't call onFailure here, just show the retry option
                    }
                }
            }
        };

        try {
            const razorpayInstance = new window.Razorpay(options);

            // Handle payment failure event
            razorpayInstance.on('payment.failed', handlePaymentFailure);

            // Open the checkout
            razorpayInstance.open();
        } catch (err: any) {
            console.error('Error opening Razorpay checkout:', err);
            setError('Failed to open payment gateway. Please try again.');
            onFailure('Failed to open payment gateway');
        }
    };

    // Auto-open checkout when script is loaded
    useEffect(() => {
        if (scriptLoaded && !loading && !error) {
            openRazorpayCheckout();
        }
    }, [scriptLoaded]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Verifying Payment
                        </h3>
                        <p className="text-gray-600">
                            Please wait while we verify your payment...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && onRetry) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="mb-4">
                            <svg
                                className="mx-auto h-12 w-12 text-red-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Payment Issue
                        </h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={onRetry}
                                className="flex-1 bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-yellow-700 transition-colors"
                            >
                                Retry Payment
                            </button>
                            <button
                                onClick={() => window.location.href = '/orders'}
                                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                View Orders
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
