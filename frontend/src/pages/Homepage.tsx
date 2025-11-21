import { useState, useEffect } from 'react';
import { Crown, Star, Gem, Award, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { productService } from '../services/productService';
import { Product } from '../types';
import GoldPriceTicker from '../components/GoldPriceTicker';
import { useCart } from '../context/CartContext';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { getImageUrl } from '../utils/imageUtils';

const Homepage = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts({ per_page: 6 });
      setFeaturedProducts(response.data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching products:', error);
      // Keep empty array on error
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };
  const features = [
    {
      icon: Crown,
      title: "Premium Quality",
      description: "Certified 916 HM gold with authenticity guarantee"
    },
    {
      icon: Star,
      title: "Expert Craftsmanship",
      description: "Handcrafted by master jewelers with decades of experience"
    },
    {
      icon: Award,
      title: "Trusted Since 1985",
      description: "Four decades of trust and excellence in jewelry making"
    },
    {
      icon: Gem,
      title: "Exclusive Designs",
      description: "Unique traditional and contemporary designs for every occasion"
    }
  ];

  const handleNavigation = (section: string) => {
    if (section === 'products') {
      navigate('/products');
    } else if (section === 'predictions') {
      navigate('/predictions');
    } else {
      alert(`Navigate to ${section} section`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/30 via-yellow-800/20 to-transparent animate-pulse"></div>
        
        {/* Background jewelry image with overlay */}
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&h=1080&fit=crop"
            alt="Luxury Jewelry"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
        </div>

        {/* Animated sparkles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Sparkles className="absolute top-20 left-10 h-6 w-6 text-yellow-400 animate-pulse opacity-60" style={{ animationDelay: '0s' }} />
          <Sparkles className="absolute top-40 right-20 h-4 w-4 text-yellow-300 animate-pulse opacity-40" style={{ animationDelay: '0.5s' }} />
          <Sparkles className="absolute top-60 left-1/4 h-5 w-5 text-yellow-500 animate-pulse opacity-50" style={{ animationDelay: '1s' }} />
          <Sparkles className="absolute bottom-40 right-1/3 h-6 w-6 text-yellow-400 animate-pulse opacity-60" style={{ animationDelay: '1.5s' }} />
          <Sparkles className="absolute top-1/3 right-10 h-4 w-4 text-yellow-300 animate-pulse opacity-40" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-4 mb-6 animate-fade-in">
              <Sparkles className="h-12 w-12 text-yellow-400 animate-pulse" />
              <div className="h-px bg-gradient-to-r from-yellow-400 to-transparent flex-1"></div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                Swati Jewellers
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Where Tradition Meets Elegance
            </p>
            
            <p className="text-lg text-gray-400 mb-8 max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              Discover our exquisite collection of handcrafted 916 HM gold jewelry. 
              Each piece tells a story of timeless beauty and exceptional craftsmanship.
            </p>

            {/* Gold Price Ticker */}
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <GoldPriceTicker />
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <button
                onClick={() => handleNavigation('products')}
                className="group flex items-center justify-center space-x-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-400 hover:to-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-yellow-500/25"
              >
                <span className="text-lg">Explore Collection</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              
              <button
                onClick={() => handleNavigation('about')}
                className="flex items-center justify-center space-x-3 border-2 border-yellow-400 text-yellow-400 font-bold py-4 px-8 rounded-xl hover:bg-yellow-400 hover:text-black transition-all duration-300 transform hover:scale-105"
              >
                <Crown className="h-5 w-5" />
                <span className="text-lg">Our Story</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-yellow-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-yellow-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Featured <span className="text-yellow-500">Collections</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Handpicked pieces from our premium 916 HM certified gold collection
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 text-yellow-500 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                {featuredProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="group relative">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                      
                      {/* Image with zoom effect */}
                      <div className="aspect-square overflow-hidden relative">
                        <ResponsiveImage
                          src={getImageUrl(product.image_url)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                          loading="lazy"
                        />
                        
                        {/* Hover overlay with quick actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                          <div className="flex flex-col space-y-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigation('products');
                              }}
                              className="bg-white text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors duration-200 transform hover:scale-105"
                            >
                              Quick View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (product.is_active && product.stock_quantity > 0) {
                                  addItem(product, 1);
                                  toast.success(`${product.name} added to cart!`);
                                } else {
                                  toast.error('This product is out of stock');
                                }
                              }}
                              className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors duration-200 transform hover:scale-105"
                              disabled={!product.is_active || product.stock_quantity === 0}
                            >
                              {product.is_active && product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                            {product.category}
                          </span>
                          <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors duration-300">
                          {product.name}
                        </h3>
                        
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {product.description || 'Exquisite handcrafted jewelry piece'}
                        </p>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-2xl font-bold text-yellow-600">
                              {formatPrice(product.current_price)}
                            </p>
                            <p className="text-xs text-gray-500 line-through">
                              {formatPrice(product.base_price)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">
                            Weight: {product.weight}g
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <button
                  onClick={() => handleNavigation('products')}
                  className="inline-flex items-center space-x-3 bg-gradient-to-r from-gray-900 to-black text-white font-bold py-4 px-8 rounded-xl hover:from-black hover:to-gray-900 transition-all duration-300 transform hover:scale-105 shadow-xl"
                >
                  <span className="text-lg">View All Products</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Category Showcase */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Shop by <span className="text-yellow-500">Category</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our diverse collection of traditional and contemporary jewelry
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Necklaces',
                image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
                count: '50+ Designs'
              },
              {
                name: 'Earrings',
                image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop',
                count: '75+ Designs'
              },
              {
                name: 'Bangles',
                image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                count: '40+ Designs'
              },
              {
                name: 'Rings',
                image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                count: '60+ Designs'
              }
            ].map((category, index) => (
              <div
                key={index}
                onClick={() => navigate(`/products?category=${category.name}`)}
                className="group relative overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-500 hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                <div className="aspect-square overflow-hidden">
                  <ResponsiveImage
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    loading="lazy"
                  />
                </div>
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-black/90 transition-all duration-300"></div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-yellow-400 transition-colors duration-300">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-300 mb-3">{category.count}</p>
                  <div className="flex items-center space-x-2 text-yellow-400 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span className="text-sm font-semibold">Explore Collection</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                {/* Sparkle effect on hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* More Products Showcase */}
      <section className="py-20 bg-gradient-to-br from-yellow-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              More From Our <span className="text-yellow-500">Collection</span>
            </h2>
          </div>

          {!loading && featuredProducts.length > 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
              {featuredProducts.slice(3, 5).map((product) => (
                <div key={product.id} className="group cursor-pointer" onClick={() => handleNavigation('products')}>
                  <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-105">
                    <div className="aspect-video overflow-hidden">
                      <ResponsiveImage
                        src={getImageUrl(product.image_url)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        loading="lazy"
                      />
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                          {product.category}
                        </span>
                        <Gem className="h-5 w-5 text-yellow-500" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors duration-300">
                        {product.name}
                      </h3>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-2xl font-bold text-yellow-600">
                            {formatPrice(product.current_price)}
                          </p>
                          <p className="text-xs text-gray-500 line-through">
                            {formatPrice(product.base_price)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          Weight: {product.weight}g
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What Our <span className="text-yellow-500">Customers Say</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Trusted by thousands of satisfied customers across generations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                name: 'Priya Sharma',
                location: 'Mumbai',
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
                rating: 5,
                text: 'Absolutely stunning craftsmanship! I purchased a necklace set for my wedding and received countless compliments. The quality is exceptional and the designs are timeless.'
              },
              {
                name: 'Rajesh Kumar',
                location: 'Delhi',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
                rating: 5,
                text: 'Been a customer for over 10 years. The trust and authenticity they provide is unmatched. Every piece comes with proper certification and the gold purity is always as promised.'
              },
              {
                name: 'Anita Desai',
                location: 'Bangalore',
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
                rating: 5,
                text: 'The staff is incredibly knowledgeable and helpful. They helped me choose the perfect gift for my daughter. The entire experience was wonderful from start to finish.'
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                {/* Star Rating */}
                <div className="flex space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>

                {/* Customer Info */}
                <div className="flex items-center space-x-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.location}</p>
                  </div>
                </div>

                {/* Quote Icon */}
                <div className="absolute top-6 right-6 opacity-10">
                  <svg className="w-12 h-12 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Why Choose Us */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center space-x-2 mb-4">
              <div className="h-px w-12 bg-yellow-500"></div>
              <Sparkles className="h-6 w-6 text-yellow-500" />
              <div className="h-px w-12 bg-yellow-500"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="text-yellow-500">Swati Jewellers</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Excellence in every detail, trust in every transaction
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group text-center p-8 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-white to-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Sparkle decoration */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                </div>

                <div className="relative z-10">
                  {/* Icon container with enhanced animation */}
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg group-hover:shadow-yellow-500/50">
                    <feature.icon className="h-10 w-10 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-yellow-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Bottom accent line */}
                  <div className="mt-6 h-1 w-0 group-hover:w-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500 mx-auto rounded-full"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional trust indicators */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-yellow-600 mb-2">40+</div>
              <div className="text-gray-600">Years of Trust</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-yellow-600 mb-2">10K+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-yellow-600 mb-2">500+</div>
              <div className="text-gray-600">Unique Designs</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-yellow-600 mb-2">100%</div>
              <div className="text-gray-600">Certified Gold</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Find Your Perfect <span className="text-yellow-400">Jewelry</span>?
            </h2>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Visit our showroom or browse our collection online. 
              Experience the luxury and craftsmanship that defines Swati Jewellers.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={() => handleNavigation('contact')}
                className="inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-400 hover:to-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                <span className="text-lg">Visit Showroom</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => handleNavigation('khata')}
                className="inline-flex items-center justify-center space-x-3 border-2 border-yellow-400 text-yellow-400 font-bold py-4 px-8 rounded-xl hover:bg-yellow-400 hover:text-black transition-all duration-300 transform hover:scale-105"
              >
                <span className="text-lg">Check Khata</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;