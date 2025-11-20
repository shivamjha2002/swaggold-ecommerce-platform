import api from './api';
import { PaymentTransaction, PaymentTransactionFilters, PaginatedResponse } from '../types';

export const paymentTransactionService = {
    /**
     * Get all payment transactions with optional filters and pagination
     */
    getTransactions: async (filters?: PaymentTransactionFilters): Promise<PaginatedResponse<PaymentTransaction>> => {
        const response = await api.get<PaginatedResponse<PaymentTransaction>>('/admin/payments/transactions', { params: filters });
        return response.data;
    },

    /**
     * Get a single payment transaction by ID
     */
    getTransactionById: async (id: string): Promise<PaymentTransaction> => {
        const response = await api.get<{ success: boolean; data: PaymentTransaction }>(`/admin/payments/transactions/${id}`);
        return response.data.data;
    },
};
