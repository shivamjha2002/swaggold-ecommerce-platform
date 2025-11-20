import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Crown,
  ShoppingBag,
  User,
  Home,
  ShoppingCart,
  TrendingUp,
  LogIn,
  UserPlus,
  LogOut,
  Shield,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../utils/imageUtils";

const navItems = [
  { path: "/", name: "Home", icon: Home },
  { path: "/products", name: "Products", icon: ShoppingBag },
  { path: "/predictions", name: "Price Trends", icon: TrendingUp },
  { path: "/about", name: "About", icon: Crown },
];

const Navbar = () => {
  const { items: cartItems, itemCount: cartCount, total: cartTotal } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  // Scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
        ? 'bg-gradient-to-r from-black via-gray-900 to-black shadow-2xl backdrop-blur-lg'
        : 'bg-black/50 backdrop-blur-sm'
        }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-3 group focus:outline-none focus:ring-4 focus:ring-yellow-300 rounded-lg" aria-label="Swati Gold - Home">
            <div className="relative" aria-hidden="true">
              <Crown className="h-10 w-10 text-yellow-400 group-hover:text-yellow-300 transition-all duration-300 transform group-hover:scale-110" />
              <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col leading-tight">
              <span
                className="text-3xl font-extrabold tracking-wide bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent 
                drop-shadow-[0_2px_10px_rgba(255,215,0,0.4)] uppercase"
                style={{ fontFamily: "'Cinzel Decorative', serif", letterSpacing: "1px" }}
              >
                SWAGGOLD
              </span>
              <span
                className="text-sm text-gray-300 font-medium tracking-widest italic"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                — Swati Jewellers —
              </span>
              <span
                className="text-xs text-yellow-400 tracking-widest mt-1 font-semibold"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Style & Fancy Jewellery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map(({ path, name, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 relative ${isActive(path)
                  ? "bg-yellow-400 text-black font-semibold"
                  : "text-white hover:text-yellow-400 hover:bg-white/10"
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{name}</span>
              </Link>
            ))}
          </div>

          {/* Cart + Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Cart with Preview */}
            <div
              className="relative"
              onMouseEnter={() => setShowCartPreview(true)}
              onMouseLeave={() => setShowCartPreview(false)}
            >
              <Link
                to="/cart"
                className="relative flex items-center space-x-2 px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all duration-300 shadow-lg"
              >
                <ShoppingCart className="h-5 w-5 text-yellow-600" />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Cart Preview Dropdown */}
              {showCartPreview && cartItems.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-black border border-gray-700 rounded-lg shadow-2xl z-50 animate-fadeIn">
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center justify-between">
                      <span>Shopping Cart</span>
                      <span className="text-sm text-gray-400">{cartCount} items</span>
                    </h3>

                    {/* Cart Items */}
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {cartItems.map((item) => (
                        <div key={item.product.id} className="flex items-center space-x-3 py-2 border-b border-gray-800">
                          <img
                            src={getImageUrl(item.product.image_url)}
                            alt={item.product.name}
                            className="w-12 h-12 bg-gray-800 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.product.name}</p>
                            <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-yellow-400 text-sm font-semibold">
                            ₹{((item.product?.current_price || item.product?.base_price || 0) * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Cart Summary */}
                    <div className="mt-4 pt-3 border-t border-gray-800">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-400 text-sm">Subtotal:</span>
                        <span className="text-white font-semibold text-lg">
                          ₹{cartTotal.toLocaleString()}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Link
                          to="/cart"
                          className="block w-full text-center px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all duration-300"
                        >
                          View Cart
                        </Link>
                        <Link
                          to="/checkout"
                          className="block w-full text-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300"
                        >
                          Checkout
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
                >
                  <User className="h-4 w-4" />
                  <span className="font-medium">{user?.username || user?.email}</span>
                  {isAdmin && <Shield className="h-4 w-4 text-yellow-400" />}
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-black border border-gray-700 rounded-lg shadow-xl z-50">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center space-x-2 px-4 py-3 text-yellow-400 hover:bg-yellow-400/20 transition-all duration-300 border-b border-gray-800"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Admin Dashboard</span>
                      </Link>
                    )}
                    <Link
                      to="/orders"
                      className="flex items-center space-x-2 px-4 py-3 text-white hover:bg-white/10 transition-all duration-300"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>My Orders</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center space-x-2 px-4 py-3 w-full text-left text-red-400 hover:bg-red-400/20 transition-all duration-300 border-t border-gray-800"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-4 py-2 text-white hover:text-yellow-400 hover:bg-white/10 rounded-lg transition-all duration-300"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="font-medium">Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-all duration-300"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </div>

          {/* 📱 Mobile Toggle */}
          <button
            className="md:hidden p-3 min-w-touch min-h-touch rounded-lg text-white hover:bg-white/10 transition flex items-center justify-center"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black border-t border-gray-800 animate-slideDown">
          <div className="px-4 py-4 space-y-2">
            {navItems.map(({ path, name, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${isActive(path)
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold"
                  : "text-white hover:bg-white/10 hover:text-yellow-400"
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{name}</span>
              </Link>
            ))}

            {/* Mobile Cart Link */}
            <Link
              to="/cart"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 hover:text-yellow-400 transition-all duration-300"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="font-medium">Cart</span>
              {cartCount > 0 && (
                <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Auth Section */}
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-yellow-500 text-black font-semibold transition-all duration-300"
                  >
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">Admin Dashboard</span>
                  </Link>
                )}
                <Link
                  to="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 hover:text-yellow-400 transition-all duration-300"
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span className="font-medium">My Orders</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-400/20 transition-all duration-300 w-full text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 hover:text-yellow-400 transition-all duration-300"
                >
                  <LogIn className="h-5 w-5" />
                  <span className="font-medium">Login</span>
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-yellow-500 text-black font-semibold transition-all duration-300"
                >
                  <UserPlus className="h-5 w-5" />
                  <span className="font-medium">Sign Up</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;









