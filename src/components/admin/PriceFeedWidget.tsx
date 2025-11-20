import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Clock, AlertCircle, DollarSign, IndianRupee } from 'lucide-react';
import { toast } from 'react-toastify';
import { PriceFeed } from '../../types';
import { priceFeedService } from '../../services/priceFeedService';
import { getErrorMessage } from '../../utils/errorHandler';

const USD_TO_INR_RATE = 83.0; // Configurable exchange rate

export const PriceFeedWidget = () => {
    const [prices, setPrices] = useState<PriceFeed[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load prices on mount
    useEffect(() => {
        loadPrices();
    }, []);

    // Load all prices
    const loadPrices = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await priceFeedService.getAllPrices();
            setPrices(data);
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle manual refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        setError(null);
        try {
            const data = await priceFeedService.refreshPrices();
            setPrices(data);
            toast.success('Prices refreshed successfully');
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setRefreshing(false);
        }
    };

    // Format currency
    const formatCurrency = (amount: number, currency: 'USD' | 'INR') => {
        if (currency === 'USD') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
        } else {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
            }).format(amount);
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get symbol display name
    const getSymbolDisplayName = (symbol: string) => {
        const symbolMap: Record<string, string> = {
            'BTCUSD': 'Bitcoin (BTC)',
            'ETHUSD': 'Ethereum (ETH)',
            'LTCUSD': 'Litecoin (LTC)',
            'BCHUSD': 'Bitcoin Cash (BCH)',
        };
        return symbolMap[symbol] || symbol;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-center h-48">
                    <div className="text-gray-500">Loading price feeds...</div>
                </div>
            </div>
        );
    }

    if (error && prices.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex flex-col items-center justify-center h-48 space-y-3">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <p className="text-red-600 text-center">{error}</p>
                    <button
                        onClick={loadPrices}
                        className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-gray-700" />
                        <h3 className="text-lg font-bold text-gray-900">Live Market Prices</h3>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            {/* Price Cards */}
            <div className="p-6">
                {prices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No price feeds configured</p>
                        <p className="text-sm mt-2">Configure symbols in backend environment variables</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {prices.map((price) => (
                            <div
                                key={price.id}
                                className={`border rounded-lg p-4 transition-all duration-300 ${price.fetch_error
                                        ? 'border-red-200 bg-red-50'
                                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                                    }`}
                            >
                                {/* Symbol Name */}
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-gray-700">
                                        {getSymbolDisplayName(price.symbol)}
                                    </h4>
                                    <span className="text-xs text-gray-500 uppercase">{price.exchange}</span>
                                </div>

                                {price.fetch_error ? (
                                    /* Error State */
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2 text-red-600">
                                            <AlertCircle className="h-4 w-4" />
                                            <span className="text-sm font-medium">API Unavailable</span>
                                        </div>
                                        <p className="text-xs text-red-500">{price.fetch_error}</p>
                                        {price.last_price > 0 && (
                                            <div className="pt-2 border-t border-red-200">
                                                <p className="text-xs text-gray-600 mb-1">Last Cached Price:</p>
                                                <p className="text-lg font-bold text-gray-700">
                                                    {formatCurrency(price.last_price, 'USD')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Normal State */
                                    <div className="space-y-3">
                                        {/* USD Price */}
                                        <div>
                                            <div className="flex items-center space-x-1 text-gray-500 mb-1">
                                                <DollarSign className="h-3 w-3" />
                                                <span className="text-xs">USD</span>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(price.last_price, 'USD')}
                                            </p>
                                        </div>

                                        {/* INR Price */}
                                        <div>
                                            <div className="flex items-center space-x-1 text-gray-500 mb-1">
                                                <IndianRupee className="h-3 w-3" />
                                                <span className="text-xs">INR (Approx)</span>
                                            </div>
                                            <p className="text-lg font-semibold text-blue-600">
                                                {formatCurrency(
                                                    priceFeedService.convertUsdToInr(price.last_price, USD_TO_INR_RATE),
                                                    'INR'
                                                )}
                                            </p>
                                        </div>

                                        {/* Additional Info */}
                                        {(price.bid || price.ask || price.volume) && (
                                            <div className="pt-2 border-t border-gray-200 space-y-1">
                                                {price.bid && (
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-500">Bid:</span>
                                                        <span className="text-gray-700 font-medium">
                                                            {formatCurrency(price.bid, 'USD')}
                                                        </span>
                                                    </div>
                                                )}
                                                {price.ask && (
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-500">Ask:</span>
                                                        <span className="text-gray-700 font-medium">
                                                            {formatCurrency(price.ask, 'USD')}
                                                        </span>
                                                    </div>
                                                )}
                                                {price.volume && (
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-500">Volume:</span>
                                                        <span className="text-gray-700 font-medium">
                                                            {price.volume.toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Last Updated */}
                                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center space-x-1 text-xs text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    <span>Updated {formatDate(price.last_updated)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Note */}
            {prices.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 text-center">
                        Prices are cached and updated at regular intervals. Click refresh for latest data.
                        {' '}Exchange rate: 1 USD = ₹{USD_TO_INR_RATE}
                    </p>
                </div>
            )}
        </div>
    );
};
