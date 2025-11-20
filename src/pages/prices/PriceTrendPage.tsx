import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import api from '../../services/api';

// Time range options
type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y';

interface PriceHistoryData {
    timestamp: string;
    price: number;
}

interface PriceStatistics {
    current: number;
    high: number;
    low: number;
    average: number;
}

/**
 * PriceTrendPage component displays historical gold price trends with interactive charts
 * 
 * Features:
 * - Protected route requiring authentication
 * - Time range selector (1D, 1W, 1M, 3M, 1Y)
 * - Interactive line chart with time-series data
 * - Price statistics (current, high, low, average)
 * - Loading states
 * - Responsive design for mobile devices
 * 
 * Requirements: 1.11.3, 1.11.4, 1.11.5
 */
const PriceTrendPageContent: React.FC = () => {
    const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
    const [priceData, setPriceData] = useState<PriceHistoryData[]>([]);
    const [statistics, setStatistics] = useState<PriceStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Time range options for the selector
    const timeRanges: { value: TimeRange; label: string }[] = [
        { value: '1D', label: '1 Day' },
        { value: '1W', label: '1 Week' },
        { value: '1M', label: '1 Month' },
        { value: '3M', label: '3 Months' },
        { value: '1Y', label: '1 Year' },
    ];

    /**
     * Fetch historical price data from the backend
     */
    const fetchPriceHistory = async (range: TimeRange) => {
        setLoading(true);
        setError(null);

        try {
            // Fetch historical data from GET /api/prices/gold/history endpoint
            const response = await api.get<{
                success: boolean;
                data: {
                    symbol: string;
                    range: string;
                    count: number;
                    history: PriceHistoryData[];
                };
            }>(`/prices/gold/history`, {
                params: { range },
            });

            if (response.data.success && response.data.data && response.data.data.history) {
                const data = response.data.data.history;
                setPriceData(data);

                // Calculate statistics
                if (data.length > 0) {
                    const prices = data.map((item) => item.price);
                    const stats: PriceStatistics = {
                        current: prices[prices.length - 1],
                        high: Math.max(...prices),
                        low: Math.min(...prices),
                        average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
                    };
                    setStatistics(stats);
                }
            } else {
                setError('Failed to fetch price history');
            }
        } catch (err) {
            console.error('Error fetching price history:', err);
            setError('Unable to load price data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when component mounts or range changes
    useEffect(() => {
        fetchPriceHistory(selectedRange);
    }, [selectedRange]);

    /**
     * Format timestamp for chart display
     */
    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);

        if (selectedRange === '1D') {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (selectedRange === '1W') {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    /**
     * Format price for display
     */
    const formatPrice = (price: number): string => {
        return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    /**
     * Custom tooltip for the chart
     */
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="text-sm text-gray-600 mb-1">
                        {new Date(data.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                    <p className="text-lg font-bold text-yellow-600">
                        {formatPrice(data.price)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                        Gold Price Trends
                    </h1>
                    <p className="text-gray-600">
                        Track historical gold prices and analyze market trends
                    </p>
                </div>

                {/* Time Range Selector */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {timeRanges.map((range) => (
                            <button
                                key={range.value}
                                onClick={() => setSelectedRange(range.value)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedRange === range.value
                                    ? 'bg-yellow-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading price data...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <svg
                            className="h-12 w-12 text-red-500 mx-auto mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <p className="text-red-800 font-medium mb-2">{error}</p>
                        <button
                            onClick={() => fetchPriceHistory(selectedRange)}
                            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Price Statistics */}
                {!loading && !error && statistics && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <p className="text-sm text-gray-600 mb-1">Current Price</p>
                            <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                                {formatPrice(statistics.current)}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <p className="text-sm text-gray-600 mb-1">High</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-600">
                                {formatPrice(statistics.high)}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <p className="text-sm text-gray-600 mb-1">Low</p>
                            <p className="text-xl sm:text-2xl font-bold text-red-600">
                                {formatPrice(statistics.low)}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <p className="text-sm text-gray-600 mb-1">Average</p>
                            <p className="text-xl sm:text-2xl font-bold text-blue-600">
                                {formatPrice(statistics.average)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Price Chart */}
                {!loading && !error && priceData.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Price Chart - {timeRanges.find((r) => r.value === selectedRange)?.label}
                        </h2>
                        <div className="w-full" style={{ height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={priceData}
                                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="timestamp"
                                        tickFormatter={formatTimestamp}
                                        stroke="#6b7280"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis
                                        tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                                        stroke="#6b7280"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="price"
                                        stroke="#ca8a04"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Gold Price (₹/10g)"
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && priceData.length === 0 && (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <svg
                            className="h-16 w-16 text-gray-400 mx-auto mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                        <p className="text-gray-600 text-lg">No price data available for this time range</p>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Wrapped component with ProtectedRoute
 */
export const PriceTrendPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <PriceTrendPageContent />
        </ProtectedRoute>
    );
};

export default PriceTrendPage;
