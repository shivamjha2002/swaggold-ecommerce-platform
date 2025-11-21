import api from './api';
import {
  GoldPredictionRequest,
  GoldPrediction,
  DiamondPredictionRequest,
  DiamondPrediction,
  PriceTrend,
  ApiResponse,
} from '../types';

export const predictionService = {
  /**
   * Predict gold price for a future date
   */
  predictGoldPrice: async (
    data: GoldPredictionRequest
  ): Promise<ApiResponse<GoldPrediction>> => {
    const response = await api.post<ApiResponse<GoldPrediction>>(
      '/predictions/gold',
      data
    );
    return response.data;
  },

  /**
   * Predict diamond price based on 4Cs
   */
  predictDiamondPrice: async (
    data: DiamondPredictionRequest
  ): Promise<ApiResponse<DiamondPrediction>> => {
    const response = await api.post<ApiResponse<DiamondPrediction>>(
      '/predictions/diamond',
      data
    );
    return response.data;
  },

  /**
   * Get price trends for gold
   */
  getGoldPriceTrends: async (days = 30): Promise<ApiResponse<PriceTrend[]>> => {
    const response = await api.get<ApiResponse<PriceTrend[]>>(
      `/predictions/trends?days=${days}&metal=gold`
    );
    return response.data;
  },

  /**
   * Get historical gold prices
   */
  getGoldPriceHistory: async (
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<PriceTrend[]>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get<ApiResponse<PriceTrend[]>>(
      `/prices/gold/history?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Add new gold price data (admin only)
   */
  addGoldPrice: async (data: {
    date: string;
    price_per_gram: number;
    purity?: string;
    source?: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/prices/gold',
      data
    );
    return response.data;
  },

  /**
   * Add new diamond price data (admin only)
   */
  addDiamondPrice: async (data: {
    carat: number;
    cut: string;
    color: string;
    clarity: string;
    price: number;
    date: string;
    source?: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/prices/diamond',
      data
    );
    return response.data;
  },

  /**
   * Trigger model retraining (admin only)
   */
  retrainModels: async (modelType?: 'gold' | 'diamond'): Promise<ApiResponse<{
    message: string;
    metrics: Record<string, number>;
  }>> => {
    const response = await api.post<ApiResponse<{
      message: string;
      metrics: Record<string, number>;
    }>>('/predictions/retrain', { model_type: modelType });
    return response.data;
  },

  /**
   * Get current gold price
   */
  getCurrentGoldPrice: async (): Promise<ApiResponse<{
    price_per_gram: number;
    date: string;
    purity: string;
  }>> => {
    const response = await api.get<ApiResponse<{
      price_per_gram: number;
      date: string;
      purity: string;
    }>>('/prices/gold/current');
    return response.data;
  },
};
