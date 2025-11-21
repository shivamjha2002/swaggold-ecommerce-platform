import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Gem, Camera } from 'lucide-react';
import { toast } from 'react-toastify';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { ResponsiveImage } from '../../components/ResponsiveImage';
import { getImageUrl } from '../../utils/imageUtils';
import { VirtualTryOn } from '../../components/VirtualTryOn';

interface ProductCardProps {
    product: Product;
}

/**
 * ProductCard component - displays individual product with image, name, and price
 * 
 * Features:
 * - Product image with responsive loading
 * - Product name and description
 * - Price display with formatting
 * - Add to cart functionality
 * - Stock status indicator
 * - Hover effects and animations
 * 
 * Requirements: 1.10.2, 1.10.3, 1.10.4, 1.10.5
 */
export const ProductCard = ({ product }: ProductCardProps) => {
    const { addItem } = useCart();
    const navigate = useNavigate();
    const [showVirtualTryOn, setShowVirtualTryOn] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const handleProductClick = () => {
        navigate(`/products/${product.id}`);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();

        // Check if product is in stock
        if (!product.is_active || product.stock_quantity === 0) {
            toast.error('This product is out of stock');
            return;
        }

        // Add to cart
        addItem(product, 1);
        toast.success(`${product.name} added to cart!`);
    };

    const handleWishlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        toast.info('Wishlist feature coming soon!');
    };

    const handleVirtualTryOn = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowVirtualTryOn(true);
    };

    return (
        <>
            <div
                className="group bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 sm:transform sm:hover:scale-105 overflow-hidden border border-gray-100 cursor-pointer touch-manipulation"
                onClick={handleProductClick}
            >
                <div className="relative overflow-hidden">
                    {/* Out of Stock Badge */}
                    {!product.is_active && (
                        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full z-10 shadow-lg">
                            Out of Stock
                        </div>
                    )}

                    {/* Product Image */}
                    <div className="aspect-square overflow-hidden">
                        <ResponsiveImage
                            src={getImageUrl(product.image_url)}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            loading="lazy"
                            aspectRatio="1/1"
                        />
                    </div>

                    {/* Hover Overlay - Desktop only */}
                    <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Action Buttons - Desktop hover, Mobile always visible */}
                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 space-y-2">
                        <button
                            className="p-2 sm:p-2.5 bg-white rounded-full shadow-lg hover:bg-yellow-50 transition-colors duration-300 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                            onClick={handleWishlist}
                            aria-label="Add to wishlist"
                        >
                            <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 hover:text-red-500" />
                        </button>
                        <button
                            className="p-2 sm:p-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:from-purple-600 hover:to-pink-600 transition-colors duration-300 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                            onClick={handleVirtualTryOn}
                            aria-label="Virtual Try-On"
                        >
                            <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </button>
                        <button
                            className="p-2 sm:p-2.5 bg-white rounded-full shadow-lg hover:bg-yellow-50 transition-colors duration-300 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                            onClick={handleAddToCart}
                            disabled={!product.is_active || product.stock_quantity === 0}
                            aria-label="Add to cart"
                        >
                            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 hover:text-yellow-600" />
                        </button>
                    </div>
                </div>

                {/* Product Details */}
                <div className="p-4 sm:p-6">
                    {/* Category and Purity */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 sm:px-3 sm:py-1 rounded-full">
                            {product.category}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                            {product.gold_purity} Gold
                        </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors duration-300 line-clamp-1">
                        {product.name}
                    </h3>

                    {/* Product Description - Hidden on mobile for cleaner look */}
                    <p className="hidden sm:block text-sm text-gray-600 mb-4 line-clamp-2">
                        {product.description}
                    </p>

                    {/* Product Specifications */}
                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-gray-600">Weight:</span>
                            <span className="font-semibold text-gray-900">{product.weight}g</span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-gray-600">Base Price:</span>
                            <span className="font-semibold text-gray-900">{formatPrice(product.base_price)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-gray-600">Current Price:</span>
                            <span className="text-lg sm:text-xl font-bold text-yellow-600">
                                {formatPrice(product.current_price)}
                            </span>
                        </div>
                    </div>

                    {/* Stock and Icon */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <Gem className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                        <span className="text-xs text-gray-500">
                            Stock: {product.stock_quantity}
                        </span>
                    </div>

                    {/* Add to Cart Button - Mobile optimized */}
                    <button
                        className={`w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 sm:transform sm:hover:scale-105 shadow-lg min-h-[44px] touch-manipulation active:scale-95 ${product.is_active && product.stock_quantity > 0
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        disabled={!product.is_active || product.stock_quantity === 0}
                        onClick={handleAddToCart}
                    >
                        {product.is_active && product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>

                    {/* Virtual Try-On Button */}
                    <button
                        className="w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 sm:transform sm:hover:scale-105 shadow-lg min-h-[44px] touch-manipulation active:scale-95 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 flex items-center justify-center space-x-2 mt-2"
                        onClick={handleVirtualTryOn}
                    >
                        <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Try Virtually</span>
                    </button>
                </div>
            </div>

            {/* Virtual Try-On Modal */}
            {showVirtualTryOn && (
                <VirtualTryOn
                    productImage={getImageUrl(product.image_url)}
                    productName={product.name}
                    productCategory={product.category}
                    onClose={() => setShowVirtualTryOn(false)}
                />
            )}
        </>
    );
};
