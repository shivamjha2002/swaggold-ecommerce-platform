import { useState, lazy, Suspense } from 'react';
import { TrendingUp, Gem, BarChart3 } from 'lucide-react';
import { GoldPrediction, DiamondPrediction } from '../types';

// Lazy load heavy chart components
const GoldPredictor = lazy(() => import('../components/predictions/GoldPredictor').then(module => ({ default: module.GoldPredictor })));
const DiamondPredictor = lazy(() => import('../components/predictions/DiamondPredictor').then(module => ({ default: module.DiamondPredictor })));
const PriceChart = lazy(() => import('../components/predictions/PriceChart').then(module => ({ default: module.PriceChart })));

// Loading component for lazy-loaded prediction components
const ComponentLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
  </div>
);

type TabType = 'gold' | 'diamond' | 'trends';

const Predictions = () => {
  const [activeTab, setActiveTab] = useState<TabType>('gold');
  const [goldPrediction, setGoldPrediction] = useState<GoldPrediction | null>(null);
  const [diamondPrediction, setDiamondPrediction] = useState<DiamondPrediction | null>(null);

  const tabs = [
    {
      id: 'gold' as TabType,
      label: 'Gold Price',
      icon: TrendingUp,
      color: 'yellow',
    },
    {
      id: 'diamond' as TabType,
      label: 'Diamond Price',
      icon: Gem,
      color: 'blue',
    },
    {
      id: 'trends' as TabType,
      label: 'Price Trends',
      icon: BarChart3,
      color: 'green',
    },
  ];

  const handleGoldPrediction = (result: GoldPrediction) => {
    setGoldPrediction(result);
  };

  const handleDiamondPrediction = (result: DiamondPrediction) => {
    setDiamondPrediction(result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Price <span className="text-yellow-500">Predictions</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI-powered price predictions for gold and diamonds based on historical data and market trends
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform ${
                  isActive
                    ? `bg-gradient-to-r ${
                        tab.color === 'yellow'
                          ? 'from-yellow-500 to-yellow-400'
                          : tab.color === 'blue'
                          ? 'from-blue-500 to-blue-400'
                          : 'from-green-500 to-green-400'
                      } text-white shadow-xl scale-105`
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg hover:scale-105'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'gold' && (
            <div className="space-y-8">
              <Suspense fallback={<ComponentLoader />}>
                <GoldPredictor onPredictionComplete={handleGoldPrediction} />
              </Suspense>
              
              {goldPrediction && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Understanding Your Gold Price Prediction
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">What is a Confidence Interval?</h4>
                        <p className="text-gray-600 text-sm">
                          The confidence interval shows the range where the actual price is likely to fall. 
                          A 95% confidence interval means we're 95% confident the actual price will be within this range.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Model Accuracy</h4>
                        <p className="text-gray-600 text-sm">
                          Our model accuracy of {(goldPrediction.model_accuracy * 100).toFixed(1)}% indicates 
                          how well the model has performed on historical data. Higher accuracy means more reliable predictions.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Factors Affecting Gold Prices</h4>
                        <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
                          <li>Global economic conditions</li>
                          <li>Currency exchange rates</li>
                          <li>Inflation and interest rates</li>
                          <li>Geopolitical events</li>
                          <li>Supply and demand dynamics</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'diamond' && (
            <div className="space-y-8">
              <Suspense fallback={<ComponentLoader />}>
                <DiamondPredictor onPredictionComplete={handleDiamondPrediction} />
              </Suspense>
              
              {diamondPrediction && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Understanding Diamond Pricing
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">The 4Cs of Diamonds</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <strong className="text-gray-900">Carat:</strong>
                            <span className="text-gray-600"> Weight of the diamond (1 carat = 200mg)</span>
                          </div>
                          <div>
                            <strong className="text-gray-900">Cut:</strong>
                            <span className="text-gray-600"> Quality of the diamond's proportions and finish</span>
                          </div>
                          <div>
                            <strong className="text-gray-900">Color:</strong>
                            <span className="text-gray-600"> Absence of color (D is colorless, J has slight color)</span>
                          </div>
                          <div>
                            <strong className="text-gray-900">Clarity:</strong>
                            <span className="text-gray-600"> Absence of inclusions and blemishes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Price Factors</h4>
                        <p className="text-gray-600 text-sm mb-2">
                          Diamond prices are primarily determined by the 4Cs, but other factors also play a role:
                        </p>
                        <ul className="text-gray-600 text-sm space-y-1 list-disc list-inside">
                          <li>Fluorescence</li>
                          <li>Certification (GIA, IGI, etc.)</li>
                          <li>Shape and cut style</li>
                          <li>Market demand and trends</li>
                          <li>Origin and provenance</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-8">
              <Suspense fallback={<ComponentLoader />}>
                <PriceChart metalType="gold" />
              </Suspense>
              
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  How to Read Price Trends
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-1 bg-blue-500 rounded"></div>
                      <h4 className="font-semibold text-gray-900">Price Line</h4>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Shows the actual daily gold price per gram over the selected time period.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-1 bg-green-500 rounded border-dashed border-2 border-green-500"></div>
                      <h4 className="font-semibold text-gray-900">7-Day MA</h4>
                    </div>
                    <p className="text-gray-600 text-sm">
                      7-day moving average smooths out short-term fluctuations to show the trend.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-1 bg-orange-500 rounded border-dashed border-2 border-orange-500"></div>
                      <h4 className="font-semibold text-gray-900">30-Day MA</h4>
                    </div>
                    <p className="text-gray-600 text-sm">
                      30-day moving average shows longer-term price trends and patterns.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> When the short-term moving average (7-day) crosses above the long-term 
                    moving average (30-day), it often indicates an upward trend. The opposite suggests a downward trend.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-2xl">
          <h4 className="font-bold text-yellow-900 mb-2">Important Disclaimer</h4>
          <p className="text-sm text-yellow-800">
            These predictions are generated using machine learning models trained on historical data. 
            They are for informational purposes only and should not be considered as financial advice. 
            Actual market prices may vary significantly due to various economic, political, and market factors. 
            Always consult with a qualified financial advisor before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Predictions;
