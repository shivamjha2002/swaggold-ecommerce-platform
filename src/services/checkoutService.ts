import api from './api';
import { ApiResponse } from '../types';

export interface ShippingAddress {
    full_name: string;
    mobile: string;
    email?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pin_code: string;
    landmark?: string;
    preferred_delivery_date?: string;
}

export interface CheckoutRequest {
    shipping_address: ShippingAddress;
    billing_address?: ShippingAddress;
    custom_fields?: Record<string, any>;
    billing_is_same_as_shipping: boolean;
    session_id?: string;
    notes?: string;
}

export interface OrderResponse {
    order_id: string;
    razorpay_order_id: string;
    amount: number;
    currency: string;
    key_id: string;
}

export interface PaymentVerificationRequest {
    order_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface PaymentVerificationResponse {
    success: boolean;
    order: {
        id: string;
        order_number: string;
        status: string;
        total_amount: number;
    };
}

class CheckoutService {
    async createOrder(checkoutData: CheckoutRequest): Promise<ApiResponse<OrderResponse>> {
        try {
            const response = await api.post<ApiResponse<OrderResponse>>('/checkout/create-order', checkoutData);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    async verifyPayment(verificationData: PaymentVerificationRequest): Promise<ApiResponse<PaymentVerificationResponse>> {
        try {
            const response = await api.post<ApiResponse<PaymentVerificationResponse>>('/checkout/verify', verificationData);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    async retryPayment(orderId: string): Promise<ApiResponse<OrderResponse>> {
        try {
            const response = await api.post<ApiResponse<OrderResponse>>(`/checkout/retry/${orderId}`);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }
}

export const checkoutService = new CheckoutService();
