import api from './api';
import { cache } from '../utils/cache';

// Cache TTL: 2 minutes for analytics (120000 ms) - shorter than products since data changes more frequently
const ANALYTICS_CACHE_TTL = 120000;

export interface DashboardAnalytics {
  summary: {
    total_revenue: number;
    total_transactions: number;
    total_customers: number;
    outstanding_balance: number;
  };
  sales_analytics: {
    period_days: number;
    period_revenue: number;
    period_transactions: number;
    average_sale_value: number;
    paid_sales: number;
    pending_sales: number;
  };
  top_selling_products: Array<{
    product_id: string;
    product_name: string;
    quantity_sold: number;
    total_revenue: number;
  }>;
  khata_summary: {
    total_outstanding: number;
    customers_with_balance: number;
    top_debtors: Array<{
      id: string;
      name: string;
      phone: string;
      balance: number;
    }>;
  };
  recent_sales: Array<{
    id: string;
    customer_name: string;
    product_names: string;
    amount: number;
    date: string;
    payment_status: string;
  }>;
}

export interface SalesTrend {
  month: string;
  sales: number;
  revenue: number;
}

export interface EnhancedMetrics {
  conversion_metrics: {
    conversion_rate: number;
    total_customers: number;
    customers_with_orders: number;
  };
  product_status_counts: {
    draft: number;
    published: number;
    total: number;
  };
  order_status_breakdown: {
    pending: { count: number; total_amount: number };
    processing: { count: number; total_amount: number };
    completed: { count: number; total_amount: number };
    cancelled: { count: number; total_amount: number };
    total_orders: number;
    total_revenue: number;
  };
  average_order_value: {
    average_order_value: number;
    total_orders: number;
    total_revenue: number;
  };
  inventory_alerts: {
    low_stock_products: Array<{
      id: string;
      name: string;
      category: string;
      stock_quantity: number;
      base_price: number;
    }>;
    out_of_stock_products: Array<{
      id: string;
      name: string;
      category: string;
      base_price: number;
    }>;
    low_stock_count: number;
    out_of_stock_count: number;
  };
}

export const analyticsService = {
  /**
   * Get dashboard analytics with caching
   */
  getDashboardAnalytics: async (days: number = 30): Promise<DashboardAnalytics> => {
    const cacheKey = `analytics:dashboard:${days}`;
    
    // Check cache first
    const cachedData = cache.get<DashboardAnalytics>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Fetch from API if not in cache
    const response = await api.get(`/analytics/dashboard?days=${days}`);
    const data = response.data.data;
    
    // Store in cache
    cache.set(cacheKey, data, ANALYTICS_CACHE_TTL);
    
    return data;
  },

  /**
   * Get sales trend with caching
   */
  getSalesTrend: async (months: number = 6): Promise<SalesTrend[]> => {
    const cacheKey = `analytics:sales-trend:${months}`;
    
    // Check cache first
    const cachedData = cache.get<SalesTrend[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Fetch from API if not in cache
    const response = await api.get(`/analytics/sales-trend?months=${months}`);
    const data = response.data.data;
    
    // Store in cache
    cache.set(cacheKey, data, ANALYTICS_CACHE_TTL);
    
    return data;
  },

  /**
   * Get enhanced metrics with caching
   */
  getEnhancedMetrics: async (days: number = 30): Promise<EnhancedMetrics> => {
    const cacheKey = `analytics:enhanced-metrics:${days}`;
    
    // Check cache first
    const cachedData = cache.get<EnhancedMetrics>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Fetch from API if not in cache
    const response = await api.get(`/analytics/enhanced-metrics?days=${days}`);
    const data = response.data.data;
    
    // Store in cache
    cache.set(cacheKey, data, ANALYTICS_CACHE_TTL);
    
    return data;
  },

  /**
   * Clear analytics cache (call after creating orders, sales, etc.)
   */
  clearCache: (): void => {
    // Clear all analytics cache entries
    cache.clearAll();
  },
};
