// Product types
export interface Product {
  id: string;
  name: string;
  category: string;
  base_price: number;
  current_price: number;
  weight: number;
  gold_purity: string;
  description: string;
  image_url: string;
  stock_quantity: number;
  is_active: boolean;
  status: 'draft' | 'published';
  published_at?: string;
  created_at: string;
  updated_at?: string;
  // Price-based product fields
  price_symbol?: string; // e.g., 'BTCUSD', 'ETHUSD' for crypto products
  is_price_based?: boolean; // Flag to indicate if product uses live market pricing
}

export interface CreateProductRequest {
  name: string;
  category: string;
  base_price: number;
  weight: number;
  gold_purity: string;
  description?: string;
  image_url?: string;
  stock_quantity?: number;
  status?: 'draft' | 'published';
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> { }

export interface ProductFilters {
  category?: string;
  price_min?: number;
  price_max?: number;
  weight_min?: number;
  weight_max?: number;
  status?: 'draft' | 'published' | 'all';
  page?: number;
  per_page?: number;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  current_balance: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

// Khata types
export interface KhataTransaction {
  id: string;
  customer_id: string;
  transaction_type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  description?: string;
  payment_method?: string;
  reference_number?: string;
  created_at: string;
  created_by?: string;
}

export interface CreateKhataTransactionRequest {
  customer_id: string;
  transaction_type: 'credit' | 'debit';
  amount: number;
  description?: string;
  payment_method?: string;
  reference_number?: string;
}

export interface KhataSummary {
  total_customers: number;
  total_outstanding: number;
  total_credit: number;
  total_debit: number;
}

// Prediction types
export interface GoldPredictionRequest {
  date: string;
  weight_grams?: number;
}

export interface GoldPrediction {
  date: string;
  predicted_price_per_gram: number;
  total_price?: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  model_accuracy: number;
  last_trained?: string;
}

export interface DiamondPredictionRequest {
  carat: number;
  cut: string;
  color: string;
  clarity: string;
}

export interface DiamondPrediction {
  predicted_price: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  features_used: {
    carat: number;
    cut: string;
    color: string;
    clarity: string;
  };
  model_accuracy: number;
}

export interface PriceTrend {
  date: string;
  price?: number;
  price_per_gram?: number;
  moving_average_7?: number;
  moving_average_30?: number;
}

export interface ModelTrainingMetrics {
  r2_score?: number;
  rmse?: number;
  mae?: number;
}

export interface ModelTrainingInfo {
  trained_at: string;
  metrics: ModelTrainingMetrics;
  data_points: number;
}

export interface ModelInfo {
  loaded: boolean;
  trained: boolean;
  last_training: ModelTrainingInfo | null;
}

export interface ModelsStatus {
  gold_model: ModelInfo;
  diamond_model: ModelInfo;
}

// Order types
export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ShippingAddress {
  full_name: string;
  mobile: string;
  email?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pin_code: string;
  landmark?: string;
  preferred_delivery_date?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'pending_payment' | 'payment_failed' | 'refunded' | 'shipped' | 'delivered';
  payment_status: 'unpaid' | 'partial' | 'paid';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  notes?: string;
  admin_notes?: string;
  // Shipping information
  shipping_address?: ShippingAddress;
  // Payment information
  payment_method?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  payment_captured_at?: string;
  // Additional pricing fields
  gst_amount?: number;
  shipping_amount?: number;
  discount_amount?: number;
  // Refund information
  refunds?: Refund[];
}

export interface CreateOrderRequest {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: Omit<OrderItem, 'product_name' | 'total_price'>[];
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'pending_payment' | 'payment_failed' | 'refunded' | 'shipped' | 'delivered';
}

export interface AddOrderNoteRequest {
  admin_notes: string;
}

export interface OrderFilters {
  status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'all';
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

// Refund types
export interface Refund {
  id: string;
  order_id: string;
  razorpay_refund_id: string;
  amount: number;
  refund_type: 'full' | 'partial';
  reason: string;
  status: 'pending' | 'processed' | 'failed';
  created_at: string;
  processed_at?: string;
  initiated_by?: string;
}

export interface ProcessRefundRequest {
  amount: number;
  refund_type: 'full' | 'partial';
  reason: string;
}

// Price Feed types
export interface PriceFeed {
  id: string;
  symbol: string;
  exchange: string;
  last_price: number;
  bid?: number;
  ask?: number;
  volume?: number;
  last_updated: string;
  fetch_error?: string;
}

// Payment Transaction types
export interface PaymentTransaction {
  id: string;
  order_id: string;
  order_number?: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  payment_method?: string;
  error_code?: string;
  error_description?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransactionFilters {
  status?: 'pending' | 'success' | 'failed' | 'refunded' | 'all';
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  page?: number;
  per_page?: number;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token?: string;
    access_token?: string;
    user: User;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff';
  is_active: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: number;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next?: boolean;
    has_prev?: boolean;
  };
}
