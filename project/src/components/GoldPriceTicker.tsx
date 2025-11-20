import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { predictionService } from '../services/predictionService';
import { getErrorMessage } from '../utils/errorHandler';

interface GoldPriceData {
  price_per_gram: number;
  date: string;
  purity: string;
  change?: number;
  changePercent?: number;
}

const GoldPriceTicker = () => {
  const [goldPrice, setGoldPrice] = useState<GoldPriceData | null>(null);
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
      const response = await predictionService.getCurrentGoldPrice();
      
      // Calculate mock change (in real app, this would come from comparing with previous price)
      const mockChange = (Math.random() - 0.5) * 100;
      const mockChangePercent = (mockChange / response.data.price_per_gram) * 100;
      
      setGoldPrice({
        ...response.data,
        change: mockChange,
        changePercent: mockChangePercent,
      });
    } catch (err) {
      console.error('Error fetching gold price:', err);
      setError(getErrorMessage(err));
      // Set fallback data
      setGoldPrice({
        price_per_gram: 6500,
        date: new Date().toISOString(),
        purity: '916',
        change: 0,
        changePercent: 0,
      });
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

  const getTrendIcon = () => {
    if (!goldPrice?.change) return <Minus className="h-5 w-5" />;
    if (goldPrice.change > 0) return <TrendingUp className="h-5 w-5" />;
    return <TrendingDown className="h-5 w-5" />;
  };

  const getTrendColor = () => {
    if (!goldPrice?.change) return 'text-gray-500';
    if (goldPrice.change > 0) return 'text-green-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black py-3 px-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Loading gold price...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black py-4 px-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between space-x-6">
        <div>
          <p className="text-sm font-medium opacity-90">
            Gold Price ({goldPrice?.purity || '916'} HM)
          </p>
          <p className="text-2xl font-bold">
            {goldPrice ? formatPrice(goldPrice.price_per_gram) : '---'}
            <span className="text-sm font-normal ml-1">/ gram</span>
          </p>
        </div>
        
        {goldPrice && (
          <div className={`flex items-center space-x-2 ${getTrendColor()}`}>
            {getTrendIcon()}
            <div className="text-right">
              <p className="text-sm font-semibold">
                {goldPrice.change && goldPrice.change > 0 ? '+' : ''}
                {goldPrice.change?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs opacity-90">
                {goldPrice.changePercent && goldPrice.changePercent > 0 ? '+' : ''}
                {goldPrice.changePercent?.toFixed(2) || '0.00'}%
              </p>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-xs mt-2 opacity-75">{error}</p>
      )}
      
      <p className="text-xs mt-2 opacity-75">
        Last updated: {goldPrice ? new Date(goldPrice.date).toLocaleString('en-IN') : '---'}
      </p>
    </div>
  );
};

export default GoldPriceTicker;
