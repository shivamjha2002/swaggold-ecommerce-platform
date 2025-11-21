import { useEffect, useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { orderService } from '../services/orderService';
import { Order, OrderFilters } from '../types';
import { getErrorMessage } from '../utils/errorHandler';
import { OrderDetailModal } from '../components/OrderDetailModal';

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const perPage = 10;

  // Load orders
  const loadOrders = async () => {
    setLoading(true);
    try {
      const filters: OrderFilters = {
        page: currentPage,
        per_page: perPage,
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      if (dateFrom) {
        filters.date_from = dateFrom;
      }

      if (dateTo) {
        filters.date_to = dateTo;
      }

      const response = await orderService.getOrders(filters);
      setOrders(response.data || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalOrders(response.pagination?.total || 0);
    } catch (err) {
      console.error('Error loading orders:', err);
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Load orders on mount and when filters change
  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadOrders();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle date filter apply
  const handleApplyDateFilter = () => {
    if (currentPage === 1) {
      loadOrders();
    } else {
      setCurrentPage(1);
    }
  };

  // Handle clear date filter
  const handleClearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    if (currentPage === 1) {
      loadOrders();
    } else {
      setCurrentPage(1);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle view order details
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  // Handle order update from modal
  const handleOrderUpdate = () => {
    loadOrders();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            {totalOrders} total order{totalOrders !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
        {/* Search and Filter Toggle */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by customer name or order number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all duration-300 ${
              statusFilter === 'all'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all duration-300 ${
              statusFilter === 'pending'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('processing')}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all duration-300 ${
              statusFilter === 'processing'
                ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Processing
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all duration-300 ${
              statusFilter === 'completed'
                ? 'bg-gradient-to-r from-green-400 to-green-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all duration-300 ${
              statusFilter === 'cancelled'
                ? 'bg-gradient-to-r from-red-400 to-red-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Date Range Filter (Collapsible) */}
        {showFilters && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Date Range Filter</h3>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleApplyDateFilter}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300"
                >
                  Apply
                </button>
                <button
                  onClick={handleClearDateFilter}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading orders...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p className="text-lg font-semibold">No orders found</p>
            <p className="text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Order Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {order.order_number}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">{order.customer_phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-300 p-2 min-w-touch min-h-touch flex items-center justify-center"
                          title="View Details"
                          aria-label="View order details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">
                        {order.order_number}
                      </div>
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="text-blue-600 hover:text-blue-800 transition-colors duration-300 p-2 min-w-touch min-h-touch flex items-center justify-center"
                      title="View Details"
                      aria-label="View order details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Customer:</span>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer_name}
                        </div>
                        <div className="text-xs text-gray-500">{order.customer_phone}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Date:</span>
                      <span className="text-sm text-gray-900">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">Total:</span>
                      <span className="text-base font-bold text-green-600">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages} • Showing {orders.length} of {totalOrders} orders
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 rounded-lg font-semibold transition-all duration-300 ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {isDetailModalOpen && selectedOrder && (
        <OrderDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          order={selectedOrder}
          onOrderUpdate={handleOrderUpdate}
        />
      )}
    </div>
  );
};

export default OrderManagement;
