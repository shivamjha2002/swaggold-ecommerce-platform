import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, AlertCircle, Search, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { Product, CreateProductRequest, UpdateProductRequest, ProductFilters } from '../../types';
import { ProductFormModal } from '../../components/ProductFormModal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { getErrorMessage } from '../../utils/errorHandler';
import { getImageUrl } from '../../utils/imageUtils';
import { toast } from 'react-toastify';

/**
 * AdminProductsPage component for managing products
 * 
 * Features:
 * - Display table of all products with edit/delete actions
 * - Create new products via AddProductModal
 * - Edit existing products via EditProductModal
 * - Delete products with confirmation dialog
 * - Image upload for product images
 * - Calls POST /api/products to create new product
 * - Calls PUT /api/products/:id to update product
 * - Calls DELETE /api/products/:id to remove product
 * 
 * Requirements: 1.10.1, 1.10.2, 1.10.3
 */
export const AdminProductsPage = () => {
    const { user, isAdmin, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // State management
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Delete confirmation dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    // Filters and search
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'published'>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    const categories = [
        'All',
        'Nath',
        'Pendant Set',
        'Tika',
        'Necklace',
        'Earrings',
        'Bangles',
        'Ring',
        'Bracelet',
        'Bridal Set'
    ];

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Fetch products from GET /api/products/admin endpoint
    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);

            const filters: ProductFilters = {
                page: currentPage,
                per_page: 20,
                status: selectedStatus,
            };

            if (selectedCategory !== 'All') {
                filters.category = selectedCategory;
            }

            const response = await productService.getAdminProducts(filters);
            setProducts(response.data);
            setTotalPages(response.pagination.total_pages);
            setTotalProducts(response.pagination.total);
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            console.error('Error fetching products:', err);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    // Load products on mount and when filters change
    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            fetchProducts();
        }
    }, [isAuthenticated, isAdmin, selectedCategory, selectedStatus, currentPage]);

    // Handle create product
    const handleCreateProduct = async (data: CreateProductRequest) => {
        try {
            await productService.createProduct(data);
            toast.success('Product created successfully');
            fetchProducts(); // Refresh the list
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            toast.error(`Failed to create product: ${errorMessage}`);
            throw err; // Re-throw to prevent modal from closing
        }
    };

    // Handle update product
    const handleUpdateProduct = async (data: UpdateProductRequest) => {
        if (!selectedProduct) return;

        try {
            await productService.updateProduct(selectedProduct.id, data);
            toast.success('Product updated successfully');
            fetchProducts(); // Refresh the list
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            toast.error(`Failed to update product: ${errorMessage}`);
            throw err; // Re-throw to prevent modal from closing
        }
    };

    // Handle delete product
    const handleDeleteProduct = async () => {
        if (!productToDelete) return;

        try {
            await productService.deleteProduct(productToDelete.id);
            toast.success('Product deleted successfully');
            setIsDeleteDialogOpen(false);
            setProductToDelete(null);
            fetchProducts(); // Refresh the list
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            toast.error(`Failed to delete product: ${errorMessage}`);
            console.error('Error deleting product:', err);
        }
    };

    // Open create modal
    const openCreateModal = () => {
        setModalMode('create');
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    // Open edit modal
    const openEditModal = (product: Product) => {
        setModalMode('edit');
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    // Open delete confirmation dialog
    const openDeleteDialog = (product: Product) => {
        setProductToDelete(product);
        setIsDeleteDialogOpen(true);
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    // Filter products by search term (client-side filtering)
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

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
                        You don't have permission to access product management. Admin privileges are required.
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
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Manage your product inventory, add new items, and update existing products.
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add New Product
                    </button>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col space-y-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Category and Status Filters */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Category Filter */}
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Filter className="inline h-4 w-4 mr-1" />
                                    Category
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                >
                                    {categories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => {
                                        setSelectedStatus(e.target.value as 'all' | 'draft' | 'published');
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                >
                                    <option value="all">All Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-600 mx-auto"></div>
                            <p className="mt-6 text-lg text-gray-700 font-medium">Loading products...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                        <div className="flex items-center space-x-3">
                            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-800">Error Loading Products</h3>
                                <p className="text-red-600">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchProducts}
                            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Products Table */}
                {!loading && !error && (
                    <>
                        {filteredProducts.length > 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                {/* Desktop Table View */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Product
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Category
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Price
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Weight
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                    Stock
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
                                            {filteredProducts.map((product) => (
                                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-12 w-12 flex-shrink-0">
                                                                <img
                                                                    className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                                                                    src={getImageUrl(product.image_url)}
                                                                    alt={product.name}
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-semibold text-gray-900">
                                                                    {product.name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {product.gold_purity} Gold
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-gray-900">{product.category}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {formatCurrency(product.current_price)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-gray-900">{product.weight}g</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`text-sm font-medium ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {product.stock_quantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status === 'published'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {product.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button
                                                                onClick={() => navigate(`/products/${product.id}`)}
                                                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                                                title="View Product"
                                                            >
                                                                <Eye className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(product)}
                                                                className="text-yellow-600 hover:text-yellow-900 p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                                                                title="Edit Product"
                                                            >
                                                                <Edit className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteDialog(product)}
                                                                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                                title="Delete Product"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="lg:hidden divide-y divide-gray-200">
                                    {filteredProducts.map((product) => (
                                        <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start space-x-4">
                                                <img
                                                    className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                                                    src={getImageUrl(product.image_url)}
                                                    alt={product.name}
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                                                    }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                                {product.name}
                                                            </h3>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {product.category} • {product.gold_purity} Gold
                                                            </p>
                                                        </div>
                                                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${product.status === 'published'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {product.status}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {formatCurrency(product.current_price)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {product.weight}g • Stock: {product.stock_quantity}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => navigate(`/products/${product.id}`)}
                                                                className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                                            >
                                                                <Eye className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(product)}
                                                                className="text-yellow-600 hover:text-yellow-900 p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                                                            >
                                                                <Edit className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteDialog(product)}
                                                                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
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
                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Products Found</h3>
                                <p className="text-gray-600 mb-6">
                                    {searchTerm
                                        ? `No products match your search "${searchTerm}"`
                                        : selectedCategory !== 'All' || selectedStatus !== 'all'
                                            ? 'No products match the selected filters'
                                            : 'Get started by adding your first product'}
                                </p>
                                {(searchTerm || selectedCategory !== 'All' || selectedStatus !== 'all') ? (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSelectedCategory('All');
                                            setSelectedStatus('all');
                                        }}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                ) : (
                                    <button
                                        onClick={openCreateModal}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                                    >
                                        <Plus className="h-5 w-5 mr-2" />
                                        Add Your First Product
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && filteredProducts.length > 0 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 mt-8 bg-white rounded-2xl shadow-lg p-6">
                                <div className="text-sm text-gray-600">
                                    Showing page {currentPage} of {totalPages} ({totalProducts} total products)
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

            {/* Product Form Modal (for both create and edit) */}
            <ProductFormModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSubmit={modalMode === 'create' ? handleCreateProduct : handleUpdateProduct}
                product={selectedProduct}
                mode={modalMode}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                title="Delete Product"
                message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteProduct}
                onCancel={() => {
                    setIsDeleteDialogOpen(false);
                    setProductToDelete(null);
                }}
                variant="danger"
            />
        </div>
    );
};

export default AdminProductsPage;
