import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { Order, OrderFilters } from '../../types';
import { getErrorMessage } from '../../utils/errorHandler';
import { toast } from 'react-toastify';

/**
 * AdminOrdersPage component for managing orders
 * 
 * Features:
 * - Display orders table with filters by status
 * - Fetch orders from GET /api/orders endpoint
 * - Add order detail view showing items and customer info
 * - Create status update dropdown for each order
 * - Call PUT /api/orders/:id/status to update order status
 * - Add search functionality by order number or customer name
 * - Implement pagination for large order lists
 * 
 * Requirements: 1.13.1
 */
export const AdminOrdersPage = () => {
    const { isAdmin, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // State management
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters and search
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);

    // Expanded order details
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get status badge color
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    // Get payment status badge color
    const getPaymentStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            unpaid: 'bg-red-100 text-red-800',
            partial: 'bg-yellow-100 text-yellow-800',
            paid: 'bg-green-100 text-green-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    // Fetch orders from GET /api/orders endpoint
    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            const filters: OrderFilters = {
                page: currentPage,
                per_page: 20,
                status: selectedStatus,
            };

            if (searchTerm) {
                filters.search = searchTerm;
            }

            const response = await orderService.getOrders(filters);
            setOrders(response.data);
            setTotalPages(response.pagination.total_pages);
            setTotalOrders(response.pagination.total);
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            console.error('Error fetching orders:', err);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    // Load orders on mount and when filters change
    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            fetchOrders();
        }
    }, [isAuthenticated, isAdmin, selectedStatus, currentPage]);

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isAuthenticated && isAdmin) {
                setCurrentPage(1); // Reset to first page on search
                fetchOrders();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Handle status update
    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            await orderService.updateOrderStatus(orderId, newStatus as any);
            toast.success('Order status updated successfully');
            fetchOrders(); // Refresh the list
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            toast.error(`Failed to update status: ${errorMessage}`);
            console.error('Error updating order status:', err);
        }
    };

    // Toggle order details expansion
    const toggleOrderDetails = (orderId: string) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    // Show access denied for non-admin users
    if (isAuthenticated && !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="bg-red-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
                        <svg
                            className="h-10 w-10 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
                    <p className="text-gray-600 mb-6">
                        You don't have permission to access order management. Admin privileges are required.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        View and manage customer orders, update statuses, and track order details.
                    </p>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col space-y-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search by order number or customer name..."
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Filter className="inline h-4 w-4 mr-1" />
                                Order Status
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value as any);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            >
                                <option value="all">All Orders</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-600 mx-auto"></div>
                            <p className="mt-6 text-lg text-gray-700 font-medium">Loading orders...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                        <div className="flex items-center space-x-3">
                            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-800">Error Loading Orders</h3>
                                <p className="text-red-600">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchOrders}
                            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Orders Table */}
                {!loading && !error && (
                    <>
                        {orders.length > 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                {/* Desktop Table View */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Order #
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Customer
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Total
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Payment
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {orders.map((order) => (
                                                <>
                                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                {order.order_number}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm">
                                                                <div className="font-semibold text-gray-900">
                                                                    {order.customer_name}
                                                                </div>
                                                                <div className="text-gray-500">
                                                                    {order.customer_phone}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm text-gray-900">
                                                                {formatDate(order.created_at)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                {formatCurrency(order.total_amount)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                                                                {order.payment_status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <select
                                                                value={order.status}
                                                                onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                                className={`px-3 py-1 text-xs leading-5 font-semibold rounded-full border-0 focus:ring-2 focus:ring-yellow-400 ${getStatusColor(order.status)}`}
                                                            >
                                                                <option value="pending">Pending</option>
                                                                <option value="processing">Processing</option>
                                                                <option value="completed">Completed</option>
                                                                <option value="cancelled">Cancelled</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => toggleOrderDetails(order.id)}
                                                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors inline-flex items-center"
                                                                title="View Details"
                                                            >
                                                                {expandedOrderId === order.id ? (
                                                                    <>
                                                                        <ChevronUp className="h-5 w-5 mr-1" />
                                                                        Hide
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Eye className="h-5 w-5 mr-1" />
                                                                        View
                                                                    </>
                                                                )}
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Order Details */}
                                                    {expandedOrderId === order.id && (
                                                        <tr>
                                                            <td colSpan={7} className="px-6 py-4 bg-gray-50">
                                                                <div className="space-y-4">
                                                                    <h4 className="font-semibold text-gray-900">Order Details</h4>

                                                                    {/* Customer Information */}
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-gray-700">Customer Information</p>
                                                                            <p className="text-sm text-gray-600">Name: {order.customer_name}</p>
                                                                            <p className="text-sm text-gray-600">Phone: {order.customer_phone}</p>
                                                                            {order.customer_email && (
                                                                                <p className="text-sm text-gray-600">Email: {order.customer_email}</p>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-gray-700">Order Information</p>
                                                                            <p className="text-sm text-gray-600">Order #: {order.order_number}</p>
                                                                            <p className="text-sm text-gray-600">Created: {formatDate(order.created_at)}</p>
                                                                            {order.updated_at && (
                                                                                <p className="text-sm text-gray-600">Updated: {formatDate(order.updated_at)}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Order Items */}
                                                                    {order.items && order.items.length > 0 && (
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-gray-700 mb-2">Order Items</p>
                                                                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                                                <table className="min-w-full divide-y divide-gray-200">
                                                                                    <thead className="bg-gray-50">
                                                                                        <tr>
                                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit Price</th>
                                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody className="divide-y divide-gray-200">
                                                                                        {order.items.map((item, index) => (
                                                                                            <tr key={index}>
                                                                                                <td className="px-4 py-2 text-sm text-gray-900">{item.product_name}</td>
                                                                                                <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                                                                                                <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                                                                                                <td className="px-4 py-2 text-sm font-semibold text-gray-900">{formatCurrency(item.total_price)}</td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Order Summary */}
                                                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-gray-600">Subtotal:</span>
                                                                                <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                                                                            </div>
                                                                            {order.tax_amount > 0 && (
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-gray-600">Tax:</span>
                                                                                    <span className="text-gray-900">{formatCurrency(order.tax_amount)}</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex justify-between text-sm font-semibold border-t pt-2">
                                                                                <span className="text-gray-900">Total:</span>
                                                                                <span className="text-gray-900">{formatCurrency(order.total_amount)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Notes */}
                                                                    {(order.notes || order.admin_notes) && (
                                                                        <div>
                                                                            {order.notes && (
                                                                                <div className="mb-2">
                                                                                    <p className="text-sm font-semibold text-gray-700">Customer Notes:</p>
                                                                                    <p className="text-sm text-gray-600">{order.notes}</p>
                                                                                </div>
                                                                            )}
                                                                            {order.admin_notes && (
                                                                                <div>
                                                                                    <p className="text-sm font-semibold text-gray-700">Admin Notes:</p>
                                                                                    <p className="text-sm text-gray-600">{order.admin_notes}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="lg:hidden divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="space-y-3">
                                                {/* Order Header */}
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-900">
                                                            {order.order_number}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {formatDate(order.created_at)}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>

                                                {/* Customer Info */}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                                                    <p className="text-xs text-gray-500">{order.customer_phone}</p>
                                                </div>

                                                {/* Order Details */}
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {formatCurrency(order.total_amount)}
                                                        </p>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                                                            {order.payment_status}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleOrderDetails(order.id)}
                                                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                                    >
                                                        {expandedOrderId === order.id ? (
                                                            <ChevronUp className="h-5 w-5" />
                                                        ) : (
                                                            <ChevronDown className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Status Update */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Update Status
                                                    </label>
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="processing">Processing</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </div>

                                                {/* Expanded Details */}
                                                {expandedOrderId === order.id && (
                                                    <div className="pt-3 border-t border-gray-200 space-y-3">
                                                        {/* Order Items */}
                                                        {order.items && order.items.length > 0 && (
                                                            <div>
                                                                <p className="text-xs font-semibold text-gray-700 mb-2">Order Items</p>
                                                                <div className="space-y-2">
                                                                    {order.items.map((item, index) => (
                                                                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-2">
                                                                            <div className="flex justify-between">
                                                                                <span className="text-xs text-gray-900">{item.product_name}</span>
                                                                                <span className="text-xs font-semibold text-gray-900">{formatCurrency(item.total_price)}</span>
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Order Summary */}
                                                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-xs">
                                                                    <span className="text-gray-600">Subtotal:</span>
                                                                    <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                                                                </div>
                                                                {order.tax_amount > 0 && (
                                                                    <div className="flex justify-between text-xs">
                                                                        <span className="text-gray-600">Tax:</span>
                                                                        <span className="text-gray-900">{formatCurrency(order.tax_amount)}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between text-xs font-semibold border-t pt-1">
                                                                    <span className="text-gray-900">Total:</span>
                                                                    <span className="text-gray-900">{formatCurrency(order.total_amount)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // Empty state
                            <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                                <div className="bg-yellow-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
                                    <svg
                                        className="h-10 w-10 text-yellow-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Orders Found</h3>
                                <p className="text-gray-600 mb-6">
                                    {searchTerm
                                        ? `No orders match your search "${searchTerm}"`
                                        : selectedStatus !== 'all'
                                            ? `No orders with status "${selectedStatus}"`
                                            : 'No orders have been placed yet'}
                                </p>
                                {(searchTerm || selectedStatus !== 'all') && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSelectedStatus('all');
                                        }}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && orders.length > 0 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 mt-8 bg-white rounded-2xl shadow-lg p-6">
                                <div className="text-sm text-gray-600">
                                    Showing page {currentPage} of {totalPages} ({totalOrders} total orders)
                                </div>

                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${currentPage === 1
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:border-yellow-400 shadow-md hover:shadow-lg transform hover:scale-105'
                                            }`}
                                    >
                                        Previous
                                    </button>

                                    <span className="text-gray-700 font-medium px-4">
                                        {currentPage} / {totalPages}
                                    </span>

                                    <button
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${currentPage === totalPages
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:border-yellow-400 shadow-md hover:shadow-lg transform hover:scale-105'
                                            }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminOrdersPage;
