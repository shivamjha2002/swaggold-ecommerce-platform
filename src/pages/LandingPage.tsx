import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import GoldPriceDisplay from '../components/GoldPriceDisplay';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section
                className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden flex items-center"
                aria-label="Hero section"
            >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-900/30 via-yellow-800/20 to-transparent animate-pulse"></div>

                {/* Background jewelry image with overlay */}
                <div className="absolute inset-0 opacity-20" aria-hidden="true">
                    <img
                        src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&h=1080&fit=crop"
                        alt=""
                        role="presentation"
                        className="w-full h-full object-cover"
                        loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
                </div>

                {/* Animated sparkles - Reduced on mobile */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                    <Sparkles className="absolute top-20 left-10 h-4 w-4 sm:h-6 sm:w-6 text-yellow-400 animate-pulse opacity-60" style={{ animationDelay: '0s' }} />
                    <Sparkles className="hidden sm:block absolute top-40 right-20 h-4 w-4 text-yellow-300 animate-pulse opacity-40" style={{ animationDelay: '0.5s' }} />
                    <Sparkles className="absolute top-60 left-1/4 h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 animate-pulse opacity-50" style={{ animationDelay: '1s' }} />
                    <Sparkles className="hidden sm:block absolute bottom-40 right-1/3 h-6 w-6 text-yellow-400 animate-pulse opacity-60" style={{ animationDelay: '1.5s' }} />
                    <Sparkles className="absolute top-1/3 right-10 h-4 w-4 text-yellow-300 animate-pulse opacity-40" style={{ animationDelay: '2s' }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 sm:py-20">
                    <div className="max-w-3xl">
                        {/* Brand Icon and Divider */}
                        <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6 animate-fade-in" aria-hidden="true">
                            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-yellow-400 animate-pulse" />
                            <div className="h-px bg-gradient-to-r from-yellow-400 to-transparent flex-1"></div>
                        </div>

                        {/* Brand Name - Responsive text size */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 animate-fade-in-up">
                            <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                                Swati Gold
                            </span>
                        </h1>

                        {/* Tagline - Responsive text size */}
                        <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-3 sm:mb-4 font-light animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            Where Tradition Meets Elegance
                        </p>

                        {/* Description - Responsive text size */}
                        <p className="text-base sm:text-lg text-gray-400 mb-6 sm:mb-8 max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            Discover our exquisite collection of handcrafted 916 HM gold jewelry.
                            Each piece tells a story of timeless beauty and exceptional craftsmanship.
                        </p>

                        {/* Gold Price Display */}
                        <div className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                            <GoldPriceDisplay />
                        </div>

                        {/* CTA Buttons - Mobile optimized */}
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-6 animate-fade-in-up" style={{ animationDelay: '0.8s' }} role="group" aria-label="Account actions">
                            <button
                                onClick={() => navigate('/login')}
                                className="group flex items-center justify-center space-x-3 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:from-yellow-400 hover:to-yellow-300 transition-all duration-300 sm:transform sm:hover:scale-105 shadow-2xl hover:shadow-yellow-500/25 min-h-[48px] touch-manipulation active:scale-95 focus:outline-none focus:ring-4 focus:ring-yellow-300"
                                aria-label="Login to your account"
                            >
                                <span className="text-base sm:text-lg">Login</span>
                                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
                            </button>

                            <button
                                onClick={() => navigate('/signup')}
                                className="flex items-center justify-center space-x-3 border-2 border-yellow-400 text-yellow-400 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl hover:bg-yellow-400 hover:text-black transition-all duration-300 sm:transform sm:hover:scale-105 min-h-[48px] touch-manipulation active:scale-95 focus:outline-none focus:ring-4 focus:ring-yellow-300"
                                aria-label="Create a new account"
                            >
                                <span className="text-base sm:text-lg">Sign Up</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator - Hidden on mobile */}
                <div className="hidden sm:block absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 border-2 border-yellow-400 rounded-full flex justify-center" aria-hidden="true">
                        <div className="w-1 h-3 bg-yellow-400 rounded-full mt-2 animate-pulse"></div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
