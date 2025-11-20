import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3,
    Users,
    Package,
    IndianRupee,
    TrendingUp,
    ShoppingCart,
    ClipboardList,
    UserCog
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/errorHandler';
import { toast } from 'react-toastify';

interface DashboardStats {
    total_revenue: number;
    total_transactions: number;
    total_customers: number;
    outstanding_balance: number;
}

interface DashboardData {
    summary: DashboardStats;
    sales_analytics?: {
        period_days: number;
        period_revenue: number;
        period_transactions: number;
        average_sale_value: number;
    };
}

/**
 * AdminDashboard component for admin users
 * 
 * Features:
 * - Displays key metrics: total orders, revenue, pending orders
 * - Fetches dashboard statistics from GET /api/analytics/dashboard
 * - Navigation to admin sections: products, orders, users
 * - Shows access denied message for non-admin users
 * 
 * Requirements: 1.8.1, 1.8.2, 1.8.3, 1.8.4, 1.8.5
 */
export const AdminDashboard = () => {
    const { user, isAdmin, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Fetch dashboard statistics
    const fetchDashboardStats = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<{ success: boolean; data: DashboardData }>('/analytics/dashboard?days=30');

            if (response.data.success && response.data.data) {
                setDashboardData(response.data.data);
            } else {
                throw new Error('Failed to load dashboard data');
            }
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            toast.error('Failed to load dashboard statistics');
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Load dashboard data on mount
    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            fetchDashboardStats();
        }
    }, [isAuthenticated, isAdmin]);

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
                        You don't have permission to access the admin dashboard. Admin privileges are required.
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

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-600 mx-auto"></div>
                    <p className="mt-6 text-lg text-gray-700 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardStats}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
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
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Welcome back, {user?.username}! Here's your platform overview.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Revenue */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <IndianRupee className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {dashboardData?.summary ? formatCurrency(dashboardData.summary.total_revenue) : '₹0'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Total Orders */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <ShoppingCart className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {dashboardData?.summary?.total_transactions || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Total Customers */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Total Customers</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {dashboardData?.summary?.total_customers || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pending Amount */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Outstanding Balance</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {dashboardData?.summary ? formatCurrency(dashboardData.summary.outstanding_balance) : '₹0'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Period Analytics */}
                {dashboardData?.sales_analytics && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Last {dashboardData.sales_analytics.period_days} Days Performance
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                                <p className="text-sm font-semibold text-gray-600 mb-1">Period Revenue</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(dashboardData.sales_analytics.period_revenue)}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                                <p className="text-sm font-semibold text-gray-600 mb-1">Period Orders</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {dashboardData.sales_analytics.period_transactions}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                                <p className="text-sm font-semibold text-gray-600 mb-1">Average Order Value</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {formatCurrency(dashboardData.sales_analytics.average_sale_value)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation to Admin Sections */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Admin Sections</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Products Management */}
                        <button
                            onClick={() => navigate('/admin/products')}
                            className="flex items-center space-x-4 p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl hover:from-yellow-100 hover:to-yellow-200 transition-all duration-300 border border-yellow-200"
                        >
                            <div className="p-3 bg-yellow-500 rounded-lg">
                                <Package className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Products</p>
                                <p className="text-sm text-gray-600">Manage inventory</p>
                            </div>
                        </button>

                        {/* Orders Management */}
                        <button
                            onClick={() => navigate('/admin/orders')}
                            className="flex items-center space-x-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 border border-blue-200"
                        >
                            <div className="p-3 bg-blue-500 rounded-lg">
                                <ClipboardList className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Orders</p>
                                <p className="text-sm text-gray-600">View and manage orders</p>
                            </div>
                        </button>

                        {/* Users Management */}
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="flex items-center space-x-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 border border-purple-200"
                        >
                            <div className="p-3 bg-purple-500 rounded-lg">
                                <UserCog className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Users</p>
                                <p className="text-sm text-gray-600">Manage user accounts</p>
                            </div>
                        </button>

                        {/* Analytics */}
                        <button
                            onClick={() => navigate('/admin/analytics')}
                            className="flex items-center space-x-4 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 border border-green-200"
                        >
                            <div className="p-3 bg-green-500 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900">Analytics</p>
                                <p className="text-sm text-gray-600">View detailed reports</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
