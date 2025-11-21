import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Heart, ShoppingCart, Gem, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { productService } from '../services/productService';
import { Product, ProductFilters } from '../types';
import ProductDetailModal from '../components/ProductDetailModal';
import { ProductListSkeleton } from '../components/SkeletonLoader';
import { debounce } from '../utils/debounce';
import { getErrorMessage } from '../utils/errorHandler';
import { useCart } from '../context/CartContext';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { getImageUrl } from '../utils/imageUtils';

const Products = () => {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000000 });
  const [weightRange, setWeightRange] = useState<{ min: number; max: number }>({ min: 0, max: 100 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = ['All', 'Nath', 'Pendant Set', 'Tika', 'Necklace', 'Earrings', 'Bangles', 'Ring', 'Bracelet', 'Bridal Set'];

  // Debounce search term updates
  const debouncedSetSearchTerm = useMemo(
    () => debounce((value: unknown) => {
      setDebouncedSearchTerm(value as string);
    }, 300),
    []
  );

  // Update debounced search term when search term changes
  useEffect(() => {
    debouncedSetSearchTerm(searchTerm);
  }, [searchTerm, debouncedSetSearchTerm]);

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, priceRange, weightRange, currentPage]);

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

      if (priceRange.min > 0) {
        filters.price_min = priceRange.min;
      }

      if (priceRange.max < 10000000) {
        filters.price_max = priceRange.max;
      }

      if (weightRange.min > 0) {
        filters.weight_min = weightRange.min;
      }

      if (weightRange.max < 100) {
        filters.weight_max = weightRange.max;
      }

      const response = await productService.getProducts(filters);
      setProducts(response.data);
      setTotalPages(response.pagination.total_pages);
    } catch (err) {
      setError(getErrorMessage(err));
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Use debounced search term for filtering
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({ min, max });
    setCurrentPage(1);
  };

  const handleWeightRangeChange = (min: number, max: number) => {
    setWeightRange({ min, max });
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = (product: Product) => {
    // Check if product is in stock
    if (!product.is_active || product.stock_quantity === 0) {
      toast.error('This product is out of stock');
      return;
    }

    // Add to cart
    addItem(product, 1);
    toast.success(`${product.name} added to cart!`);
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
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                      selectedCategory === category
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

            {/* Price and Weight Range Filters */}
            <div className="grid md:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-lg">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Price Range
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={priceRange.min || ''}
                    onChange={(e) => handlePriceRangeChange(Number(e.target.value) || 0, priceRange.max)}
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={priceRange.max === 10000000 ? '' : priceRange.max}
                    onChange={(e) => handlePriceRangeChange(priceRange.min, Number(e.target.value) || 10000000)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Weight Range (grams)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    placeholder="Min"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={weightRange.min || ''}
                    onChange={(e) => handleWeightRangeChange(Number(e.target.value) || 0, weightRange.max)}
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    value={weightRange.max === 100 ? '' : weightRange.max}
                    onChange={(e) => handleWeightRangeChange(weightRange.min, Number(e.target.value) || 100)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <ProductListSkeleton count={12} />
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
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

        {/* Products Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 overflow-hidden border border-gray-100 cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="relative overflow-hidden">
                    {!product.is_active && (
                      <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-lg">
                        Out of Stock
                      </div>
                    )}

                    <div className="aspect-square overflow-hidden">
                      <ResponsiveImage
                        src={getImageUrl(product.image_url)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        loading="lazy"
                      />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
                      <button 
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-yellow-50 transition-colors duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('Added to wishlist!');
                        }}
                      >
                        <Heart className="h-5 w-5 text-gray-600 hover:text-red-500" />
                      </button>
                      <button 
                        className="p-2 bg-white rounded-full shadow-lg hover:bg-yellow-50 transition-colors duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                      >
                        <ShoppingCart className="h-5 w-5 text-gray-600 hover:text-yellow-600" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                        {product.category}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {product.gold_purity} Gold
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors duration-300 line-clamp-1">
                      {product.name}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Weight:</span>
                        <span className="font-semibold text-gray-900">{product.weight}g</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Base Price:</span>
                        <span className="font-semibold text-gray-900">{formatPrice(product.base_price)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Price:</span>
                        <span className="text-xl font-bold text-yellow-600">
                          {formatPrice(product.current_price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <Gem className="h-5 w-5 text-yellow-500" />
                      <span className="text-xs text-gray-500">
                        Stock: {product.stock_quantity}
                      </span>
                    </div>

                    <button
                      className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                        product.is_active && product.stock_quantity > 0
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!product.is_active || product.stock_quantity === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      {product.is_active && product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-12">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-yellow-400 shadow-md hover:shadow-lg'
                  }`}
                >
                  Previous
                </button>
                
                <span className="text-gray-700 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-yellow-400 shadow-md hover:shadow-lg'
                  }`}
                >
                  Next
                </button>
              </div>
            )}

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <Gem className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};

export default Products;