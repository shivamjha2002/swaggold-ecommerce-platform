import { useEffect, useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Calendar, CreditCard, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import { PaymentTransaction, PaymentTransactionFilters } from '../types';
import { paymentTransactionService } from '../services/paymentTransactionService';
import { getErrorMessage } from '../utils/errorHandler';
import { useNavigate } from 'react-router-dom';

const PaymentTransactionsPage = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'success' | 'failed' | 'refunded'>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [amountMin, setAmountMin] = useState('');
    const [amountMax, setAmountMax] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const perPage = 10;

    // Load transactions
    const loadTransactions = async () => {
        setLoading(true);
        try {
            const filters: PaymentTransactionFilters = {
                page: currentPage,
                per_page: perPage,
            };

            if (statusFilter !== 'all') {
                filters.status = statusFilter;
            }

            if (dateFrom) {
                filters.date_from = dateFrom;
            }

            if (dateTo) {
                filters.date_to = dateTo;
            }

            if (amountMin) {
                filters.amount_min = parseFloat(amountMin);
            }

            if (amountMax) {
                filters.amount_max = parseFloat(amountMax);
            }

            const response = await paymentTransactionService.getTransactions(filters);
            setTransactions(response.data || []);
            setTotalPages(response.pagination?.total_pages || 1);
            setTotalTransactions(response.pagination?.total || 0);
        } catch (err) {
            console.error('Error loading transactions:', err);
            toast.error(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    // Load transactions on mount and when filters change
    useEffect(() => {
        loadTransactions();
    }, [currentPage, statusFilter]);

    // Handle date filter apply
    const handleApplyFilters = () => {
        if (currentPage === 1) {
            loadTransactions();
        } else {
            setCurrentPage(1);
        }
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setDateFrom('');
        setDateTo('');
        setAmountMin('');
        setAmountMax('');
        if (currentPage === 1) {
            loadTransactions();
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
        }).format(amount / 100); // Convert from paise to rupees
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'refunded':
                return 'bg-purple-100 text-purple-800';
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

    // Handle view order
    const handleViewOrder = (orderId: string) => {
        // Navigate to order management and open the order detail
        navigate(`/admin?tab=orders&orderId=${orderId}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Payment Transactions</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        {totalTransactions} total transaction{totalTransactions !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                {/* Filter Toggle */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                    >
                        <Filter className="h-4 w-4" />
                        <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
                    </button>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center space-x-2 overflow-x-auto">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all duration-300 ${statusFilter === 'all'
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        All Transactions
                    </button>
                    <button
                        onClick={() => setStatusFilter('success')}
                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all duration-300 ${statusFilter === 'success'
                                ? 'bg-gradient-to-r from-green-400 to-green-500 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Success
                    </button>
                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all duration-300 ${statusFilter === 'pending'
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setStatusFilter('failed')}
                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all duration-300 ${statusFilter === 'failed'
                                ? 'bg-gradient-to-r from-red-400 to-red-500 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Failed
                    </button>
                    <button
                        onClick={() => setStatusFilter('refunded')}
                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all duration-300 ${statusFilter === 'refunded'
                                ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        Refunded
                    </button>
                </div>

                {/* Advanced Filters (Collapsible) */}
                {showFilters && (
                    <div className="border-t pt-4 space-y-4">
                        {/* Date Range Filter */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <Calendar className="h-5 w-5 text-gray-600" />
                                <h4 className="text-sm font-semibold text-gray-700">Date Range</h4>
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
                            </div>
                        </div>

                        {/* Amount Range Filter */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <CreditCard className="h-5 w-5 text-gray-600" />
                                <h4 className="text-sm font-semibold text-gray-700">Amount Range (₹)</h4>
                            </div>
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Min Amount
                                    </label>
                                    <input
                                        type="number"
                                        value={amountMin}
                                        onChange={(e) => setAmountMin(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                    />
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Max Amount
                                    </label>
                                    <input
                                        type="number"
                                        value={amountMax}
                                        onChange={(e) => setAmountMax(e.target.value)}
                                        placeholder="999999"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="flex space-x-2">
                            <button
                                onClick={handleApplyFilters}
                                className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300"
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-gray-500">Loading transactions...</div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <p className="text-lg font-semibold">No transactions found</p>
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
                                            Transaction ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Order
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Payment Method
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {transactions.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-200">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-mono text-gray-900 break-all">
                                                        {transaction.razorpay_payment_id || transaction.razorpay_order_id}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {transaction.order_number || `Order #${transaction.order_id.slice(0, 8)}`}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-green-600">
                                                {formatCurrency(transaction.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                        transaction.status
                                                    )}`}
                                                >
                                                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                                                {transaction.payment_method || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {formatDate(transaction.created_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleViewOrder(transaction.order_id)}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors duration-300 p-2 min-w-touch min-h-touch flex items-center justify-center"
                                                    title="View Order"
                                                    aria-label="View order details"
                                                >
                                                    <ExternalLink className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4 p-4">
                            {transactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-xs font-mono text-gray-600 mb-1 break-all">
                                                {transaction.razorpay_payment_id || transaction.razorpay_order_id}
                                            </p>
                                            <span
                                                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                    transaction.status
                                                )}`}
                                            >
                                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleViewOrder(transaction.order_id)}
                                            className="text-blue-600 hover:text-blue-800 transition-colors duration-300 p-2 min-w-touch min-h-touch flex items-center justify-center"
                                            title="View Order"
                                            aria-label="View order details"
                                        >
                                            <ExternalLink className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-sm font-medium text-gray-600">Order:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {transaction.order_number || `#${transaction.order_id.slice(0, 8)}`}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-sm font-medium text-gray-600">Amount:</span>
                                            <span className="text-base font-bold text-green-600">
                                                {formatCurrency(transaction.amount)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-sm font-medium text-gray-600">Method:</span>
                                            <span className="text-sm text-gray-900 capitalize">
                                                {transaction.payment_method || 'N/A'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-sm font-medium text-gray-600">Date:</span>
                                            <span className="text-sm text-gray-900">
                                                {formatDate(transaction.created_at)}
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
                                        Page {currentPage} of {totalPages} • Showing {transactions.length} of {totalTransactions} transactions
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
                                                        className={`px-3 py-1 rounded-lg font-semibold transition-all duration-300 ${currentPage === pageNum
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
        </div>
    );
};

export default PaymentTransactionsPage;
