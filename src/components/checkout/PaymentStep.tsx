import React, { useState } from 'react';
import { Address } from '../../services/addressService';
import { CreditCard, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { processPayment, retryPayment, openRazorpayModal, PaymentResult } from '../../services/payment';

interface PaymentStepProps {
    address: Address;
    onComplete: (paymentData: any) => void;
    onBack: () => void;
}

/**
 * PaymentStep component - Payment method selection and processing
 * 
 * Features:
 * - Razorpay payment integration
 * - Payment processing with loading states
 * - Success/failure handling
 * - Payment retry option
 * 
 * Requirements: 1.13.1, 1.13.3
 */
export const PaymentStep: React.FC<PaymentStepProps> = ({ address, onComplete, onBack }) => {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentMethod] = useState<'razorpay'>('razorpay');

    /**
     * Handle payment initiation
     */
    const handlePayment = async () => {
        setProcessing(true);
        setError(null);

        try {
            // Prepare checkout data
            const checkoutData = {
                shipping_address: {
                    full_name: address.full_name,
                    mobile: address.phone,
                    email: '', // Email will be fetched from user profile by backend
                    address_line1: address.address_line1,
                    address_line2: address.address_line2 || '',
                    city: address.city,
                    state: address.state,
                    pin_code: address.pincode,
                    landmark: '',
                },
                billing_is_same_as_shipping: true,
            };

            // Process payment
            await processPayment(
                checkoutData,
                // On success
                (result: PaymentResult) => {
                    console.log('Payment successful:', result);
                    setProcessing(false);
                    onComplete(result);
                },
                // On failure
                (errorMessage: string) => {
                    console.error('Payment failed:', errorMessage);
                    setProcessing(false);
                    setError(errorMessage);
                },
                // On modal dismiss
                () => {
                    console.log('Payment modal dismissed');
                    setProcessing(false);
                }
            );
        } catch (err: any) {
            console.error('Error initiating payment:', err);
            setProcessing(false);
            setError(err.message || 'Failed to initiate payment. Please try again.');
        }
    };

    /**
     * Handle payment retry
     */
    const handleRetry = () => {
        setError(null);
        handlePayment();
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
                <CreditCard className="h-6 w-6 text-yellow-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
            </div>

            {/* Selected Address Display */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Delivery Address:</h3>
                <p className="text-sm text-gray-700">{address.full_name}</p>
                <p className="text-sm text-gray-700">{address.address_line1}</p>
                {address.address_line2 && (
                    <p className="text-sm text-gray-700">{address.address_line2}</p>
                )}
                <p className="text-sm text-gray-700">
                    {address.city}, {address.state} - {address.pincode}
                </p>
                <p className="text-sm text-gray-600">Phone: {address.phone}</p>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Select Payment Method</h3>
                <div className="space-y-3">
                    <label
                        className={`
                            flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all
                            ${paymentMethod === 'razorpay'
                                ? 'border-yellow-600 bg-yellow-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }
                        `}
                    >
                        <input
                            type="radio"
                            name="payment-method"
                            value="razorpay"
                            checked={paymentMethod === 'razorpay'}
                            readOnly
                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500"
                        />
                        <div className="ml-3 flex-1">
                            <div className="flex items-center">
                                <CreditCard className="h-5 w-5 text-yellow-600 mr-2" />
                                <span className="font-semibold text-gray-900">Razorpay</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                Pay securely using Credit Card, Debit Card, UPI, Net Banking, or Wallets
                            </p>
                        </div>
                        {paymentMethod === 'razorpay' && (
                            <CheckCircle className="h-5 w-5 text-yellow-600" />
                        )}
                    </label>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-red-900 mb-1">
                                Payment Failed
                            </h4>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Information */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Secure Payment</p>
                        <p>
                            Your payment information is encrypted and secure.
                            You will be redirected to Razorpay's secure payment gateway.
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Back to Address
                </button>
                <button
                    onClick={error ? handleRetry : handlePayment}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {processing ? (
                        <>
                            <Loader className="animate-spin h-5 w-5 mr-2" />
                            Processing...
                        </>
                    ) : error ? (
                        'Retry Payment'
                    ) : (
                        'Proceed to Pay'
                    )}
                </button>
            </div>

            {/* Processing Overlay */}
            {processing && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                        <Loader className="animate-spin h-5 w-5 text-yellow-600 mr-3" />
                        <div className="text-sm text-yellow-900">
                            <p className="font-semibold">Processing your payment...</p>
                            <p className="text-yellow-700">
                                Please do not close this window or press the back button.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
