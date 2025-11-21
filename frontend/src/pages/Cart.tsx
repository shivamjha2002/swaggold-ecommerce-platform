import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { getImageUrl } from '../utils/imageUtils';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();

  // Calculate tax (assuming 3% GST)
  const taxRate = 0.03;
  const subtotal = total;
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="mx-auto h-24 w-24 text-gray-400 mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Cart Items ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </h2>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-lg hover:border-yellow-500 transition-colors"
                    >
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <ResponsiveImage
                          src={getImageUrl(item.product.image_url)}
                          alt={item.product.name}
                          className="w-24 h-24 object-cover rounded-lg"
                          sizes="96px"
                          loading="eager"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.product.category} • {item.product.gold_purity} Gold • {item.product.weight}g
                        </p>
                        <p className="text-lg font-bold text-yellow-600">
                          ₹{item.product.current_price.toLocaleString('en-IN')}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4">
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                            className="p-3 min-w-touch min-h-touch hover:bg-gray-100 rounded-l-lg transition-colors flex items-center justify-center"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="px-4 py-2 font-semibold text-gray-900 min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                            className="p-3 min-w-touch min-h-touch hover:bg-gray-100 rounded-r-lg transition-colors flex items-center justify-center disabled:opacity-50"
                            aria-label="Increase quantity"
                            disabled={item.quantity >= item.product.stock_quantity}
                          >
                            <Plus className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="p-3 min-w-touch min-h-touch text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="flex sm:flex-col items-center justify-between sm:justify-center">
                        <span className="text-sm text-gray-600 sm:mb-2">Total:</span>
                        <span className="text-lg font-bold text-gray-900">
                          ₹{(item.product.current_price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Continue Shopping Button */}
            <div className="mt-6">
              <Link
                to="/products"
                className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-semibold"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax (3% GST):</span>
                  <span className="font-semibold">₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total:</span>
                    <span className="text-yellow-600">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <button
                className="w-full bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-yellow-700 transition-colors mb-3"
              >
                Proceed to Checkout
              </button>

              <p className="text-xs text-gray-500 text-center">
                Secure checkout powered by Swati Jewellers
              </p>

              {/* Additional Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">We Accept:</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">Cash</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">Card</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">UPI</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">Khata</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
