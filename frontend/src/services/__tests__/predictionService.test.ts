import { describe, it, expect, beforeEach, vi } from 'vitest';
import { predictionService } from '../predictionService';
import api from '../api';

// Mock the api module
vi.mock('../api');

describe('Prediction Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('predictGoldPrice', () => {
    it('should predict gold price for a future date', async () => {
      const request = {
        date: '2025-12-01',
        weight_grams: 10,
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            date: '2025-12-01',
            predicted_price_per_gram: 6850,
            total_price: 68500,
            confidence_interval: {
              lower: 6720,
              upper: 6980,
            },
            model_accuracy: 0.94,
            last_trained: '2025-11-10T08:00:00Z',
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await predictionService.predictGoldPrice(request);

      expect(api.post).toHaveBeenCalledWith('/predictions/gold', request);
      expect(result.success).toBe(true);
      expect(result.data.predicted_price_per_gram).toBe(6850);
    });
  });

  describe('predictDiamondPrice', () => {
    it('should predict diamond price based on 4Cs', async () => {
      const request = {
        carat: 1.5,
        cut: 'Ideal',
        color: 'E',
        clarity: 'VS1',
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            predicted_price: 450000,
            confidence_interval: {
              lower: 425000,
              upper: 475000,
            },
            features_used: request,
            model_accuracy: 0.91,
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await predictionService.predictDiamondPrice(request);

      expect(api.post).toHaveBeenCalledWith('/predictions/diamond', request);
      expect(result.success).toBe(true);
      expect(result.data.predicted_price).toBe(450000);
    });
  });

  describe('getGoldPriceTrends', () => {
    it('should fetch gold price trends', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              date: '2025-11-01',
              price: 6500,
              moving_average_7: 6480,
              moving_average_30: 6450,
            },
            {
              date: '2025-11-02',
              price: 6520,
              moving_average_7: 6490,
              moving_average_30: 6455,
            },
          ],
        },
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await predictionService.getGoldPriceTrends(30);

      expect(api.get).toHaveBeenCalledWith('/predictions/trends?days=30&metal=gold');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('getCurrentGoldPrice', () => {
    it('should fetch current gold price', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            price_per_gram: 6800,
            date: '2025-11-14',
            purity: '916',
          },
        },
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await predictionService.getCurrentGoldPrice();

      expect(api.get).toHaveBeenCalledWith('/prices/gold/current');
      expect(result.success).toBe(true);
      expect(result.data.price_per_gram).toBe(6800);
    });
  });

  describe('addGoldPrice', () => {
    it('should add new gold price data', async () => {
      const priceData = {
        date: '2025-11-14',
        price_per_gram: 6800,
        purity: '916',
        source: 'manual',
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            message: 'Gold price added successfully',
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await predictionService.addGoldPrice(priceData);

      expect(api.post).toHaveBeenCalledWith('/prices/gold', priceData);
      expect(result.success).toBe(true);
    });
  });

  describe('retrainModels', () => {
    it('should trigger model retraining', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            message: 'Model retrained successfully',
            metrics: {
              r2_score: 0.95,
              rmse: 45.2,
            },
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await predictionService.retrainModels('gold');

      expect(api.post).toHaveBeenCalledWith('/predictions/retrain', {
        model_type: 'gold',
      });
      expect(result.success).toBe(true);
    });
  });
});
