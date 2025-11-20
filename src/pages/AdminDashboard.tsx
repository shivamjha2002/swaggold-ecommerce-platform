import { useEffect, useState, lazy, Suspense } from 'react';
import { BarChart3, Users, Package, IndianRupee, TrendingUp, ShoppingCart, Eye, Edit, Trash2, Plus, Search, Filter, Download, CheckSquare, Square, Upload, ClipboardList, Brain, CreditCard } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { analyticsService, DashboardAnalytics, SalesTrend, EnhancedMetrics } from '../services/analyticsService';
import { productService } from '../services/productService';
import { Product as APIProduct } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { exportSalesData, exportCustomerData, exportKhataData, exportProductData, exportOrderData } from '../services/exportService';
import { getErrorMessage } from '../utils/errorHandler';
import { ModelManagement } from '../components/admin/ModelManagement';
import { PriceFeedWidget } from '../components/admin/PriceFeedWidget';

// Lazy load heavy components
const OrderManagement = lazy(() => import('./OrderManagement'));
const PaymentTransactionsPage = lazy(() => import('./PaymentTransactionsPage'));
const ProductFormModal = lazy(() => import('../components/ProductFormModal').then(module => ({ default: module.ProductFormModal })));
const EnhancedMetricsComponent = lazy(() => import('../components/EnhancedMetrics').then(module => ({ default: module.EnhancedMetrics })));

// Using proper JWT authentication via AuthContext 

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  totalPurchases: string;
  pendingAmount: string;
}

interface KhataRecord {
  id: number;
  customer: string;
  totalCredit: string;
  pendingAmount: string;
  lastPayment: string;
  status: string;
}

const AdminDashboard = () => {
  // Use proper JWT authentication
  const { user, login, logout } = useAuth();
  const isAuthenticated = !!user && user.role === 'admin';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  // login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Cart State (Add to Cart functionality ke liye)
  const [cart] = useState<Product[]>([]);

  // Analytics data state
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([]);
  const [enhancedMetrics, setEnhancedMetrics] = useState<EnhancedMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product management state
  const [apiProducts, setApiProducts] = useState<APIProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<APIProduct | null>(null);
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<APIProduct | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Export state
  const [showExportSection, setShowExportSection] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Real-time updates state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [previousOrderCount, setPreviousOrderCount] = useState<number | null>(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  // Mock data for products, customers, and khata (to be replaced with API calls later)
  const products: Product[] = [
    { id: 1, name: 'Diamond Earrings', category: 'Earrings', price: '₹85,000', stock: 5, status: 'In Stock' },
    { id: 2, name: 'Gold Necklace', category: 'Necklaces', price: '₹65,000', stock: 8, status: 'In Stock' },
    { id: 3, name: 'Bridal Set', category: 'Bridal Sets', price: '₹1,80,000', stock: 2, status: 'Low Stock' },
    { id: 4, name: 'Ruby Ring', category: 'Rings', price: '₹45,000', stock: 0, status: 'Out of Stock' },
    { id: 5, name: 'Gold Bangles', category: 'Bangles', price: '₹75,000', stock: 12, status: 'In Stock' }
  ];

  const customers: Customer[] = [
    { id: 1, name: 'Rajesh Kumar', email: 'rajesh@email.com', phone: '+91 98765 43210', totalPurchases: '₹2,50,000', pendingAmount: '₹25,000' },
    { id: 2, name: 'Priya Sharma', email: 'priya@email.com', phone: '+91 87654 32109', totalPurchases: '₹1,80,000', pendingAmount: '₹0' },
    { id: 3, name: 'Amit Singh', email: 'amit@email.com', phone: '+91 76543 21098', totalPurchases: '₹3,20,000', pendingAmount: '₹45,000' },
    { id: 4, name: 'Kavita Patel', email: 'kavita@email.com', phone: '+91 65432 10987', totalPurchases: '₹95,000', pendingAmount: '₹15,000' },
    { id: 5, name: 'Suresh Gupta', email: 'suresh@email.com', phone: '+91 54321 09876', totalPurchases: '₹1,50,000', pendingAmount: '₹35,000' }
  ];

  const khataRecords: KhataRecord[] = [
    { id: 1, customer: 'Rajesh Kumar', totalCredit: '₹2,50,000', pendingAmount: '₹25,000', lastPayment: '2024-11-15', status: 'Active' },
    { id: 2, customer: 'Amit Singh', totalCredit: '₹3,20,000', pendingAmount: '₹45,000', lastPayment: '2024-10-20', status: 'Overdue' },
    { id: 3, customer: 'Kavita Patel', totalCredit: '₹95,000', pendingAmount: '₹15,000', lastPayment: '2024-11-28', status: 'Active' },
    { id: 4, customer: 'Suresh Gupta', totalCredit: '₹1,50,000', pendingAmount: '₹35,000', lastPayment: '2024-11-10', status: 'Active' },
    { id: 5, customer: 'Meera Shah', totalCredit: '₹80,000', pendingAmount: '₹20,000', lastPayment: '2024-11-25', status: 'Active' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock':
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Load analytics data
  const loadAnalytics = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const [analyticsData, trendData, enhancedData] = await Promise.all([
        analyticsService.getDashboardAnalytics(30),
        analyticsService.getSalesTrend(6),
        analyticsService.getEnhancedMetrics(30),
      ]);

      // Check for new orders
      if (enhancedData?.order_status_breakdown?.total_orders !== undefined) {
        const currentOrderCount = enhancedData.order_status_breakdown.total_orders;

        if (previousOrderCount !== null && currentOrderCount > previousOrderCount) {
          const newOrders = currentOrderCount - previousOrderCount;
          setNewOrdersCount(prev => prev + newOrders);

          // Show notification for new orders
          toast.info(`${newOrders} new order${newOrders > 1 ? 's' : ''} received!`, {
            position: 'top-right',
            autoClose: 5000,
          });
        }

        setPreviousOrderCount(currentOrderCount);
      }

      setAnalytics(analyticsData);
      setSalesTrend(trendData);
      setEnhancedMetrics(enhancedData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading analytics:', err);
      if (!silent) {
        setError('Failed to load analytics data');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // --- Auth Logic ---
  // No separate auth check needed - using AuthContext

  // Load analytics when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAnalytics();
      loadProducts();
    }
  }, [isAuthenticated]);

  // Reload products when status filter changes
  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
    }
  }, [statusFilter]);

  // Real-time updates with polling
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh || activeTab !== 'dashboard') {
      return;
    }

    // Poll every 30 seconds for real-time updates
    const intervalId = setInterval(() => {
      loadAnalytics(true); // Silent refresh (no loading spinner)
    }, 30000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, autoRefresh, activeTab]);

  // Load products from API
  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError(null);

    // Verify authentication token exists
    const token = localStorage.getItem('token');
    if (!token) {
      setProductsError('Authentication required. Please log in again.');
      setProductsLoading(false);
      return;
    }

    try {
      const response = await productService.getAdminProducts({ status: statusFilter });
      setApiProducts(response.data || []);
      setSelectedProductIds([]); // Clear selection when reloading
      setProductsError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error loading products:', err);
      const errorMessage = getErrorMessage(err);
      setProductsError(errorMessage || 'Failed to load products. Please try again.');
      toast.error(errorMessage || 'Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      await login({ username: username.trim(), password });
      setUsername('');
      setPassword('');
    } catch (err) {
      setLoginError(getErrorMessage(err) || 'Invalid credentials. कृपया सही नाम और पासवर्ड डालें।');
    }
  };

  const handleLogout = () => {
    logout();
    setActiveTab('dashboard');
  };

  // --- Cart Logic ---
  const handleAddToCart = (product: Product) => {
    alert(`Added ${product.name} to cart.`);
  };

  const totalCartQuantity = cart.length;

  // --- Product Management Logic ---
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setProductModalMode('create');
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: APIProduct) => {
    setSelectedProduct(product);
    setProductModalMode('edit');
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (product: APIProduct) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await productService.deleteProduct(productToDelete.id);
      await loadProducts();
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      toast.success('Product deleted successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleProductSubmit = async (data: Partial<APIProduct>) => {
    try {
      if (productModalMode === 'create') {
        // For create, ensure required fields are present
        await productService.createProduct(data as Parameters<typeof productService.createProduct>[0]);
        toast.success('Product created successfully');
      } else if (selectedProduct) {
        await productService.updateProduct(selectedProduct.id, data);
        toast.success('Product updated successfully');
      }

      // Refresh product list after successful creation/update
      await loadProducts();
      setIsProductModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      // Re-throw error so modal can handle field-specific validation errors
      // Don't show toast here - let the modal display the errors
      throw err;
    }
  };

  const handlePublishProduct = async (productId: string) => {
    try {
      await productService.publishProduct(productId);
      await loadProducts();
      toast.success('Product published successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleUnpublishProduct = async (productId: string) => {
    try {
      await productService.unpublishProduct(productId);
      await loadProducts();
      toast.success('Product unpublished successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleToggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleToggleAllProducts = () => {
    if (selectedProductIds.length === apiProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(apiProducts.map(p => p.id));
    }
  };

  const handleBulkPublish = async () => {
    try {
      await Promise.all(selectedProductIds.map(id => productService.publishProduct(id)));
      await loadProducts();
      toast.success(`${selectedProductIds.length} product(s) published successfully`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      await Promise.all(selectedProductIds.map(id => productService.unpublishProduct(id)));
      await loadProducts();
      toast.success(`${selectedProductIds.length} product(s) unpublished successfully`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // --- Export Logic ---
  const handleExportSales = async (startDate?: string, endDate?: string) => {
    setExportLoading(true);
    try {
      await exportSalesData({ start_date: startDate, end_date: endDate });
      toast.success('Sales data exported successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCustomers = async () => {
    setExportLoading(true);
    try {
      await exportCustomerData();
      toast.success('Customer data exported successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportKhata = async (startDate?: string, endDate?: string) => {
    setExportLoading(true);
    try {
      await exportKhataData({ start_date: startDate, end_date: endDate });
      toast.success('Khata data exported successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportProducts = async () => {
    setExportLoading(true);
    try {
      await exportProductData();
      toast.success('Product data exported successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportOrders = async (startDate?: string, endDate?: string) => {
    setExportLoading(true);
    try {
      await exportOrderData({ start_date: startDate, end_date: endDate });
      toast.success('Order data exported successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExportLoading(false);
    }
  };


  // --- Render Functions ---

  const renderSalesChart = () => {
    if (!salesTrend || salesTrend.length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Sales Performance</h2>
          <div className="flex items-center justify-center h-64 text-gray-500">
            No sales data available
          </div>
        </div>
      );
    }

    const maxRevenue = Math.max(...salesTrend.map(d => d.revenue), 1);

    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Sales Performance</h2>
        <div className="flex items-end justify-around h-64 border-b border-l border-gray-300">
          {salesTrend.map((data, index) => (
            <div key={index} className="flex flex-col items-center group relative h-full w-10">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
                {formatCurrency(data.revenue)}
                <br />
                {data.sales} sales
              </div>
              {/* Bar */}
              <div
                className="w-8 bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-600"
                style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
              ></div>
              {/* Label */}
              <span className="text-xs text-gray-600 mt-2">{data.month}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-right text-gray-500 mt-2">Revenue by Month</div>
      </div>
    );
  };

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => loadAnalytics(false)}
            className="mt-2 text-sm text-red-700 underline"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!analytics) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No analytics data available</div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Real-time Updates Control */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border border-blue-200 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`h-3 w-3 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {autoRefresh ? 'Live Updates Active' : 'Live Updates Paused'}
              </p>
              {lastUpdated && (
                <p className="text-xs text-gray-600">
                  Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
                </p>
              )}
            </div>
          </div>

          {/* New Orders Notification */}
          {newOrdersCount > 0 && (
            <div className="flex items-center space-x-2 bg-orange-100 border border-orange-300 rounded-lg px-4 py-2">
              <ShoppingCart className="h-5 w-5 text-orange-600 animate-bounce" />
              <span className="text-sm font-semibold text-orange-800">
                {newOrdersCount} new order{newOrdersCount > 1 ? 's' : ''} since login
              </span>
              <button
                onClick={() => {
                  setNewOrdersCount(0);
                  setActiveTab('orders');
                }}
                className="ml-2 text-xs text-orange-600 hover:text-orange-800 underline"
              >
                View
              </button>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                loadAnalytics(false);
              }}
              className="flex items-center space-x-2 bg-white text-blue-600 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-300 border border-blue-200"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Refresh Now</span>
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-2 font-semibold px-4 py-2 rounded-lg transition-all duration-300 ${autoRefresh
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
            >
              {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
            </button>
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
            <Download className="h-5 w-5 text-gray-600" />
          </div>
          <div className="space-y-6">
            {/* Sales Export */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Sales Report</h4>
              <DateRangeFilter onExport={handleExportSales} label="Export Sales" />
            </div>

            {/* Khata Export */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Khata Transactions</h4>
              <DateRangeFilter onExport={handleExportKhata} label="Export Khata" />
            </div>

            {/* Orders Export */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Orders Report</h4>
              <DateRangeFilter onExport={handleExportOrders} label="Export Orders" />
            </div>

            {/* Quick Export Buttons */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Quick Exports</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportCustomers}
                  disabled={exportLoading}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  <span>{exportLoading ? 'Exporting...' : 'Export Customers'}</span>
                </button>
                <button
                  onClick={handleExportProducts}
                  disabled={exportLoading}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-400 to-purple-500 text-white font-semibold px-4 py-2 rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  <span>{exportLoading ? 'Exporting...' : 'Export Products'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-green-400">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.summary.total_revenue)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-blue-400">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.summary.total_customers}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-purple-400">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.summary.total_transactions}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-red-400">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Outstanding Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.summary.outstanding_balance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics */}
        <Suspense fallback={<div className="text-center py-8 text-gray-500">Loading enhanced metrics...</div>}>
          <EnhancedMetricsComponent
            metrics={enhancedMetrics}
            loading={loading}
            formatCurrency={formatCurrency}
          />
        </Suspense>

        {/* Price Feed Widget */}
        <PriceFeedWidget />

        {/* Sales Chart */}
        {renderSalesChart()}

        {/* Top Selling Products */}
        {analytics.top_selling_products && analytics.top_selling_products.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Top Selling Products</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quantity Sold</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.top_selling_products.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.product_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{product.quantity_sold}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        {formatCurrency(product.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customer Khata Summary */}
        {analytics.khata_summary && analytics.khata_summary.top_debtors.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Customer Khata Summary</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total Outstanding: {formatCurrency(analytics.khata_summary.total_outstanding)} •
                Customers with Balance: {analytics.khata_summary.customers_with_balance}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.khata_summary.top_debtors.map((debtor) => (
                    <tr key={debtor.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{debtor.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{debtor.phone}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-red-600">
                        {formatCurrency(debtor.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Sales */}
        {analytics.recent_sales && analytics.recent_sales.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recent Sales</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Products</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.recent_sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{sale.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{sale.product_names}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        {formatCurrency(sale.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(sale.date)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${sale.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                          sale.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                          {sale.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProducts = () => {
    const displayProducts = apiProducts.length > 0 ? apiProducts : products;
    const isUsingAPI = apiProducts.length > 0;

    const getProductStatus = (product: APIProduct | typeof products[0]) => {
      if (isUsingAPI) {
        const apiProduct = product as APIProduct;
        if (!apiProduct.is_active) return 'Inactive';
        if (apiProduct.stock_quantity === 0) return 'Out of Stock';
        if (apiProduct.stock_quantity < 5) return 'Low Stock';
        return 'In Stock';
      }
      return (product as typeof products[0]).status;
    };

    const getPublishStatus = (product: APIProduct) => {
      return product.status || 'published';
    };

    const getPublishStatusColor = (status: string) => {
      return status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
    };

    const formatPrice = (product: APIProduct | typeof products[0]) => {
      if (isUsingAPI) {
        const apiProduct = product as APIProduct;
        return formatCurrency(apiProduct.current_price || apiProduct.base_price);
      }
      return (product as typeof products[0]).price;
    };

    const getStock = (product: APIProduct | typeof products[0]) => {
      return isUsingAPI ? (product as APIProduct).stock_quantity : (product as typeof products[0]).stock;
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportProducts}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold px-4 py-2 rounded-lg hover:from-green-500 hover:to-green-600 transition-all duration-300"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button
              onClick={handleAddProduct}
              className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        {isUsingAPI && (
          <div className="flex items-center space-x-2 bg-white rounded-lg p-2 shadow-md">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${statusFilter === 'all'
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              All Products
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${statusFilter === 'draft'
                ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              Draft
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${statusFilter === 'published'
                ? 'bg-gradient-to-r from-green-400 to-green-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              Published
            </button>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {isUsingAPI && selectedProductIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-semibold text-blue-900">
                {selectedProductIds.length} product(s) selected
              </span>
              <button
                onClick={() => setSelectedProductIds([])}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBulkPublish}
                className="flex items-center space-x-2 bg-green-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-300"
              >
                <Upload className="h-4 w-4" />
                <span>Publish</span>
              </button>
              <button
                onClick={handleBulkUnpublish}
                className="flex items-center space-x-2 bg-gray-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-600 transition-all duration-300"
              >
                <Download className="h-4 w-4" />
                <span>Unpublish</span>
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {productsLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
              <div className="text-gray-500 font-medium">Loading products...</div>
            </div>
          ) : productsError ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800 mb-1">Failed to Load Products</h3>
                    <p className="text-sm text-red-700">{productsError}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={loadProducts}
                className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold px-6 py-3 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Retry Loading Products</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {isUsingAPI && (
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={handleToggleAllProducts}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {selectedProductIds.length === apiProducts.length && apiProducts.length > 0 ? (
                            <CheckSquare className="h-5 w-5" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stock</th>
                    {isUsingAPI && (
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Publish Status</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stock Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayProducts.length === 0 ? (
                    <tr>
                      <td colSpan={isUsingAPI ? 8 : 7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <Package className="h-12 w-12 text-gray-400" />
                          <p className="text-gray-500 font-medium">No products found</p>
                          <p className="text-sm text-gray-400">
                            {statusFilter !== 'all'
                              ? `No ${statusFilter} products available. Try changing the filter.`
                              : 'Start by adding your first product.'}
                          </p>
                          <button
                            onClick={handleAddProduct}
                            className="mt-2 flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Product</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-200">
                        {isUsingAPI && (
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleProductSelection((product as APIProduct).id)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              {selectedProductIds.includes((product as APIProduct).id) ? (
                                <CheckSquare className="h-5 w-5 text-yellow-500" />
                              ) : (
                                <Square className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                        )}
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{product.category}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatPrice(product)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{getStock(product)}</td>
                        {isUsingAPI && (
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPublishStatusColor(getPublishStatus(product as APIProduct))}`}>
                              {getPublishStatus(product as APIProduct) === 'published' ? 'Published' : 'Draft'}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(getProductStatus(product))}`}>
                            {getProductStatus(product)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {isUsingAPI ? (
                              <>
                                {getPublishStatus(product as APIProduct) === 'draft' ? (
                                  <button
                                    onClick={() => handlePublishProduct((product as APIProduct).id)}
                                    className="text-green-600 hover:text-green-800 transition-colors duration-300"
                                    title="Publish"
                                  >
                                    <Upload className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUnpublishProduct((product as APIProduct).id)}
                                    className="text-gray-600 hover:text-gray-800 transition-colors duration-300"
                                    title="Unpublish"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditProduct(product as APIProduct)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product as APIProduct)}
                                  className="text-red-600 hover:text-red-800 transition-colors duration-300"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="text-blue-600 hover:text-blue-800 transition-colors duration-300" title="View">
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button className="text-green-600 hover:text-green-800 transition-colors duration-300" title="Edit">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button className="text-red-600 hover:text-red-800 transition-colors duration-300" title="Delete">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleAddToCart(product as Product)}
                                  className="text-yellow-500 hover:text-yellow-700 transition-colors duration-300 p-1 rounded-full bg-yellow-50/50"
                                  title="Add to Cart"
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCustomers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCustomers}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold px-4 py-2 rounded-lg hover:from-green-500 hover:to-green-600 transition-all duration-300"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300">
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Purchases</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pending Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{customer.phone}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">{customer.totalPurchases}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-semibold ${customer.pendingAmount === '₹0' ? 'text-green-600' : 'text-red-600'}`}>
                      {customer.pendingAmount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button className="text-blue-600 hover:text-blue-800 transition-colors duration-300">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-800 transition-colors duration-300">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderKhata = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Khata Management</h2>
        <button
          onClick={() => setShowExportSection(!showExportSection)}
          className="flex items-center space-x-2 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold px-4 py-2 rounded-lg hover:from-green-500 hover:to-green-600 transition-all duration-300"
        >
          <Download className="h-4 w-4" />
          <span>Export Report</span>
        </button>
      </div>

      {showExportSection && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Export Khata Transactions</h3>
          <DateRangeFilter onExport={handleExportKhata} label="Export Khata" />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Credit</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pending Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Payment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {khataRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.customer}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600">{record.totalCredit}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-red-600">{record.pendingAmount}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{record.lastPayment}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button className="text-blue-600 hover:text-blue-800 transition-colors duration-300">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-800 transition-colors duration-300">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const tabItems = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'orders', name: 'Orders', icon: ClipboardList },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'khata', name: 'Khata Records', icon: ShoppingCart },
    { id: 'ml-models', name: 'ML Models', icon: Brain }
  ];

  // ---------- Login screen (when not authenticated) ----------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Admin Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin name"
                className="mt-1 block w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="mt-1 block w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            {loginError && <div className="text-sm text-red-600">{loginError}</div>}
            <div className="flex items-center justify-between">
              <button type="submit" className="px-4 py-2 bg-yellow-400 rounded-lg font-semibold">Login</button>
              <div className="text-sm text-gray-500">Use your admin credentials to login</div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------- Authenticated UI (Main Dashboard) ----------
  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-black to-gray-900 py-4 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-300 mt-1">Manage your jewelry store operations</p>
          </div>
          <div className="flex items-center space-x-4">

            {/* CART COUNTER */}
            <div className="relative p-2 bg-gray-700 rounded-lg text-white cursor-pointer" title={`Total Items in Cart: ${totalCartQuantity}`}>
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-gray-900">
                {totalCartQuantity}
              </span>
            </div>

            <div className="text-sm text-gray-200">Signed in as <strong>{user?.username || 'Admin'}</strong></div>
            {/* LOGOUT BUTTON */}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg text-white font-semibold transition-colors duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                    }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'orders' && (
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
              </div>
            }>
              <OrderManagement />
            </Suspense>
          )}
          {activeTab === 'payments' && (
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
              </div>
            }>
              <PaymentTransactionsPage />
            </Suspense>
          )}
          {activeTab === 'customers' && renderCustomers()}
          {activeTab === 'khata' && renderKhata()}
          {activeTab === 'ml-models' && <ModelManagement />}
        </div>
      </div>

      {/* Product Form Modal */}
      {isProductModalOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
          </div>
        }>
          <ProductFormModal
            isOpen={isProductModalOpen}
            onClose={() => setIsProductModalOpen(false)}
            onSubmit={handleProductSubmit}
            product={selectedProduct}
            mode={productModalMode}
          />
        </Suspense>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && productToDelete && (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onCancel={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDeleteProduct}
          title="Delete Product"
          message={`Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
};

export default AdminDashboard;







