import { TrendingUp, Package, ShoppingCart, AlertTriangle, CheckCircle } from 'lucide-react';
import { EnhancedMetrics as EnhancedMetricsType } from '../services/analyticsService';

interface EnhancedMetricsProps {
  metrics: EnhancedMetricsType | null;
  loading: boolean;
  formatCurrency: (amount: number) => string;
}

export const EnhancedMetrics = ({ metrics, loading, formatCurrency }: EnhancedMetricsProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Loading enhanced metrics...</div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* New Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Conversion Rate */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-indigo-400">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.conversion_metrics.conversion_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.conversion_metrics.customers_with_orders} of {metrics.conversion_metrics.total_customers} customers
              </p>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-orange-400">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <ShoppingCart className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics.average_order_value.average_order_value)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.average_order_value.total_orders} orders
              </p>
            </div>
          </div>
        </div>

        {/* Product Status */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-teal-400">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-teal-100 rounded-xl">
              <Package className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.product_status_counts.total}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.product_status_counts.published} published • {metrics.product_status_counts.draft} draft
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Order Status Breakdown</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {metrics.order_status_breakdown.pending.count}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(metrics.order_status_breakdown.pending.total_amount)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-blue-600">
                {metrics.order_status_breakdown.processing.count}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(metrics.order_status_breakdown.processing.total_amount)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {metrics.order_status_breakdown.completed.count}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(metrics.order_status_breakdown.completed.total_amount)}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">
                {metrics.order_status_breakdown.cancelled.count}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(metrics.order_status_breakdown.cancelled.total_amount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Alerts */}
      {(metrics.inventory_alerts.low_stock_count > 0 || metrics.inventory_alerts.out_of_stock_count > 0) && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Inventory Alerts</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Low Stock Products */}
              {metrics.inventory_alerts.low_stock_count > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                    Low Stock ({metrics.inventory_alerts.low_stock_count})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {metrics.inventory_alerts.low_stock_products.map((product) => (
                      <div key={product.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-600">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-yellow-600">{product.stock_quantity} left</p>
                          <p className="text-xs text-gray-500">{formatCurrency(product.base_price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Out of Stock Products */}
              {metrics.inventory_alerts.out_of_stock_count > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                    Out of Stock ({metrics.inventory_alerts.out_of_stock_count})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {metrics.inventory_alerts.out_of_stock_products.map((product) => (
                      <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-600">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">Out of Stock</p>
                          <p className="text-xs text-gray-500">{formatCurrency(product.base_price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Inventory Issues */}
      {metrics.inventory_alerts.low_stock_count === 0 && metrics.inventory_alerts.out_of_stock_count === 0 && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-teal-50 px-6 py-4 border-b border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Inventory Status</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center text-green-600">
              <CheckCircle className="h-8 w-8 mr-3" />
              <p className="text-lg font-semibold">All products are well stocked!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
