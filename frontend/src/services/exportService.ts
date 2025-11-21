import api from './api';
import { exportToCSV, CSVColumn, formatDateForCSV, formatCurrencyForCSV } from '../utils/csvExport';

export interface ExportFilters {
  start_date?: string;
  end_date?: string;
}

/**
 * Export sales data to CSV
 */
export const exportSalesData = async (filters?: ExportFilters): Promise<void> => {
  try {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const response = await api.get(`/analytics/sales?${params.toString()}`);
    const salesData = response.data.data || [];

    const columns: CSVColumn[] = [
      { key: 'id', label: 'Sale ID' },
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'product_names', label: 'Products' },
      { key: 'amount', label: 'Amount', format: formatCurrencyForCSV },
      { key: 'discount', label: 'Discount', format: formatCurrencyForCSV },
      { key: 'final_amount', label: 'Final Amount', format: formatCurrencyForCSV },
      { key: 'payment_status', label: 'Payment Status' },
      { key: 'payment_method', label: 'Payment Method' },
      { key: 'date', label: 'Date', format: formatDateForCSV },
    ];

    const filename = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(salesData, columns, filename);
  } catch (error) {
    console.error('Error exporting sales data:', error);
    throw new Error('Failed to export sales data');
  }
};

/**
 * Export customer data to CSV
 */
export const exportCustomerData = async (): Promise<void> => {
  try {
    const response = await api.get('/customers');
    const customerData = response.data.data || [];

    const columns: CSVColumn[] = [
      { key: 'id', label: 'Customer ID' },
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'address', label: 'Address' },
      { key: 'current_balance', label: 'Current Balance', format: formatCurrencyForCSV },
      { key: 'created_at', label: 'Registered Date', format: formatDateForCSV },
    ];

    const filename = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(customerData, columns, filename);
  } catch (error) {
    console.error('Error exporting customer data:', error);
    throw new Error('Failed to export customer data');
  }
};

/**
 * Export khata transactions to CSV
 */
export const exportKhataData = async (filters?: ExportFilters): Promise<void> => {
  try {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const response = await api.get(`/khata/transactions?${params.toString()}`);
    const khataData = response.data.data || [];

    const columns: CSVColumn[] = [
      { key: 'id', label: 'Transaction ID' },
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'transaction_type', label: 'Type' },
      { key: 'amount', label: 'Amount', format: formatCurrencyForCSV },
      { key: 'balance_after', label: 'Balance After', format: formatCurrencyForCSV },
      { key: 'description', label: 'Description' },
      { key: 'payment_method', label: 'Payment Method' },
      { key: 'created_at', label: 'Date', format: formatDateForCSV },
    ];

    const filename = `khata_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(khataData, columns, filename);
  } catch (error) {
    console.error('Error exporting khata data:', error);
    throw new Error('Failed to export khata data');
  }
};

/**
 * Export product data to CSV
 */
export const exportProductData = async (): Promise<void> => {
  try {
    const response = await api.get('/products');
    const productData = response.data.data || [];

    const columns: CSVColumn[] = [
      { key: 'id', label: 'Product ID' },
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'base_price', label: 'Base Price', format: formatCurrencyForCSV },
      { key: 'current_price', label: 'Current Price', format: formatCurrencyForCSV },
      { key: 'weight', label: 'Weight (g)' },
      { key: 'gold_purity', label: 'Gold Purity' },
      { key: 'stock_quantity', label: 'Stock' },
      { key: 'is_active', label: 'Status', format: (val) => (val ? 'Active' : 'Inactive') },
      { key: 'created_at', label: 'Created Date', format: formatDateForCSV },
    ];

    const filename = `products_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(productData, columns, filename);
  } catch (error) {
    console.error('Error exporting product data:', error);
    throw new Error('Failed to export product data');
  }
};

/**
 * Export order data to CSV
 */
export const exportOrderData = async (filters?: ExportFilters & { status?: string }): Promise<void> => {
  try {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get(`/analytics/orders?${params.toString()}`);
    const orderData = response.data.data || [];

    const columns: CSVColumn[] = [
      { key: 'order_number', label: 'Order Number' },
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'customer_phone', label: 'Phone' },
      { key: 'customer_email', label: 'Email' },
      { key: 'items', label: 'Items' },
      { key: 'item_count', label: 'Item Count' },
      { key: 'subtotal', label: 'Subtotal', format: formatCurrencyForCSV },
      { key: 'tax_amount', label: 'Tax', format: formatCurrencyForCSV },
      { key: 'discount_amount', label: 'Discount', format: formatCurrencyForCSV },
      { key: 'total_amount', label: 'Total Amount', format: formatCurrencyForCSV },
      { key: 'status', label: 'Order Status' },
      { key: 'payment_status', label: 'Payment Status' },
      { key: 'payment_method', label: 'Payment Method' },
      { key: 'date', label: 'Order Date', format: formatDateForCSV },
      { key: 'notes', label: 'Notes' },
    ];

    const filename = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(orderData, columns, filename);
  } catch (error) {
    console.error('Error exporting order data:', error);
    throw new Error('Failed to export order data');
  }
};
