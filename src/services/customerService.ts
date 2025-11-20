import api from './api';
import {
  Customer,
  CreateCustomerRequest,
  KhataTransaction,
  CreateKhataTransactionRequest,
  KhataSummary,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export const customerService = {
  /**
   * Get all customers
   */
  getCustomers: async (page = 1, per_page = 20): Promise<PaginatedResponse<Customer>> => {
    const response = await api.get<PaginatedResponse<Customer>>(
      `/customers?page=${page}&per_page=${per_page}`
    );
    return response.data;
  },

  /**
   * Get a single customer by ID
   */
  getCustomerById: async (id: string): Promise<ApiResponse<Customer>> => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data;
  },

  /**
   * Create a new customer
   */
  createCustomer: async (data: CreateCustomerRequest): Promise<ApiResponse<Customer>> => {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    return response.data;
  },

  /**
   * Update an existing customer
   */
  updateCustomer: async (
    id: string,
    data: Partial<CreateCustomerRequest>
  ): Promise<ApiResponse<Customer>> => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data;
  },

  /**
   * Get customer's khata (transaction history)
   */
  getCustomerKhata: async (
    customerId: string,
    page = 1,
    per_page = 50
  ): Promise<PaginatedResponse<KhataTransaction>> => {
    const response = await api.get<PaginatedResponse<KhataTransaction>>(
      `/customers/${customerId}/khata?page=${page}&per_page=${per_page}`
    );
    return response.data;
  },

  /**
   * Create a khata transaction
   */
  createKhataTransaction: async (
    data: CreateKhataTransactionRequest
  ): Promise<ApiResponse<KhataTransaction>> => {
    const response = await api.post<ApiResponse<KhataTransaction>>(
      '/khata/transactions',
      data
    );
    return response.data;
  },

  /**
   * Get khata summary (overall statistics)
   */
  getKhataSummary: async (): Promise<ApiResponse<KhataSummary>> => {
    const response = await api.get<ApiResponse<KhataSummary>>('/khata/summary');
    return response.data;
  },

  /**
   * Search customers by name or phone
   */
  searchCustomers: async (query: string): Promise<ApiResponse<Customer[]>> => {
    const response = await api.get<ApiResponse<Customer[]>>(
      `/customers/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },
};
