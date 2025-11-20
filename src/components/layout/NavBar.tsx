import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Logo } from '../common/Logo';
import { CartIcon } from './CartIcon';

/**
 * CartIconBadge Component
 * Helper component to display cart item count badge in mobile menu
 */
const CartIconBadge: React.FC = () => {
    const { itemCount } = useCart();

    if (itemCount === 0) {
        return null;
    }

    return (
        <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-gradient-to-r from-gold-500 to-gold-600 rounded-full">
            {itemCount > 99 ? '99+' : itemCount}
        </span>
    );
};

/**
 * NavBar Component
 * 
 * Main navigation bar with authentication state management.
 * Features:
 * - Swati Gold branding with logo
 * - Conditional rendering based on auth state
 * - Login/Signup buttons for unauthenticated users
 * - User avatar and logout for authenticated users
 * - Separate Admin button
 * - Mobile hamburger menu with slide-out drawer
 * - Sticky on scroll
 * - Cart icon with item count badge
 */
export const NavBar: React.FC = () => {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Handle scroll effect for sticky navbar
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    const handleLogout = async () => {
        try {
            await logout();
            setShowUserMenu(false);
            setIsMobileMenuOpen(false);
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
            // Still navigate to home even if logout fails
            setShowUserMenu(false);
            setIsMobileMenuOpen(false);
            navigate('/');
        }
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-white shadow-lg'
                    : 'bg-white/95 backdrop-blur-sm'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo Section */}
                        <Link to="/" className="flex-shrink-0" onClick={closeMobileMenu}>
                            <Logo size="md" variant="full" showText={true} />
                        </Link>

                        {/* Desktop Navigation - Center Links */}
                        <div className="hidden md:flex items-center space-x-1 flex-1 justify-center">
                            <Link
                                to="/"
                                className="px-4 py-2 rounded-lg text-neutral-700 hover:text-gold-600 hover:bg-gold-50 font-medium transition-all duration-200"
                            >
                                Home
                            </Link>
                            <Link
                                to="/products"
                                className="px-4 py-2 rounded-lg text-neutral-700 hover:text-gold-600 hover:bg-gold-50 font-medium transition-all duration-200"
                            >
                                Products
                            </Link>
                            <Link
                                to="/predictions"
                                className="px-4 py-2 rounded-lg text-neutral-700 hover:text-gold-600 hover:bg-gold-50 font-medium transition-all duration-200"
                            >
                                Price Trends
                            </Link>
                            <Link
                                to="/about"
                                className="px-4 py-2 rounded-lg text-neutral-700 hover:text-gold-600 hover:bg-gold-50 font-medium transition-all duration-200"
                            >
                                About
                            </Link>
                        </div>

                        {/* Desktop Navigation - Right Side */}
                        <div className="hidden md:flex items-center space-x-4">
                            {/* Cart Icon - Only for authenticated users */}
                            <CartIcon />

                            {/* Admin Button - Links to admin login for unauthenticated, admin dashboard for authenticated */}
                            <Link
                                to={isAuthenticated && isAdmin ? "/admin" : "/admin/login"}
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-neutral-700 hover:text-gold-600 hover:bg-gold-50 transition-all duration-200"
                            >
                                <Shield className="h-4 w-4" />
                                <span className="font-medium">Admin</span>
                            </Link>

                            {/* Authentication Section */}
                            {isAuthenticated ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gold-50 text-gold-700 hover:bg-gold-100 transition-all duration-200"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-semibold text-sm">
                                            {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <span className="font-medium">{user?.username || user?.email}</span>
                                        {isAdmin && <Shield className="h-4 w-4 text-gold-600" />}
                                    </button>

                                    {/* User Dropdown Menu */}
                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-neutral-200 py-2 z-50">
                                            <div className="px-4 py-3 border-b border-neutral-200">
                                                <p className="text-sm font-medium text-neutral-900">{user?.username || 'User'}</p>
                                                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                                                {isAdmin && (
                                                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-gold-100 text-gold-800">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center space-x-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-all duration-200"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span className="font-medium">Logout</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <Link
                                        to="/login"
                                        className="px-4 py-2 rounded-lg text-neutral-700 hover:text-gold-600 hover:bg-gold-50 font-medium transition-all duration-200"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold hover:from-gold-600 hover:to-gold-700 shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex md:hidden items-center space-x-2">
                            {/* Cart Icon for Mobile - Only for authenticated users */}
                            <CartIcon />

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="mobile-menu-button p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-all duration-200"
                                aria-label="Toggle menu"
                                aria-expanded={isMobileMenuOpen}
                            >
                                {isMobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Slide-out Drawer */}
            <div
                className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={closeMobileMenu}
                />

                {/* Drawer */}
                <div
                    className={`mobile-menu absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >
                    <div className="flex flex-col h-full">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                            <Logo size="sm" variant="full" showText={true} />
                            <button
                                onClick={closeMobileMenu}
                                className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-all duration-200"
                                aria-label="Close menu"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-4">
                                {/* User Info Section (if authenticated) */}
                                {isAuthenticated && (
                                    <div className="pb-4 border-b border-neutral-200">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold text-lg">
                                                {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-neutral-900 truncate">
                                                    {user?.username || 'User'}
                                                </p>
                                                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                                                {isAdmin && (
                                                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-gold-100 text-gold-800">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Links */}
                                <div className="space-y-2 pb-4 border-b border-neutral-200">
                                    <Link
                                        to="/"
                                        onClick={closeMobileMenu}
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-gold-50 hover:text-gold-700 transition-all duration-200"
                                    >
                                        <span className="font-medium">Home</span>
                                    </Link>
                                    <Link
                                        to="/products"
                                        onClick={closeMobileMenu}
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-gold-50 hover:text-gold-700 transition-all duration-200"
                                    >
                                        <span className="font-medium">Products</span>
                                    </Link>
                                    <Link
                                        to="/predictions"
                                        onClick={closeMobileMenu}
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-gold-50 hover:text-gold-700 transition-all duration-200"
                                    >
                                        <span className="font-medium">Price Trends</span>
                                    </Link>
                                    <Link
                                        to="/about"
                                        onClick={closeMobileMenu}
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-gold-50 hover:text-gold-700 transition-all duration-200"
                                    >
                                        <span className="font-medium">About</span>
                                    </Link>
                                </div>

                                {/* Cart Link - Only for authenticated users */}
                                {isAuthenticated && (
                                    <Link
                                        to="/cart"
                                        onClick={closeMobileMenu}
                                        className="flex items-center justify-between px-4 py-3 rounded-lg text-neutral-700 hover:bg-gold-50 hover:text-gold-700 transition-all duration-200"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <ShoppingCart className="h-5 w-5" />
                                            <span className="font-medium">Cart</span>
                                        </div>
                                        {/* Item count badge for mobile */}
                                        <CartIconBadge />
                                    </Link>
                                )}

                                {/* Admin Button */}
                                <Link
                                    to={isAuthenticated && isAdmin ? "/admin" : "/admin/login"}
                                    onClick={closeMobileMenu}
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-gold-50 hover:text-gold-700 transition-all duration-200"
                                >
                                    <Shield className="h-5 w-5" />
                                    <span className="font-medium">Admin</span>
                                </Link>

                                {/* Authentication Buttons */}
                                {isAuthenticated ? (
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span className="font-medium">Logout</span>
                                    </button>
                                ) : (
                                    <div className="space-y-3 pt-4">
                                        <Link
                                            to="/login"
                                            onClick={closeMobileMenu}
                                            className="block w-full px-4 py-3 rounded-lg text-center text-neutral-700 hover:bg-neutral-100 font-medium transition-all duration-200 border border-neutral-300"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            to="/signup"
                                            onClick={closeMobileMenu}
                                            className="block w-full px-4 py-3 rounded-lg text-center bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold hover:from-gold-600 hover:to-gold-700 shadow-md transition-all duration-200"
                                        >
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-6 border-t border-neutral-200">
                            <p className="text-xs text-center text-neutral-500">
                                © 2024 Swati Gold. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spacer to prevent content from going under fixed navbar */}
            <div className="h-20" />
        </>
    );
};

export default NavBar;
