import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  MessageCircle
} from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Products', path: '/products' },
    { name: 'Khata Login', path: '/khata' },
    { name: 'Contact', path: '/contact' }
  ];

  const categories = [
    'Gold Jewelry',
    'Diamond Jewelry',
    'Bridal Sets',
    'Earrings',
    'Necklaces',
    'Bangles & Bracelets',
    'Rings',
    'Chains'
  ];

  const socialLinks = [
    {
      icon: Facebook,
      href: 'https://facebook.com/swatijewellers',
      color: 'hover:text-blue-600',
      label: 'Facebook'
    },
    {
      icon: Instagram,
      href: 'https://instagram.com/swatijewellers',
      color: 'hover:text-pink-600',
      label: 'Instagram'
    },
    {
      icon: Twitter,
      href: 'https://twitter.com/swatijewellers',
      color: 'hover:text-blue-400',
      label: 'Twitter'
    },
    {
      icon: Youtube,
      href: 'https://youtube.com/@swatijewellers',
      color: 'hover:text-red-600',
      label: 'YouTube'
    },
    {
      icon: MessageCircle,
      href: 'https://wa.me/918210161393',
      color: 'hover:text-green-500',
      label: 'WhatsApp'
    }
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubscribeStatus('error');
      setTimeout(() => setSubscribeStatus('idle'), 3000);
      return;
    }

    // TODO: Implement actual API call for newsletter subscription
    // For now, just show success message
    setSubscribeStatus('success');
    setEmail('');
    setTimeout(() => setSubscribeStatus('idle'), 3000);
  };

  return (
    <footer className="bg-gradient-to-br from-black via-gray-900 to-black text-white" role="contentinfo" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="flex flex-col items-start space-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 rounded-lg" aria-label="Swati Jewellers - Home">
              <div className="flex items-center space-x-2">
                <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-400" aria-hidden="true" />
                <span className="text-xl sm:text-2xl font-extrabold text-yellow-400">
                  Swati Jewellers
                </span>
              </div>
              <span className="text-xs sm:text-sm text-gray-300 font-light">
                Swati's Goal for Digital Elegance
              </span>
            </Link>

            <p className="text-sm text-gray-300 leading-relaxed">
              Four decades of excellence in crafting premium gold and diamond jewelry.
              Where tradition meets elegance, and every piece tells a story.
            </p>

            {/* Social Media Links */}
            <nav aria-label="Social media links">
              <h4 className="text-sm font-semibold text-yellow-400 mb-3">Follow Us</h4>
              <div className="flex items-center space-x-3 flex-wrap gap-2">
                {socialLinks.map(({ icon: Icon, href, color, label }, index) => (
                  <a
                    key={index}
                    href={href}
                    title={`Visit us on ${label}`}
                    className={`p-2.5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full text-gray-300 ${color} transition-all duration-300 transform hover:scale-110 hover:shadow-lg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </a>
                ))}
              </div>
            </nav>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-yellow-400">Quick Links</h3>
            <ul className="space-y-2 sm:space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-300 hover:text-yellow-400 transition-colors duration-300 flex items-center space-x-2 group"
                  >
                    <span className="w-1 h-1 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-yellow-400">Categories</h3>
            <ul className="space-y-2 sm:space-y-3">
              {categories.map((category, index) => (
                <li key={index}>
                  <Link
                    to="/products"
                    className="text-sm text-gray-300 hover:text-yellow-400 transition-colors duration-300 flex items-center space-x-2 group"
                  >
                    <span className="w-1 h-1 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span>{category}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-yellow-400">Contact Us</h3>
            <div className="space-y-4">
              {/* Address */}
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-1" />
                <div className="text-sm text-gray-300 leading-relaxed">
                  <p>Vidyapati Chowk</p>
                  <p>Benipatti, Madhubani</p>
                  <p>Bihar - 847223</p>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p>+91 82101 61393</p>
                  <p>+91 62098 10892</p>
                </div>
              </div>

              {/* Email Addresses */}
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p>info@swatijewellers.com</p>
                  <p>support@swatijewellers.com</p>
                </div>
              </div>

              {/* Business Hours */}
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-yellow-400 mb-2 text-sm">Business Hours</h4>
                <div className="text-xs sm:text-sm text-gray-300 space-y-1">
                  <p>Mon - Sat: 10:00 AM - 8:00 PM</p>
                  <p>Sunday: 11:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-xl font-bold text-yellow-400 mb-2">Stay Updated</h3>
            <p className="text-sm text-gray-300 mb-4">
              Subscribe to our newsletter for exclusive offers and latest collections
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
                required
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 text-sm"
              >
                Subscribe
              </button>
            </form>
            {subscribeStatus === 'success' && (
              <p className="mt-3 text-sm text-green-400">Thank you for subscribing!</p>
            )}
            {subscribeStatus === 'error' && (
              <p className="mt-3 text-sm text-red-400">Please enter a valid email address</p>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-xs sm:text-sm text-gray-400 text-center md:text-left">
              <p>&copy; 2025 Swati Jewellers. All rights reserved.</p>
              <p className="mt-1">Crafting digital elegance since 2025</p>
            </div>

            <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-400">
              <a href="#" className="hover:text-yellow-400 transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-yellow-400 transition-colors duration-300">
                Terms of Service
              </a>
              <a href="#" className="hover:text-yellow-400 transition-colors duration-300">
                Return Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer >
  );
};

export default Footer;
