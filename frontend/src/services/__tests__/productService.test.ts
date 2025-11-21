import { describe, it, expect, beforeEach, vi } from 'vitest';
import { productService } from '../productService';
import api from '../api';

// Mock the api module
vi.mock('../api');

describe('Product Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should fetch products with filters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: '1',
              name: 'Gold Necklace',
              category: 'Necklace',
              base_price: 50000,
              current_price: 52000,
              weight: 10,
              gold_purity: '916',
              description: 'Beautiful necklace',
              image_url: 'test.jpg',
              stock_quantity: 5,
              is_active: true,
              created_at: '2025-01-01',
            },
          ],
          pagination: {
            page: 1,
            per_page: 20,
            total: 1,
            pages: 1,
          },
        },
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await productService.getProducts({
        category: 'Necklace',
        page: 1,
      });

      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/products'));
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getProductById', () => {
    it('should fetch a single product by ID', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            name: 'Gold Necklace',
            category: 'Necklace',
            base_price: 50000,
            current_price: 52000,
            weight: 10,
            gold_purity: '916',
            description: 'Beautiful necklace',
            image_url: 'test.jpg',
            stock_quantity: 5,
            is_active: true,
            created_at: '2025-01-01',
          },
        },
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await productService.getProductById('1');

      expect(api.get).toHaveBeenCalledWith('/products/1');
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('1');
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: 'Gold Ring',
        category: 'Ring',
        base_price: 25000,
        weight: 5,
        gold_purity: '916',
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '2',
            ...newProduct,
            current_price: 26000,
            stock_quantity: 0,
            is_active: true,
            created_at: '2025-01-01',
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await productService.createProduct(newProduct);

      expect(api.post).toHaveBeenCalledWith('/products', newProduct);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Gold Ring');
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const updates = {
        base_price: 30000,
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            name: 'Gold Ring',
            category: 'Ring',
            base_price: 30000,
            current_price: 31000,
            weight: 5,
            gold_purity: '916',
            stock_quantity: 0,
            is_active: true,
            created_at: '2025-01-01',
          },
        },
      };

      vi.mocked(api.put).mockResolvedValue(mockResponse);

      const result = await productService.updateProduct('1', updates);

      expect(api.put).toHaveBeenCalledWith('/products/1', updates);
      expect(result.success).toBe(true);
      expect(result.data.base_price).toBe(30000);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            message: 'Product deleted successfully',
          },
        },
      };

      vi.mocked(api.delete).mockResolvedValue(mockResponse);

      const result = await productService.deleteProduct('1');

      expect(api.delete).toHaveBeenCalledWith('/products/1');
      expect(result.success).toBe(true);
    });
  });
});
