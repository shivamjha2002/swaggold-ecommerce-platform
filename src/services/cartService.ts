import api from './api';
import { ApiResponse } from '../types';

export interface CartItem {
    product_id: string;
    product_name: string;
    variant_id?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    image_url?: string;
    weight?: number;
    gold_purity?: string;
}

export interface Cart {
    id: string;
    user_id?: string;
    session_id?: string;
    items: CartItem[];
    subtotal: number;
    last_updated: string;
}

export interface CartTotals {
    subtotal: number;
    gst_rate: number;
    gst_amount: number;
    shipping_amount: number;
    discount_amount: number;
    total: number;
    item_count: number;
}

export interface CartResponse {
    cart: Cart;
    totals: CartTotals;
}

export interface AddToCartRequest {
    product_id: string;
    quantity: number;
    variant_id?: string;
    session_id?: string;
}

export interface UpdateCartRequest {
    product_id: string;
    quantity: number;
    variant_id?: string;
    session_id?: string;
}

class CartService {
    private getSessionId(): string {
        let sessionId = localStorage.getItem('cart_session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('cart_session_id', sessionId);
        }
        return sessionId;
    }

    async getCart(): Promise<ApiResponse<CartResponse>> {
        try {
            const sessionId = this.getSessionId();
            const response = await api.get<ApiResponse<CartResponse>>('/cart', {
                params: { session_id: sessionId }
            });
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    async addToCart(productId: string, quantity: number, variantId?: string): Promise<ApiResponse<CartResponse>> {
        try {
            const sessionId = this.getSessionId();
            const response = await api.post<ApiResponse<CartResponse>>('/cart', {
                product_id: productId,
                quantity,
                variant_id: variantId,
                session_id: sessionId
            });
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    async updateQuantity(productId: string, quantity: number, variantId?: string): Promise<ApiResponse<CartResponse>> {
        try {
            const sessionId = this.getSessionId();
            const response = await api.put<ApiResponse<CartResponse>>('/cart/update', {
                product_id: productId,
                quantity,
                variant_id: variantId,
                session_id: sessionId
            });
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    async removeItem(productId: string, variantId?: string): Promise<ApiResponse<CartResponse>> {
        try {
            const sessionId = this.getSessionId();
            const params: any = { session_id: sessionId };
            if (variantId) {
                params.variant_id = variantId;
            }
            const response = await api.delete<ApiResponse<CartResponse>>(`/cart/${productId}`, {
                params
            });
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    async clearCart(): Promise<ApiResponse<CartResponse>> {
        try {
            const sessionId = this.getSessionId();
            const response = await api.delete<ApiResponse<CartResponse>>('/cart', {
                params: { session_id: sessionId }
            });
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    async syncGuestCart(): Promise<ApiResponse<CartResponse>> {
        try {
            const sessionId = this.getSessionId();
            const response = await api.post<ApiResponse<CartResponse>>('/cart/sync', {
                session_id: sessionId
            });
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }
}

export const cartService = new CartService();
