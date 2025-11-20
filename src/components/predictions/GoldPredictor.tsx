import { useState } from 'react';
import { Calendar, Weight, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { predictionService } from '../../services/predictionService';
import { GoldPrediction } from '../../types';
import { toast } from 'react-toastify';
import { getPredictionErrorMessage } from '../../utils/predictionErrorHandler';

interface GoldPredictorProps {
  onPredictionComplete?: (result: GoldPrediction) => void;
}

export const GoldPredictor: React.FC<GoldPredictorProps> = ({
  onPredictionComplete
}) => {
  const [date, setDate] = useState('');
  const [weight, setWeight] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GoldPrediction | null>(null);
  const [error, setError] = useState<string>('');

  const validateForm = (): boolean => {
    setError('');

    if (!date) {
      setError('Please select a prediction date');
      return false;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setError('Prediction date must be in the future');
      return false;
    }

    if (weight <= 0) {
      setError('Weight must be greater than 0');
      return false;
    }

    return true;
  };

  const handlePredict = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await predictionService.predictGoldPrice({
        date,
        weight_grams: weight,
      });

      if (response.success && response.data) {
        setResult(response.data);
        onPredictionComplete?.(response.data);
        toast.success('Gold price prediction generated successfully!');
      } else {
        throw new Error(response.error?.message || 'Prediction failed');
      }
    } catch (err) {
      const errorMessage = getPredictionErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    handlePredict();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl">
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Gold Price Predictor</h2>
      </div>

      <div className="space-y-6">
        {/* Date Input */}
        <div>
          <label htmlFor="prediction-date" className="block text-sm font-semibold text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Prediction Date</span>
            </div>
          </label>
          <input
            id="prediction-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all duration-200"
            disabled={loading}
          />
        </div>

        {/* Weight Input */}
        <div>
          <label htmlFor="gold-weight" className="block text-sm font-semibold text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <Weight className="h-4 w-4" />
              <span>Weight (grams)</span>
            </div>
          </label>
          <input
            id="gold-weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            min="0.1"
            step="0.1"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all duration-200"
            disabled={loading}
          />
          <p className="mt-2 text-sm text-gray-500">
            Enter the weight of gold for price calculation
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-3 flex items-center space-x-2 text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Retry Prediction</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Predict Button */}
        <button
          onClick={handlePredict}
          disabled={loading}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-white font-bold py-4 px-6 rounded-xl hover:from-yellow-400 hover:to-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <span className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Analyzing historical data and generating prediction...</span>
            </span>
          ) : (
            'Predict Gold Price'
          )}
        </button>

        {/* Prediction Results */}
        {result && (
          <div className="mt-8 space-y-4 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Prediction Results</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Prediction Date</p>
                <p className="text-lg font-bold text-gray-900">{formatDate(result.date)}</p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Price per Gram</p>
                <p className="text-lg font-bold text-yellow-600">
                  {formatCurrency(result.predicted_price_per_gram)}
                </p>
              </div>

              {result.total_price && (
                <div className="bg-white p-4 rounded-xl shadow-sm md:col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Total Price ({weight}g)</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(result.total_price)}
                  </p>
                </div>
              )}

              <div className="bg-white p-4 rounded-xl shadow-sm md:col-span-2">
                <p className="text-sm text-gray-600 mb-2">Confidence Interval (95%)</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Lower Bound</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {formatCurrency(result.confidence_interval.lower)}
                    </p>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-2 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 rounded-full"></div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Upper Bound</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {formatCurrency(result.confidence_interval.upper)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Model Accuracy</p>
                <p className="text-lg font-bold text-green-600">
                  {(result.model_accuracy * 100).toFixed(1)}%
                </p>
              </div>

              {result.last_trained && (
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Last Trained</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {formatDate(result.last_trained)}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> This prediction is based on historical data and machine learning models.
                Actual prices may vary based on market conditions, global events, and other factors.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
