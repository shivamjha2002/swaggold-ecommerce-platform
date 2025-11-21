import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Eager load critical components
import Homepage from './pages/Homepage';

// Lazy load heavy/less critical components
const About = lazy(() => import('./pages/About'));
const Products = lazy(() => import('./pages/Products'));
const Cart = lazy(() => import('./pages/Cart'));
const Khata = lazy(() => import('./pages/Khata'));
const Predictions = lazy(() => import('./pages/Predictions'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Signup = lazy(() => import('./pages/Signup'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
              <Navbar />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Homepage />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/khata" element={<Khata />} />
                  <Route path="/predictions" element={<Predictions />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/contact" element={<Contact />} />
                </Routes>
              </Suspense>
              <Footer />
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