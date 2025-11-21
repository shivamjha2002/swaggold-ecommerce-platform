import api from './api';
import { Order, CreateOrderRequest, UpdateOrderStatusRequest, AddOrderNoteRequest, OrderFilters, PaginatedResponse } from '../types';
import { analyticsService } from './analyticsService';

export const orderService = {
  /**
   * Get all orders with optional filters and pagination
   */
  getOrders: async (filters?: OrderFilters): Promise<PaginatedResponse<Order>> => {
    const response = await api.get<PaginatedResponse<Order>>('/orders', { params: filters });
    return response.data;
  },

  /**
   * Get a single order by ID
   */
  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`);
    return response.data.data;
  },

  /**
   * Create a new order
   * Clears analytics cache since order data affects analytics
   */
  createOrder: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await api.post<{ success: boolean; data: Order }>('/orders', data);
    
    // Clear analytics cache since new order affects analytics
    analyticsService.clearCache();
    
    return response.data.data;
  },

  /**
   * Update order status
   * Clears analytics cache since order status affects analytics
   */
  updateOrderStatus: async (id: string, data: UpdateOrderStatusRequest): Promise<Order> => {
    const response = await api.put<{ success: boolean; data: Order }>(`/orders/${id}/status`, data);
    
    // Clear analytics cache since order status affects analytics
    analyticsService.clearCache();
    
    return response.data.data;
  },

  /**
   * Add notes to an order
   */
  addOrderNote: async (id: string, data: AddOrderNoteRequest): Promise<Order> => {
    const response = await api.put<{ success: boolean; data: Order }>(`/orders/${id}/notes`, data);
    return response.data.data;
  },
};
