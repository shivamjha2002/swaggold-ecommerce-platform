import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, AlertCircle, Gem, Weight, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import { Product } from '../../types';
import { productService } from '../../services/productService';
import { useCart } from '../../context/CartContext';
import { getErrorMessage } from '../../utils/errorHandler';
import { getImageUrl } from '../../utils/imageUtils';
import { ResponsiveImage } from '../../components/ResponsiveImage';

/**
 * ProductDetailPage component - displays detailed product information with add to cart
 * 
 * Features:
 * - Wrapped with ProtectedRoute component (in App.tsx routing)
 * - Fetches product details from GET /api/products/:id endpoint
 * - Displays product image gallery with thumbnail navigation
 * - Shows product information: name, description, price, weight, purity
 * - Quantity selector with increment/decrement buttons
 * - Add to Cart button
 * - Calls POST /api/cart/items when add to cart is clicked
 * - Shows success toast notification on successful add
 * - Handles out of stock state by disabling add to cart button
 * 
 * Requirements: 1.2.2, 1.12.2, 1.12.3
 */
export const ProductDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addItem } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [addingToCart, setAddingToCart] = useState(false);

    // Fetch product details from GET /api/products/:id endpoint
    useEffect(() => {
        const fetchProductDetails = async () => {
            if (!id) {
                setError('Product ID is missing');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const response = await productService.getProductById(id);

                if (response.success && response.data) {
                    setProduct(response.data);
                } else {
                    setError('Product not found');
                }
            } catch (err) {
                const errorMessage = getErrorMessage(err);
                setError(errorMessage);
                console.error('Error fetching product details:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetails();
    }, [id]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    // Quantity selector with increment/decrement buttons
    const handleIncrement = () => {
        if (product && quantity < product.stock_quantity) {
            setQuantity(prev => prev + 1);
        }
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0 && product && value <= product.stock_quantity) {
            setQuantity(value);
        }
    };

    // Navigate through image gallery
    const handlePreviousImage = () => {
        if (product && product.image_url) {
            setSelectedImageIndex(prev =>
                prev === 0 ? 0 : prev - 1
            );
        }
    };

    const handleNextImage = () => {
        if (product && product.image_url) {
            setSelectedImageIndex(prev =>
                prev === 0 ? 0 : prev + 1
            );
        }
    };

    // Call POST /api/cart/items when add to cart is clicked
    // Show success toast notification on successful add
    const handleAddToCart = async () => {
        if (!product) return;

        // Handle out of stock state by disabling add to cart button
        if (!product.is_active || product.stock_quantity === 0) {
            toast.error('This product is out of stock');
            return;
        }

        try {
            setAddingToCart(true);

            // Add to cart using CartContext
            addItem(product, quantity);

            // Show success toast notification on successful add
            toast.success(`${product.name} (${quantity}x) added to cart!`, {
                position: 'top-right',
                autoClose: 3000,
            });

            // Reset quantity to 1 after adding
            setQuantity(1);
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            toast.error(`Failed to add to cart: ${errorMessage}`);
            console.error('Error adding to cart:', err);
        } finally {
            setAddingToCart(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="animate-pulse">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Image skeleton */}
                            <div className="space-y-4">
                                <div className="aspect-square bg-gray-300 rounded-2xl"></div>
                                <div className="flex space-x-2">
                                    <div className="w-20 h-20 bg-gray-300 rounded-lg"></div>
                                    <div className="w-20 h-20 bg-gray-300 rounded-lg"></div>
                                    <div className="w-20 h-20 bg-gray-300 rounded-lg"></div>
                                </div>
                            </div>
                            {/* Details skeleton */}
                            <div className="space-y-6">
                                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                                <div className="h-12 bg-gray-300 rounded w-1/2"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-300 rounded"></div>
                                    <div className="h-4 bg-gray-300 rounded"></div>
                                    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !product) {
        return (
            <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Product</h2>
                        <p className="text-red-600 mb-6">{error || 'Product not found'}</p>
                        <button
                            onClick={() => navigate('/products-list')}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Back to Products
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isOutOfStock = !product.is_active || product.stock_quantity === 0;
    const images = product.image_url ? [product.image_url] : [];

    return (
        <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Back button */}
                <button
                    onClick={() => navigate('/products-list')}
                    className="flex items-center text-gray-600 hover:text-yellow-600 mb-8 transition-colors"
                >
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Back to Products
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Product Image Gallery */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="relative aspect-square bg-white rounded-2xl shadow-xl overflow-hidden group">
                            {isOutOfStock && (
                                <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full z-10 shadow-lg">
                                    Out of Stock
                                </div>
                            )}

                            <ResponsiveImage
                                src={getImageUrl(images[selectedImageIndex] || product.image_url)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />

                            {/* Navigation arrows (only if multiple images) */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={handlePreviousImage}
                                        disabled={selectedImageIndex === 0}
                                        className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg transition-all ${selectedImageIndex === 0
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:bg-white hover:scale-110'
                                            }`}
                                        aria-label="Previous image"
                                    >
                                        <ChevronLeft className="h-6 w-6 text-gray-800" />
                                    </button>
                                    <button
                                        onClick={handleNextImage}
                                        disabled={selectedImageIndex === images.length - 1}
                                        className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg transition-all ${selectedImageIndex === images.length - 1
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:bg-white hover:scale-110'
                                            }`}
                                        aria-label="Next image"
                                    >
                                        <ChevronRight className="h-6 w-6 text-gray-800" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnail Navigation (only if multiple images) */}
                        {images.length > 1 && (
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                                {images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                                                ? 'border-yellow-500 shadow-lg scale-105'
                                                : 'border-gray-300 hover:border-yellow-400'
                                            }`}
                                    >
                                        <ResponsiveImage
                                            src={getImageUrl(image)}
                                            alt={`${product.name} thumbnail ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            sizes="80px"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Information */}
                    <div className="space-y-6">
                        {/* Category Badge */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-yellow-600 bg-yellow-100 px-4 py-2 rounded-full">
                                {product.category}
                            </span>
                            {product.status === 'draft' && (
                                <span className="text-sm font-semibold text-gray-600 bg-gray-200 px-4 py-2 rounded-full">
                                    Draft
                                </span>
                            )}
                        </div>

                        {/* Product Name */}
                        <h1 className="text-4xl font-bold text-gray-900">
                            {product.name}
                        </h1>

                        {/* Price */}
                        <div className="space-y-2">
                            <div className="flex items-baseline space-x-4">
                                <span className="text-4xl font-bold text-yellow-600">
                                    {formatPrice(product.current_price)}
                                </span>
                                {product.base_price !== product.current_price && (
                                    <span className="text-xl text-gray-500 line-through">
                                        {formatPrice(product.base_price)}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600">
                                Inclusive of all taxes
                            </p>
                        </div>

                        {/* Product Specifications */}
                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Specifications</h3>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Weight className="h-5 w-5 text-yellow-600" />
                                    <span className="text-gray-700 font-medium">Weight</span>
                                </div>
                                <span className="text-gray-900 font-bold">{product.weight}g</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Shield className="h-5 w-5 text-yellow-600" />
                                    <span className="text-gray-700 font-medium">Purity</span>
                                </div>
                                <span className="text-gray-900 font-bold">{product.gold_purity} Gold</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Gem className="h-5 w-5 text-yellow-600" />
                                    <span className="text-gray-700 font-medium">Stock</span>
                                </div>
                                <span className={`font-bold ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                                    {isOutOfStock ? 'Out of Stock' : `${product.stock_quantity} Available`}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
                            <p className="text-gray-700 leading-relaxed">
                                {product.description || 'No description available.'}
                            </p>
                        </div>

                        {/* Quantity Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantity
                            </label>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handleDecrement}
                                    disabled={quantity <= 1 || isOutOfStock}
                                    className={`p-2 rounded-lg border-2 transition-all ${quantity <= 1 || isOutOfStock
                                            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                            : 'border-yellow-400 text-yellow-600 hover:bg-yellow-50'
                                        }`}
                                    aria-label="Decrease quantity"
                                >
                                    <Minus className="h-5 w-5" />
                                </button>

                                <input
                                    type="number"
                                    min="1"
                                    max={product.stock_quantity}
                                    value={quantity}
                                    onChange={handleQuantityChange}
                                    disabled={isOutOfStock}
                                    className="w-20 text-center text-lg font-bold border-2 border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />

                                <button
                                    onClick={handleIncrement}
                                    disabled={quantity >= product.stock_quantity || isOutOfStock}
                                    className={`p-2 rounded-lg border-2 transition-all ${quantity >= product.stock_quantity || isOutOfStock
                                            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                            : 'border-yellow-400 text-yellow-600 hover:bg-yellow-50'
                                        }`}
                                    aria-label="Increase quantity"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>

                                {!isOutOfStock && (
                                    <span className="text-sm text-gray-600">
                                        Max: {product.stock_quantity}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={isOutOfStock || addingToCart}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 ${isOutOfStock
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : addingToCart
                                        ? 'bg-yellow-400 text-black cursor-wait'
                                        : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600'
                                }`}
                        >
                            {addingToCart ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                                    <span>Adding to Cart...</span>
                                </>
                            ) : isOutOfStock ? (
                                <span>Out of Stock</span>
                            ) : (
                                <>
                                    <ShoppingCart className="h-5 w-5" />
                                    <span>Add to Cart</span>
                                </>
                            )}
                        </button>

                        {/* Additional Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> All our products come with a certificate of authenticity and are hallmarked for purity.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
