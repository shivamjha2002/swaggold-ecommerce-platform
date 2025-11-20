import { useState, useEffect } from 'react';
import { Search, Filter, AlertCircle } from 'lucide-react';
import { productService } from '../../services/productService';
import { Product, ProductFilters } from '../../types';
import { ProductCard } from './ProductCard';
import { ProductListSkeleton } from '../../components/SkeletonLoader';
import { getErrorMessage } from '../../utils/errorHandler';

/**
 * ProductListPage component - displays a grid of products with authentication gate
 * 
 * Features:
 * - Wrapped with ProtectedRoute component (in App.tsx routing)
 * - Grid layout for product cards
 * - Fetches products from GET /api/products endpoint
 * - Loading skeletons for products
 * - Pagination controls
 * - Empty state when no products exist
 * - Error message if API call fails
 * 
 * Requirements: 1.2.1, 1.10.2, 1.10.3, 1.10.4, 1.10.5
 */
export const ProductListPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
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

    // Fetch products from GET /api/products endpoint
    useEffect(() => {
        fetchProducts();
    }, [selectedCategory, currentPage]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);

            const filters: ProductFilters = {
                page: currentPage,
                per_page: 12,
            };

            if (selectedCategory !== 'All') {
                filters.category = selectedCategory;
            }

            const response = await productService.getProducts(filters);
            setProducts(response.data);
            setTotalPages(response.pagination.total_pages);
            setTotalProducts(response.pagination.total);
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter products by search term (client-side filtering)
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setCurrentPage(1); // Reset to first page when category changes
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Hero Section */}
            <section className="py-16 bg-gradient-to-r from-black via-gray-900 to-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                            Our Collections
                        </span>
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                        Discover our extensive range of handcrafted gold and diamond jewelry,
                        each piece designed to celebrate life's precious moments.
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Search and Filter */}
                <div className="mb-12">
                    <div className="flex flex-col space-y-6">
                        {/* Search */}
                        <div className="relative flex-1 max-w-lg">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search jewelry..."
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300 shadow-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-start space-x-2">
                            <Filter className="h-5 w-5 text-gray-600 mt-2" />
                            <div className="flex flex-wrap gap-2">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${selectedCategory === category
                                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:border-yellow-400 shadow-md'
                                            }`}
                                        onClick={() => handleCategoryChange(category)}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State - Add loading skeletons for products */}
                {loading && <ProductListSkeleton count={12} />}

                {/* Error State - Display error message if API call fails */}
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

                {/* Products Grid - Implement grid layout for product cards */}
                {!loading && !error && (
                    <>
                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            // Empty state when no products exist
                            <div className="text-center py-20">
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
                                        : selectedCategory !== 'All'
                                            ? `No products available in the ${selectedCategory} category`
                                            : 'No products are currently available'}
                                </p>
                                {(searchTerm || selectedCategory !== 'All') && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSelectedCategory('All');
                                        }}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Pagination Controls - Implement pagination controls */}
                        {totalPages > 1 && filteredProducts.length > 0 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 mt-12">
                                <div className="text-sm text-gray-600">
                                    Showing page {currentPage} of {totalPages} ({totalProducts} total products)
                                </div>

                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
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
                                        onClick={() => handlePageChange(currentPage + 1)}
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
