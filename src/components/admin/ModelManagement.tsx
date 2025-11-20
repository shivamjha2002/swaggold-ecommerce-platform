import { useState, useEffect } from 'react';
import { Brain, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp, Database } from 'lucide-react';
import { toast } from 'react-toastify';
import { predictionService } from '../../services/predictionService';
import { ConfirmDialog } from '../ConfirmDialog';
import { getErrorMessage } from '../../utils/errorHandler';

interface ModelTrainingMetrics {
    r2_score?: number;
    rmse?: number;
    mae?: number;
}

interface ModelTrainingInfo {
    trained_at: string;
    metrics: ModelTrainingMetrics;
    data_points: number;
}

interface ModelInfo {
    loaded: boolean;
    trained: boolean;
    last_training: ModelTrainingInfo | null;
}

interface ModelsStatus {
    gold_model: ModelInfo;
    diamond_model: ModelInfo;
}

export const ModelManagement = () => {
    const [modelsStatus, setModelsStatus] = useState<ModelsStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [retraining, setRetraining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showRetrainDialog, setShowRetrainDialog] = useState(false);
    const [retrainType, setRetrainType] = useState<'gold' | 'diamond' | null>(null);

    useEffect(() => {
        fetchModelsStatus();
    }, []);

    const fetchModelsStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await predictionService.getModelsStatus();
            setModelsStatus(response.data);
        } catch (err) {
            console.error('Error fetching models status:', err);
            setError(getErrorMessage(err) || 'Failed to load models status');
        } finally {
            setLoading(false);
        }
    };

    const handleRetrainClick = (modelType: 'gold' | 'diamond') => {
        setRetrainType(modelType);
        setShowRetrainDialog(true);
    };

    const handleRetrainConfirm = async () => {
        if (!retrainType) return;

        setRetraining(true);
        setShowRetrainDialog(false);

        try {
            const response = await predictionService.retrainModels(retrainType);
            toast.success(`${retrainType === 'gold' ? 'Gold' : 'Diamond'} model retrained successfully!`);

            // Refresh model status after retraining
            await fetchModelsStatus();
        } catch (err) {
            console.error('Error retraining model:', err);
            toast.error(getErrorMessage(err) || 'Failed to retrain model');
        } finally {
            setRetraining(false);
            setRetrainType(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatMetric = (value: number | undefined, decimals = 2) => {
        if (value === undefined) return 'N/A';
        return value.toFixed(decimals);
    };

    const renderModelCard = (
        modelName: string,
        modelType: 'gold' | 'diamond',
        modelInfo: ModelInfo
    ) => {
        const isHealthy = modelInfo.loaded && modelInfo.trained;
        const accuracy = modelInfo.last_training?.metrics.r2_score;
        const accuracyPercentage = accuracy ? (accuracy * 100).toFixed(1) : 'N/A';

        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className={`px-6 py-4 ${isHealthy ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gradient-to-r from-red-50 to-orange-50'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Brain className={`h-6 w-6 ${isHealthy ? 'text-green-600' : 'text-red-600'}`} />
                            <h3 className="text-lg font-bold text-gray-900">{modelName}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                            {isHealthy ? (
                                <span className="flex items-center space-x-1 bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Trained</span>
                                </span>
                            ) : (
                                <span className="flex items-center space-x-1 bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
                                    <XCircle className="h-3 w-3" />
                                    <span>Not Trained</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    {/* Status Indicators */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <div className={`h-2 w-2 rounded-full ${modelInfo.loaded ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm text-gray-600">
                                {modelInfo.loaded ? 'Loaded' : 'Not Loaded'}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className={`h-2 w-2 rounded-full ${modelInfo.trained ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className="text-sm text-gray-600">
                                {modelInfo.trained ? 'Trained' : 'Not Trained'}
                            </span>
                        </div>
                    </div>

                    {/* Training Info */}
                    {modelInfo.last_training ? (
                        <div className="space-y-3 pt-3 border-t border-gray-200">
                            {/* Last Training Date */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Clock className="h-4 w-4" />
                                    <span>Last Trained:</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    {formatDate(modelInfo.last_training.trained_at)}
                                </span>
                            </div>

                            {/* Data Points */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Database className="h-4 w-4" />
                                    <span>Data Points:</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    {modelInfo.last_training.data_points.toLocaleString()}
                                </span>
                            </div>

                            {/* Accuracy */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Accuracy (R²):</span>
                                </div>
                                <span className="text-sm font-bold text-green-600">
                                    {accuracyPercentage}%
                                </span>
                            </div>

                            {/* Metrics */}
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                <h4 className="text-xs font-semibold text-gray-700 uppercase">Training Metrics</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {modelInfo.last_training.metrics.r2_score !== undefined && (
                                        <div>
                                            <span className="text-gray-600">R² Score:</span>
                                            <span className="ml-2 font-medium text-gray-900">
                                                {formatMetric(modelInfo.last_training.metrics.r2_score, 4)}
                                            </span>
                                        </div>
                                    )}
                                    {modelInfo.last_training.metrics.rmse !== undefined && (
                                        <div>
                                            <span className="text-gray-600">RMSE:</span>
                                            <span className="ml-2 font-medium text-gray-900">
                                                {formatMetric(modelInfo.last_training.metrics.rmse, 2)}
                                            </span>
                                        </div>
                                    )}
                                    {modelInfo.last_training.metrics.mae !== undefined && (
                                        <div>
                                            <span className="text-gray-600">MAE:</span>
                                            <span className="ml-2 font-medium text-gray-900">
                                                {formatMetric(modelInfo.last_training.metrics.mae, 2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                            No training history available
                        </div>
                    )}

                    {/* Retrain Button */}
                    <button
                        onClick={() => handleRetrainClick(modelType)}
                        disabled={retraining}
                        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`h-4 w-4 ${retraining ? 'animate-spin' : ''}`} />
                        <span>{retraining ? 'Retraining...' : 'Retrain Model'}</span>
                    </button>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                    <Brain className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">ML Models Management</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Loading Skeletons */}
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-gray-100 rounded-xl h-96 animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                    <Brain className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">ML Models Management</h2>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={fetchModelsStatus}
                        className="mt-2 text-sm text-red-700 underline hover:text-red-800"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!modelsStatus) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                    <Brain className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">ML Models Management</h2>
                </div>
                <div className="text-center py-8 text-gray-500">
                    No models status available
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <Brain className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">ML Models Management</h2>
                    </div>
                    <button
                        onClick={fetchModelsStatus}
                        disabled={loading || retraining}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh Status</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {renderModelCard('Gold Price Predictor', 'gold', modelsStatus.gold_model)}
                    {renderModelCard('Diamond Price Predictor', 'diamond', modelsStatus.diamond_model)}
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Retraining models will use the latest historical data from the database.
                        Ensure sufficient data is available before retraining. The process may take a few minutes.
                    </p>
                </div>
            </div>

            {/* Retrain Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showRetrainDialog}
                onClose={() => setShowRetrainDialog(false)}
                onConfirm={handleRetrainConfirm}
                title="Retrain Model"
                message={`Are you sure you want to retrain the ${retrainType === 'gold' ? 'Gold' : 'Diamond'} price prediction model? This process may take a few minutes.`}
                confirmText="Retrain"
                cancelText="Cancel"
            />
        </>
    );
};
