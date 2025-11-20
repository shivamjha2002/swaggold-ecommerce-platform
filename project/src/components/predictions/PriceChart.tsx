import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { predictionService } from '../../services/predictionService';
import { PriceTrend } from '../../types';
import { toast } from 'react-toastify';
import { getErrorMessage } from '../../utils/errorHandler';

interface PriceChartProps {
  metalType?: 'gold' | 'silver';
  showConfidenceInterval?: boolean;
}

type TimeRange = 30 | 90 | 365;

export const PriceChart: React.FC<PriceChartProps> = ({ 
  metalType = 'gold',
  showConfidenceInterval = false,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [data, setData] = useState<PriceTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchPriceData();
  }, [timeRange, metalType]);

  const fetchPriceData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await predictionService.getGoldPriceTrends(timeRange);

      if (response.success && response.data) {
        // The API returns an object with 'prices' array inside
        interface PriceDataResponse {
          prices?: PriceTrend[];
        }
        const responseData = response.data as PriceTrend[] | PriceDataResponse;
        const priceData = Array.isArray(responseData) 
          ? responseData 
          : (responseData as PriceDataResponse).prices || [];
        
        // Ensure data is an array
        if (Array.isArray(priceData)) {
          setData(priceData);
        } else {
          console.error('API returned invalid data structure:', response.data);
          throw new Error('Invalid data format received from server');
        }
      } else {
        throw new Error(response.error?.message || 'Failed to fetch price data');
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Price data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border-2 border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            {new Date(label).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          {payload.map((entry, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-4">
              <span className="text-sm text-gray-600">{entry.name || 'Price'}:</span>
              <span className="text-sm font-bold" style={{ color: entry.color || '#3b82f6' }}>
                {formatCurrency(entry.value as number)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const calculateStats = () => {
    if (!Array.isArray(data) || data.length === 0) return null;

    const prices = data.map(d => d.price || d.price_per_gram || 0);
    const currentPrice = prices[prices.length - 1];
    const previousPrice = prices[0];
    const change = currentPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;
    const highPrice = Math.max(...prices);
    const lowPrice = Math.min(...prices);

    return {
      currentPrice,
      change,
      changePercent,
      highPrice,
      lowPrice,
    };
  };

  const stats = calculateStats();

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-green-400 to-green-500 rounded-xl">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Price Trends</h2>
            <p className="text-sm text-gray-600">Historical {metalType} prices</p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
          {[
            { value: 30, label: '30D' },
            { value: 90, label: '90D' },
            { value: 365, label: '1Y' },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as TimeRange)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                timeRange === range.value
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
            <p className="text-xs text-blue-600 font-semibold mb-1">Current Price</p>
            <p className="text-lg font-bold text-blue-900">
              {formatCurrency(stats.currentPrice)}
            </p>
          </div>

          <div className={`bg-gradient-to-br ${
            stats.change >= 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'
          } p-4 rounded-xl`}>
            <p className={`text-xs font-semibold mb-1 ${
              stats.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              Change
            </p>
            <p className={`text-lg font-bold ${
              stats.change >= 0 ? 'text-green-900' : 'text-red-900'
            }`}>
              {stats.change >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
            <p className="text-xs text-purple-600 font-semibold mb-1">High</p>
            <p className="text-lg font-bold text-purple-900">
              {formatCurrency(stats.highPrice)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
            <p className="text-xs text-orange-600 font-semibold mb-1">Low</p>
            <p className="text-lg font-bold text-orange-900">
              {formatCurrency(stats.lowPrice)}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl mb-6">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchPriceData}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-semibold underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-gray-400 mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Loading price data...</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && data.length > 0 && (
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={400}>
            {showConfidenceInterval ? (
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  tickFormatter={(value: number) => `₹${(value / 1000).toFixed(0)}k`}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                />
                <Area
                  type="monotone"
                  dataKey={(entry: PriceTrend) => entry.price || entry.price_per_gram}
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                  name="Price per Gram"
                />
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  tickFormatter={(value: number) => `₹${(value / 1000).toFixed(0)}k`}
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                />
                <Line
                  type="monotone"
                  dataKey={(entry: PriceTrend) => entry.price || entry.price_per_gram}
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Price per Gram"
                />
                {data[0]?.moving_average_7 && (
                  <Line
                    type="monotone"
                    dataKey="moving_average_7"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="7-Day MA"
                  />
                )}
                {data[0]?.moving_average_30 && (
                  <Line
                    type="monotone"
                    dataKey="moving_average_30"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="30-Day MA"
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && data.length === 0 && (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-600 text-lg font-semibold mb-2">No Price Data Available</p>
          <p className="text-gray-500 text-sm">
            Historical price data will appear here once available
          </p>
        </div>
      )}

      {/* Chart Info */}
      {!loading && !error && data.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-600">
            <strong>Chart Information:</strong> This chart displays historical {metalType} prices per gram. 
            {data[0]?.moving_average_7 && ' Moving averages help identify price trends over time.'}
            {' '}Data is updated daily based on market rates.
          </p>
        </div>
      )}
    </div>
  );
};
