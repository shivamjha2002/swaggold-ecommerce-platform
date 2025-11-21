import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { NavBar } from './components/layout/NavBar';
import Footer from './components/Footer';
import { CartDebug } from './components/CartDebug';
import SkipToContent from './components/SkipToContent';

// Eager load critical components
import Homepage from './pages/Homepage';
import LandingPage from './pages/LandingPage';

// Lazy load heavy/less critical components
const About = lazy(() => import('./pages/About'));
const Products = lazy(() => import('./pages/Products'));
const ProductListPage = lazy(() => import('./pages/products/ProductListPage').then(module => ({ default: module.ProductListPage })));
const ProductDetailPage = lazy(() => import('./pages/products/ProductDetailPage').then(module => ({ default: module.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/cart/CartPage'));
const Checkout = lazy(() => import('./pages/Checkout'));
const CheckoutPage = lazy(() => import('./pages/checkout/CheckoutPage'));
const Khata = lazy(() => import('./pages/Khata'));
const Predictions = lazy(() => import('./pages/Predictions'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Contact = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const PriceTrendPage = lazy(() => import('./pages/prices/PriceTrendPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardNew = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite" aria-label="Loading page">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600" aria-hidden="true"></div>
    <span className="sr-only">Loading page content...</span>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
              <SkipToContent />
              <NavBar />
              <main id="main-content" role="main" tabIndex={-1}>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/home" element={<Homepage />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                    {/* Auth Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* Protected Routes - Require Authentication */}
                    <Route
                      path="/products-list"
                      element={
                        <ProtectedRoute>
                          <ProductListPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/products/:id"
                      element={
                        <ProtectedRoute>
                          <ProductDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/cart"
                      element={
                        <ProtectedRoute>
                          <CartPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/checkout-new"
                      element={
                        <ProtectedRoute>
                          <CheckoutPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/price-trends"
                      element={
                        <ProtectedRoute>
                          <PriceTrendPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/khata"
                      element={
                        <ProtectedRoute>
                          <Khata />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/predictions"
                      element={
                        <ProtectedRoute>
                          <Predictions />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Routes - Require Admin Role */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminDashboardNew />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/products"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminProductsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/orders"
                      element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminOrdersPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 404 Not Found - Catch all unmatched routes */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <CartDebug />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </div>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;