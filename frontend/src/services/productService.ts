import api from './api';
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilters,
  ApiResponse,
  PaginatedResponse,
} from '../types';
import { cache } from '../utils/cache';

// Cache TTL: 5 minutes (300000 ms)
const CACHE_TTL = 300000;

export const productService = {
  /**
   * Get all products with optional filters and pagination (public endpoint - only published)
   * Results are cached for 5 minutes
   */
  getProducts: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.price_min) params.append('price_min', filters.price_min.toString());
      if (filters.price_max) params.append('price_max', filters.price_max.toString());
      if (filters.weight_min) params.append('weight_min', filters.weight_min.toString());
      if (filters.weight_max) params.append('weight_max', filters.weight_max.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
    }
    
    const queryString = params.toString();
    const cacheKey = `products:${queryString}`;
    
    // Check cache first
    const cachedData = cache.get<PaginatedResponse<Product>>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Fetch from API if not in cache
    const response = await api.get<PaginatedResponse<Product>>(
      `/products?${queryString}`
    );
    
    // Store in cache
    cache.set(cacheKey, response.data, CACHE_TTL);
    
    return response.data;
  },

  /**
   * Get all products including drafts (admin only)
   * Results are cached for 5 minutes
   */
  getAdminProducts: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.price_min) params.append('price_min', filters.price_min.toString());
      if (filters.price_max) params.append('price_max', filters.price_max.toString());
      if (filters.weight_min) params.append('weight_min', filters.weight_min.toString());
      if (filters.weight_max) params.append('weight_max', filters.weight_max.toString());
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
    }
    
    const queryString = params.toString();
    const cacheKey = `admin-products:${queryString}`;
    
    // Check cache first
    const cachedData = cache.get<PaginatedResponse<Product>>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Fetch from API if not in cache
    const response = await api.get<PaginatedResponse<Product>>(
      `/products/admin?${queryString}`
    );
    
    // Store in cache
    cache.set(cacheKey, response.data, CACHE_TTL);
    
    return response.data;
  },

  /**
   * Get a single product by ID
   * Results are cached for 5 minutes
   */
  getProductById: async (id: string): Promise<ApiResponse<Product>> => {
    const cacheKey = `product:${id}`;
    
    // Check cache first
    const cachedData = cache.get<ApiResponse<Product>>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Fetch from API if not in cache
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    
    // Store in cache
    cache.set(cacheKey, response.data, CACHE_TTL);
    
    return response.data;
  },

  /**
   * Create a new product (admin only)
   * Clears product list cache
   */
  createProduct: async (data: CreateProductRequest): Promise<ApiResponse<Product>> => {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    
    // Clear product list cache since we added a new product
    productService.clearCache();
    
    return response.data;
  },

  /**
   * Update an existing product (admin only)
   * Clears related cache entries
   */
  updateProduct: async (
    id: string,
    data: UpdateProductRequest
  ): Promise<ApiResponse<Product>> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    
    // Clear specific product cache and product list cache
    cache.clear(`product:${id}`);
    productService.clearCache();
    
    return response.data;
  },

  /**
   * Delete a product (soft delete, admin only)
   * Clears related cache entries
   */
  deleteProduct: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/products/${id}`);
    
    // Clear specific product cache and product list cache
    cache.clear(`product:${id}`);
    productService.clearCache();
    
    return response.data;
  },

  /**
   * Publish a draft product (admin only)
   * Clears related cache entries
   */
  publishProduct: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.post<ApiResponse<Product>>(`/products/${id}/publish`);
    
    // Clear specific product cache and product list cache
    cache.clear(`product:${id}`);
    productService.clearCache();
    
    return response.data;
  },

  /**
   * Unpublish a product (admin only)
   * Clears related cache entries
   */
  unpublishProduct: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.post<ApiResponse<Product>>(`/products/${id}/unpublish`);
    
    // Clear specific product cache and product list cache
    cache.clear(`product:${id}`);
    productService.clearCache();
    
    return response.data;
  },

  /**
   * Get product categories
   * Results are cached for 5 minutes
   */
  getCategories: async (): Promise<ApiResponse<string[]>> => {
    const cacheKey = 'product:categories';
    
    // Check cache first
    const cachedData = cache.get<ApiResponse<string[]>>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Fetch from API if not in cache
    const response = await api.get<ApiResponse<string[]>>('/products/categories');
    
    // Store in cache
    cache.set(cacheKey, response.data, CACHE_TTL);
    
    return response.data;
  },

  /**
   * Clear all product-related cache entries
   */
  clearCache: (): void => {
    // Clear all cache entries that start with 'products:' or 'product:'
    cache.clearAll();
  },
};
