"""ML service for loading and using trained models."""
import joblib
import os
from datetime import datetime
import pandas as pd
from app.ml.gold_predictor import GoldPricePredictor
from app.ml.diamond_predictor import DiamondPricePredictor
from app.models.price_history import PriceHistory, DiamondPriceHistory, TrainingLog


class MLService:
    """
    Machine learning service for managing and using trained models.
    
    Handles:
    - Loading trained models from disk
    - Making predictions
    - Error handling for untrained models
    """
    
    def __init__(self, models_dir='models'):
        """
        Initialize ML service.
        
        Args:
            models_dir: Directory where trained models are stored
        """
        self.models_dir = models_dir
        self.gold_model = None
        self.diamond_model = None
        self.gold_model_path = os.path.join(models_dir, 'gold_model.pkl')
        self.diamond_model_path = os.path.join(models_dir, 'diamond_model.pkl')
        
        # Create models directory if it doesn't exist
        os.makedirs(models_dir, exist_ok=True)
        
        # Try to load models on initialization
        self.load_models()
    
    def load_models(self):
        """
        Load trained models from disk.
        
        Returns:
            dict: Status of loaded models
        """
        status = {
            'gold_model_loaded': False,
            'diamond_model_loaded': False
        }
        
        # Load gold model
        if os.path.exists(self.gold_model_path):
            try:
                self.gold_model = joblib.load(self.gold_model_path)
                status['gold_model_loaded'] = True
            except Exception as e:
                print(f"Error loading gold model: {str(e)}")
        
        # Load diamond model
        if os.path.exists(self.diamond_model_path):
            try:
                self.diamond_model = joblib.load(self.diamond_model_path)
                status['diamond_model_loaded'] = True
            except Exception as e:
                print(f"Error loading diamond model: {str(e)}")
        
        return status
    
    def predict_gold_price(self, target_date, weight_grams=None):
        """
        Predict gold price for a future date.
        
        Args:
            target_date: Date for prediction (datetime or string)
            weight_grams: Optional weight in grams for total price calculation
        
        Returns:
            dict: Prediction results with confidence interval
        
        Raises:
            ValueError: If gold model is not loaded or trained
        """
        if self.gold_model is None or not self.gold_model.is_trained:
            raise ValueError("Gold price prediction model is not trained. Please train the model first.")
        
        # Get recent price data from database
        recent_prices = PriceHistory.objects(
            metal_type='gold',
            purity='916'
        ).order_by('-date').limit(90)
        
        if len(recent_prices) < 30:
            raise ValueError("Insufficient historical data for prediction. Need at least 30 data points.")
        
        # Convert to DataFrame
        df = pd.DataFrame([{
            'date': p.date,
            'price_per_gram': p.price_per_gram
        } for p in reversed(list(recent_prices))])
        
        # Make prediction
        if weight_grams:
            result = self.gold_model.predict_with_weight(target_date, weight_grams, df)
        else:
            result = self.gold_model.predict(target_date, df)
        
        # Get model accuracy from latest training log
        latest_log = TrainingLog.objects(model_name='gold_predictor').order_by('-trained_at').first()
        if latest_log:
            result['model_accuracy'] = latest_log.metrics.get('r2_score', 0)
            result['last_trained'] = latest_log.trained_at.isoformat()
        
        return result
    
    def predict_diamond_price(self, carat, cut, color, clarity):
        """
        Predict diamond price based on 4Cs.
        
        Args:
            carat: Diamond carat weight
            cut: Cut quality
            color: Color grade
            clarity: Clarity grade
        
        Returns:
            dict: Prediction results with confidence interval
        
        Raises:
            ValueError: If diamond model is not loaded or trained
        """
        if self.diamond_model is None or not self.diamond_model.is_trained:
            raise ValueError("Diamond price prediction model is not trained. Please train the model first.")
        
        # Make prediction
        result = self.diamond_model.predict(carat, cut, color, clarity)
        
        # Get model accuracy from latest training log
        latest_log = TrainingLog.objects(model_name='diamond_predictor').order_by('-trained_at').first()
        if latest_log:
            result['model_accuracy'] = latest_log.metrics.get('r2_score', 0)
            result['last_trained'] = latest_log.trained_at.isoformat()
        
        return result
    
    def get_gold_price_trends(self, days=30):
        """
        Get historical gold price trends.
        
        Args:
            days: Number of days to look back
        
        Returns:
            dict: Price trends with statistics
        """
        prices = PriceHistory.get_price_trend(metal_type='gold', purity='916', days=days)
        
        if not prices:
            return {
                'prices': [],
                'statistics': {}
            }
        
        # Calculate statistics
        price_values = [p['price_per_gram'] for p in prices]
        
        statistics = {
            'average': float(sum(price_values) / len(price_values)),
            'min': float(min(price_values)),
            'max': float(max(price_values)),
            'current': float(price_values[-1]) if price_values else 0,
            'change': float(price_values[-1] - price_values[0]) if len(price_values) > 1 else 0,
            'change_percent': float(((price_values[-1] - price_values[0]) / price_values[0]) * 100) if len(price_values) > 1 and price_values[0] != 0 else 0
        }
        
        return {
            'prices': prices,
            'statistics': statistics,
            'period_days': days
        }
    
    def is_gold_model_ready(self):
        """
        Check if gold model is ready for predictions.
        
        Returns:
            bool: True if model is loaded and trained
        """
        return self.gold_model is not None and self.gold_model.is_trained
    
    def is_diamond_model_ready(self):
        """
        Check if diamond model is ready for predictions.
        
        Returns:
            bool: True if model is loaded and trained
        """
        return self.diamond_model is not None and self.diamond_model.is_trained
    
    def get_models_status(self):
        """
        Get status of all models.
        
        Returns:
            dict: Status information for all models
        """
        status = {
            'gold_model': {
                'loaded': self.gold_model is not None,
                'trained': self.is_gold_model_ready(),
                'last_training': None
            },
            'diamond_model': {
                'loaded': self.diamond_model is not None,
                'trained': self.is_diamond_model_ready(),
                'last_training': None
            }
        }
        
        # Get last training info for gold model
        gold_log = TrainingLog.objects(model_name='gold_predictor').order_by('-trained_at').first()
        if gold_log:
            status['gold_model']['last_training'] = {
                'trained_at': gold_log.trained_at.isoformat(),
                'metrics': gold_log.metrics,
                'data_points': gold_log.data_points
            }
        
        # Get last training info for diamond model
        diamond_log = TrainingLog.objects(model_name='diamond_predictor').order_by('-trained_at').first()
        if diamond_log:
            status['diamond_model']['last_training'] = {
                'trained_at': diamond_log.trained_at.isoformat(),
                'metrics': diamond_log.metrics,
                'data_points': diamond_log.data_points
            }
        
        return status
    
    def reload_models(self):
        """
        Reload models from disk.
        
        Returns:
            dict: Status of reloaded models
        """
        return self.load_models()


# Global ML service instance
ml_service = MLService()
