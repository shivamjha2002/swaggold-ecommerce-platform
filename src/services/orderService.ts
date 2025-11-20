import api from './api';
import { Order, OrderFilters, PaginatedResponse, ApiResponse, UpdateOrderStatusRequest } from '../types';

/**
 * Order service for managing orders
 */
export const orderService = {
  /**
   * Get all orders with pagination and filtering (Admin only)
   */
  async getOrders(filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.search) params.append('search', filters.search);

    const response = await api.get<PaginatedResponse<Order>>(`/orders?${params.toString()}`);
    return response.data;
  },

  /**
   * Get order by ID (Admin only)
   */
  async getOrderById(orderId: string): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/orders/${orderId}`);
    return response.data.data;
  },

  /**
   * Update order status (Admin only)
   */
  async updateOrderStatus(orderId: string, status: UpdateOrderStatusRequest['status']): Promise<Order> {
    const response = await api.put<ApiResponse<Order>>(`/orders/${orderId}/status`, { status });
    return response.data.data;
  },

  /**
   * Get order statistics (Admin only)
   */
  async getOrderStatistics(dateFrom?: string, dateTo?: string): Promise<any> {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    const response = await api.get<ApiResponse<any>>(`/orders/statistics?${params.toString()}`);
    return response.data.data;
  },
};
