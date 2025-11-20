import { X, ShoppingCart, Heart, Gem, Star, Package, Scale, Award } from 'lucide-react';
import { Product } from '../types';
import OptimizedImage from './OptimizedImage';
import { getImageUrl } from '../utils/imageUtils';

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
}

const ProductDetailModal = ({ product, isOpen, onClose, onAddToCart }: ProductDetailModalProps) => {
  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product);
    }
    // Show success message or update cart state
    alert('Product added to cart!');
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
                <OptimizedImage
                  src={getImageUrl(product.image_url)}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                  width={800}
                  height={800}
                  quality={85}
                  lazy={false}
                />
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-4">
                <button className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 border-2 border-gray-300 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all duration-300">
                  <Heart className="h-5 w-5 text-gray-600 hover:text-red-500" />
                  <span className="font-semibold text-gray-700">Add to Wishlist</span>
                </button>
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              {/* Category Badge */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-yellow-600 bg-yellow-100 px-4 py-2 rounded-full">
                  {product.category}
                </span>
                {product.is_active && product.stock_quantity > 0 ? (
                  <span className="text-sm font-semibold text-green-600 bg-green-100 px-4 py-2 rounded-full">
                    In Stock
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-red-600 bg-red-100 px-4 py-2 rounded-full">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Product Name */}
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.0 rating)</span>
              </div>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed">{product.description}</p>

              {/* Specifications */}
              <div className="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-xl border border-yellow-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  <span>Specifications</span>
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Scale className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 font-medium">Weight</span>
                    </div>
                    <span className="text-gray-900 font-semibold">{product.weight} grams</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Gem className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 font-medium">Gold Purity</span>
                    </div>
                    <span className="text-gray-900 font-semibold">{product.gold_purity} HM</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 font-medium">Stock Available</span>
                    </div>
                    <span className="text-gray-900 font-semibold">{product.stock_quantity} units</span>
                  </div>
                </div>
              </div>

              {/* Price Calculation */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Price Breakdown</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Base Price</span>
                    <span className="text-gray-900 font-semibold">{formatPrice(product.base_price)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Gold Rate Adjustment</span>
                    <span className="text-green-600 font-semibold">
                      +{formatPrice(product.current_price - product.base_price)}
                    </span>
                  </div>

                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-gray-900">Current Price</span>
                      <span className="text-3xl font-bold text-yellow-600">
                        {formatPrice(product.current_price)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    * Price includes making charges and current gold rate
                  </p>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!product.is_active || product.stock_quantity === 0}
                className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  product.is_active && product.stock_quantity > 0
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="h-6 w-6" />
                <span>{product.is_active && product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
              </button>

              {/* Additional Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> All our jewelry comes with BIS Hallmark certification and a lifetime warranty on gold purity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
