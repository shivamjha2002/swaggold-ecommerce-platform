import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

interface GoldPriceData {
    price: number;
    currency: string;
    per_unit: string;
    last_updated: string;
    cache_status?: string;
}

const GoldPriceDisplay = () => {
    const [priceData, setPriceData] = useState<GoldPriceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchGoldPrice();
        // Refresh every 5 minutes
        const interval = setInterval(fetchGoldPrice, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchGoldPrice = async () => {
        try {
            setError(null);
            const response = await api.get<{ success: boolean; data: GoldPriceData }>('/prices/gold/live');

            if (response.data.success && response.data.data) {
                setPriceData(response.data.data);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Error fetching gold price:', err);
            setError('Unable to fetch live gold price');
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setLoading(true);
        setError(null);
        fetchGoldPrice();
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDateTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
            });
        } catch {
            return 'Recently';
        }
    };

    // Loading Skeleton
    if (loading) {
        return (
            <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black py-6 px-8 rounded-xl shadow-lg">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2 flex-1">
                            <div className="h-4 bg-black/20 rounded w-32 animate-shimmer"></div>
                            <div className="h-8 bg-black/20 rounded w-48 animate-shimmer"></div>
                        </div>
                        <div className="h-12 w-12 bg-black/20 rounded-full animate-shimmer"></div>
                    </div>
                    <div className="h-3 bg-black/20 rounded w-40 animate-shimmer"></div>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white py-6 px-8 rounded-xl shadow-lg">
                <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="h-5 w-5" />
                            <p className="font-semibold">Price Unavailable</p>
                        </div>
                        <p className="text-sm opacity-90 mb-4">{error}</p>
                        <button
                            onClick={handleRetry}
                            className="inline-flex items-center space-x-2 bg-white text-red-600 font-semibold py-2 px-4 rounded-lg hover:bg-red-50 transition-colors duration-200"
                            aria-label="Retry fetching gold price"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span>Retry</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Success State
    return (
        <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black py-6 px-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between space-x-6">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="h-5 w-5" />
                        <p className="text-sm font-semibold opacity-90">
                            Live Gold Price
                        </p>
                    </div>

                    <p className="text-3xl md:text-4xl font-bold mb-1">
                        {priceData ? formatPrice(priceData.price) : '---'}
                    </p>

                    <p className="text-sm opacity-75">
                        per {priceData?.per_unit || '10g'}
                    </p>
                </div>

                {/* Gold Icon */}
                <div className="hidden sm:block">
                    <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center">
                        <svg
                            className="w-10 h-10 text-black/60"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Last Updated */}
            <div className="mt-4 pt-4 border-t border-black/10">
                <p className="text-xs opacity-75">
                    Last updated: {priceData ? formatDateTime(priceData.last_updated) : '---'}
                </p>
                {priceData?.cache_status === 'stale_with_error' && (
                    <p className="text-xs opacity-75 mt-1">
                        ⚠️ Showing cached data
                    </p>
                )}
            </div>
        </div>
    );
};

export default GoldPriceDisplay;
