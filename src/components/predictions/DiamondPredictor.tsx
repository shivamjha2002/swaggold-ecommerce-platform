import { useState } from 'react';
import { Gem, AlertCircle, RefreshCw } from 'lucide-react';
import { predictionService } from '../../services/predictionService';
import { DiamondPrediction } from '../../types';
import { toast } from 'react-toastify';
import { getPredictionErrorMessage } from '../../utils/predictionErrorHandler';

interface DiamondPredictorProps {
  onPredictionComplete?: (result: DiamondPrediction) => void;
}

const CUT_OPTIONS = ['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair'];
const COLOR_OPTIONS = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
const CLARITY_OPTIONS = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'];

export const DiamondPredictor: React.FC<DiamondPredictorProps> = ({
  onPredictionComplete
}) => {
  const [carat, setCarat] = useState(1.0);
  const [cut, setCut] = useState('Ideal');
  const [color, setColor] = useState('D');
  const [clarity, setClarity] = useState('VS1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiamondPrediction | null>(null);
  const [error, setError] = useState<string>('');

  const validateForm = (): boolean => {
    setError('');

    if (carat <= 0) {
      setError('Carat must be greater than 0');
      return false;
    }

    if (carat > 10) {
      setError('Carat value seems unusually high. Please verify.');
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
      const response = await predictionService.predictDiamondPrice({
        carat,
        cut,
        color,
        clarity,
      });

      if (response.success && response.data) {
        setResult(response.data);
        onPredictionComplete?.(response.data);
        toast.success('Diamond price prediction generated successfully!');
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

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl">
          <Gem className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Diamond Price Predictor</h2>
      </div>

      <div className="space-y-6">
        {/* Carat Input */}
        <div>
          <label htmlFor="diamond-carat" className="block text-sm font-semibold text-gray-700 mb-2">
            Carat Weight
          </label>
          <input
            id="diamond-carat"
            type="number"
            value={carat}
            onChange={(e) => setCarat(parseFloat(e.target.value) || 0)}
            min="0.1"
            max="10"
            step="0.01"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            disabled={loading}
          />
          <p className="mt-2 text-sm text-gray-500">
            Enter the carat weight of the diamond (0.1 - 10.0)
          </p>
        </div>

        {/* Cut Selection */}
        <div>
          <label htmlFor="diamond-cut" className="block text-sm font-semibold text-gray-700 mb-2">
            Cut Quality
          </label>
          <select
            id="diamond-cut"
            value={cut}
            onChange={(e) => setCut(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
            disabled={loading}
          >
            {CUT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500">
            Cut quality affects how well the diamond reflects light
          </p>
        </div>

        {/* Color Selection */}
        <div>
          <label htmlFor="diamond-color" className="block text-sm font-semibold text-gray-700 mb-2">
            Color Grade
          </label>
          <select
            id="diamond-color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
            disabled={loading}
          >
            {COLOR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} {option === 'D' ? '(Colorless)' : option <= 'F' ? '(Near Colorless)' : '(Faint Color)'}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500">
            D is colorless (highest grade), J has slight color
          </p>
        </div>

        {/* Clarity Selection */}
        <div>
          <label htmlFor="diamond-clarity" className="block text-sm font-semibold text-gray-700 mb-2">
            Clarity Grade
          </label>
          <select
            id="diamond-clarity"
            value={clarity}
            onChange={(e) => setClarity(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
            disabled={loading}
          >
            {CLARITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500">
            IF (Internally Flawless) is the highest clarity grade
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
          className="w-full bg-gradient-to-r from-blue-500 to-blue-400 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-400 hover:to-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <span className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Analyzing diamond characteristics and generating prediction...</span>
            </span>
          ) : (
            'Predict Diamond Price'
          )}
        </button>

        {/* Prediction Results */}
        {result && (
          <div className="mt-8 space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Prediction Results</h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Predicted Price</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(result.predicted_price)}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Diamond Specifications</p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-xs text-gray-500">Carat</p>
                    <p className="text-sm font-semibold text-gray-900">{result.features_used.carat}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cut</p>
                    <p className="text-sm font-semibold text-gray-900">{result.features_used.cut}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Color</p>
                    <p className="text-sm font-semibold text-gray-900">{result.features_used.color}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Clarity</p>
                    <p className="text-sm font-semibold text-gray-900">{result.features_used.clarity}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Confidence Interval (95%)</p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-xs text-gray-500">Lower Bound</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {formatCurrency(result.confidence_interval.lower)}
                    </p>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-2 bg-gradient-to-r from-blue-300 via-blue-500 to-blue-300 rounded-full"></div>
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
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${result.model_accuracy * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {(result.model_accuracy * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> This prediction is based on the 4Cs (Carat, Cut, Color, Clarity) and historical market data.
                Actual prices may vary based on additional factors such as fluorescence, certification, and market demand.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
