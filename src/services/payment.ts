/**
 * Payment Service - Razorpay Integration
 * 
 * Handles payment processing with Razorpay payment gateway
 * 
 * Features:
 * - Create Razorpay order
 * - Open Razorpay payment modal
 * - Handle payment success/failure callbacks
 * - Verify payment with backend
 * 
 * Requirements: 1.13.1, 1.13.3
 */

import api from './api';

// Razorpay types
interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    image?: string;
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
    open(): void;
    on(event: string, callback: (response: any) => void): void;
}

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

// Payment order data from backend
export interface PaymentOrderData {
    order_id: string;
    order_number: string;
    razorpay_order_id: string;
    amount: number;
    currency: string;
    key_id: string;
    customer: {
        name: string;
        email: string;
        contact: string;
    };
}

// Payment verification data
export interface PaymentVerificationData {
    order_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

// Payment result
export interface PaymentResult {
    success: boolean;
    order?: any;
    payment?: any;
    error?: string;
}

/**
 * Create order and get Razorpay order details
 */
export const createPaymentOrder = async (checkoutData: {
    shipping_address: any;
    billing_address?: any;
    billing_is_same_as_shipping?: boolean;
    notes?: string;
}): Promise<PaymentOrderData> => {
    try {
        const response = await api.post('/checkout/create-order', checkoutData);

        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error(response.data.error?.message || 'Failed to create order');
        }
    } catch (error: any) {
        console.error('Error creating payment order:', error);
        throw new Error(
            error.response?.data?.error?.message ||
            error.message ||
            'Failed to create payment order'
        );
    }
};

/**
 * Verify payment with backend
 */
export const verifyPayment = async (
    verificationData: PaymentVerificationData
): Promise<PaymentResult> => {
    try {
        const response = await api.post('/checkout/verify', verificationData);

        if (response.data.success) {
            return {
                success: true,
                order: response.data.data.order,
                payment: response.data.data.payment,
            };
        } else {
            return {
                success: false,
                error: response.data.error?.message || 'Payment verification failed',
            };
        }
    } catch (error: any) {
        console.error('Error verifying payment:', error);
        return {
            success: false,
            error: error.response?.data?.error?.message ||
                error.message ||
                'Failed to verify payment',
        };
    }
};

/**
 * Retry payment for a failed order
 */
export const retryPayment = async (orderId: string): Promise<PaymentOrderData> => {
    try {
        const response = await api.post(`/checkout/retry/${orderId}`);

        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error(response.data.error?.message || 'Failed to retry payment');
        }
    } catch (error: any) {
        console.error('Error retrying payment:', error);
        throw new Error(
            error.response?.data?.error?.message ||
            error.message ||
            'Failed to retry payment'
        );
    }
};

/**
 * Open Razorpay payment modal
 * 
 * @param orderData - Payment order data from backend
 * @param onSuccess - Callback for successful payment
 * @param onFailure - Callback for payment failure
 * @param onDismiss - Callback when modal is dismissed
 */
export const openRazorpayModal = (
    orderData: PaymentOrderData,
    onSuccess: (response: RazorpaySuccessResponse) => void,
    onFailure: (error: any) => void,
    onDismiss?: () => void
): void => {
    // Check if Razorpay script is loaded
    if (!window.Razorpay) {
        console.error('Razorpay script not loaded');
        onFailure(new Error('Payment gateway not available. Please refresh the page.'));
        return;
    }

    const options: RazorpayOptions = {
        key: orderData.key_id,
        amount: orderData.amount * 100, // Convert to paise
        currency: orderData.currency,
        name: 'Swati Jewellers',
        description: `Order #${orderData.order_number}`,
        image: '/images/favicon.png', // Your logo
        order_id: orderData.razorpay_order_id,
        handler: (response: RazorpaySuccessResponse) => {
            console.log('Payment successful:', response);
            onSuccess(response);
        },
        prefill: {
            name: orderData.customer.name,
            email: orderData.customer.email,
            contact: orderData.customer.contact,
        },
        notes: {
            order_id: orderData.order_id,
            order_number: orderData.order_number,
        },
        theme: {
            color: '#FFD700', // Gold color matching your brand
        },
        modal: {
            ondismiss: () => {
                console.log('Payment modal dismissed');
                if (onDismiss) {
                    onDismiss();
                }
            },
        },
    };

    try {
        const razorpay = new window.Razorpay(options);

        // Handle payment failure
        razorpay.on('payment.failed', (response: any) => {
            console.error('Payment failed:', response);
            onFailure(response.error);
        });

        // Open the payment modal
        razorpay.open();
    } catch (error) {
        console.error('Error opening Razorpay modal:', error);
        onFailure(error);
    }
};

/**
 * Process complete payment flow
 * 
 * @param checkoutData - Checkout data including address
 * @param onSuccess - Callback for successful payment
 * @param onFailure - Callback for payment failure
 * @param onDismiss - Callback when modal is dismissed
 */
export const processPayment = async (
    checkoutData: {
        shipping_address: any;
        billing_address?: any;
        billing_is_same_as_shipping?: boolean;
        notes?: string;
    },
    onSuccess: (result: PaymentResult) => void,
    onFailure: (error: string) => void,
    onDismiss?: () => void
): Promise<void> => {
    try {
        // Step 1: Create order and get Razorpay order details
        const orderData = await createPaymentOrder(checkoutData);

        // Step 2: Open Razorpay payment modal
        openRazorpayModal(
            orderData,
            // On payment success
            async (razorpayResponse: RazorpaySuccessResponse) => {
                try {
                    // Step 3: Verify payment with backend
                    const verificationData: PaymentVerificationData = {
                        order_id: orderData.order_id,
                        razorpay_order_id: razorpayResponse.razorpay_order_id,
                        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                        razorpay_signature: razorpayResponse.razorpay_signature,
                    };

                    const result = await verifyPayment(verificationData);

                    if (result.success) {
                        onSuccess(result);
                    } else {
                        onFailure(result.error || 'Payment verification failed');
                    }
                } catch (error: any) {
                    console.error('Error verifying payment:', error);
                    onFailure(error.message || 'Failed to verify payment');
                }
            },
            // On payment failure
            (error: any) => {
                const errorMessage = error?.description ||
                    error?.message ||
                    'Payment failed. Please try again.';
                onFailure(errorMessage);
            },
            // On modal dismiss
            onDismiss
        );
    } catch (error: any) {
        console.error('Error processing payment:', error);
        onFailure(error.message || 'Failed to process payment');
    }
};

export default {
    createPaymentOrder,
    verifyPayment,
    retryPayment,
    openRazorpayModal,
    processPayment,
};
