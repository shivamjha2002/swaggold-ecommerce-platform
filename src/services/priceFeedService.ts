import api from './api';
import { PriceFeed } from '../types';

export const priceFeedService = {
    /**
     * Get current price for a specific symbol
     */
    getPrice: async (symbol: string): Promise<PriceFeed> => {
        const response = await api.get<{ success: boolean; data: PriceFeed }>(`/market-price`, {
            params: { symbol }
        });
        return response.data.data;
    },

    /**
     * Get all configured prices (admin only)
     */
    getAllPrices: async (): Promise<PriceFeed[]> => {
        const response = await api.get<{ success: boolean; data: PriceFeed[] }>('/admin/prices');
        return response.data.data;
    },

    /**
     * Force refresh all prices (admin only)
     */
    refreshPrices: async (): Promise<PriceFeed[]> => {
        const response = await api.post<{ success: boolean; data: PriceFeed[] }>('/admin/prices/refresh');
        return response.data.data;
    },

    /**
     * Convert USD to INR
     */
    convertUsdToInr: (usdAmount: number, exchangeRate: number = 83.0): number => {
        return usdAmount * exchangeRate;
    },
};
