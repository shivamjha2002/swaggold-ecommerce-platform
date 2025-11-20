import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { priceFeedService, PriceFeed } from '../services/priceFeedService';

interface MarketPriceDisplayProps {
    symbol: string;
    autoRefresh?: boolean;
    refreshInterval?: number; // in seconds
    className?: string;
}

const MarketPriceDisplay = ({
    symbol,
    autoRefresh = true,
    refreshInterval = 60,
    className = ''
}: MarketPriceDisplayProps) => {
    const [priceData, setPriceData] = useState<PriceFeed | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchPrice = useCallback(async () => {
        try {
            setError(null);
            const data = await priceFeedService.getMarketPrice(symbol, true);
            setPriceData(data);
        } catch (err) {
            console.error('Error fetching market price:', err);
            setError('Failed to load market price');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [symbol]);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await fetchPrice();
    };

    // Initial fetch
    useEffect(() => {
        fetchPrice();
    }, [fetchPrice]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const intervalId = setInterval(() => {
            fetchPrice();
        }, refreshInterval * 1000);

        return () => clearInterval(intervalId);
    }, [autoRefresh, refreshInterval, fetchPrice]);

    if (loading) {
        return (
            <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 ${className}`}>
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-blue-200 rounded w-1/2"></div>
                    <div className="h-8 bg-blue-200 rounded w-3/4"></div>
                    <div className="h-3 bg-blue-200 rounded w-1/3"></div>
                </div>
            </div>
        );
    }

    if (error || !priceData) {
        return (
            <div className={`bg-red-50 border border-red-200 p-6 rounded-xl ${className}`}>
                <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div>
                        <p className="text-sm font-semibold text-red-800">Market Price Unavailable</p>
                        <p className="text-xs text-red-600">{error || 'Unable to fetch price data'}</p>
                    </div>
                </div>
                <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Retry</span>
                </button>
            </div>
        );
    }

    const isCached = priceData.cache_status === 'stale_with_error';

    return (
        <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 ${className}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Current Market Price</h3>
                </div>
                <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="p-2 hover:bg-blue-100 rounded-full transition-colors duration-200"
                    title="Refresh price"
                >
                    <RefreshCw className={`h-4 w-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {isCached && priceData.warning && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">{priceData.warning}</p>
                </div>
            )}

            <div className="space-y-4">
                {/* Symbol */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Symbol</span>
                    <span className="text-sm font-semibold text-gray-900 bg-blue-100 px-3 py-1 rounded-full">
                        {priceData.symbol}
                    </span>
                </div>

                {/* USD Price */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price (USD)</span>
                    <span className="text-2xl font-bold text-blue-600">
                        {priceFeedService.formatPrice(priceData.last_price, 'USD')}
                    </span>
                </div>

                {/* INR Price */}
                {priceData.inr_price && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Approx. Price (INR)</span>
                        <span className="text-xl font-bold text-indigo-600">
                            {priceFeedService.formatPrice(priceData.inr_price, 'INR')}
                        </span>
                    </div>
                )}

                {/* Exchange Rate */}
                {priceData.exchange_rate && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Exchange Rate</span>
                        <span>1 USD = ₹{priceData.exchange_rate.toFixed(2)}</span>
                    </div>
                )}

                {/* Last Updated */}
                <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Last updated</span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">
                        {priceFeedService.formatLastUpdated(priceData.last_updated)}
                    </span>
                </div>

                {/* Cached Indicator */}
                {isCached && (
                    <div className="text-center">
                        <span className="inline-block text-xs font-semibold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">
                            Cached Data
                        </span>
                    </div>
                )}
            </div>

            {/* Additional Info */}
            <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs text-gray-500 text-center">
                    Price updates automatically every {refreshInterval} seconds
                </p>
            </div>
        </div>
    );
};

export default MarketPriceDisplay;
