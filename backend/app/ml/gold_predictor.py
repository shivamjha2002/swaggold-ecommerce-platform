"""Gold price predictor using Linear Regression with time-based features."""
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import pandas as pd
import numpy as np
from datetime import datetime, timedelta


class GoldPricePredictor:
    """
    Gold price prediction model using Linear Regression.
    
    Features:
    - Time-based features (day of week, month, day of month)
    - Moving averages (7-day, 30-day)
    - Price momentum indicators
    - Lag features
    """
    
    def __init__(self):
        """Initialize the gold price predictor."""
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_cols = [
            'day_of_week', 'month', 'day_of_month',
            'ma_7', 'ma_30', 'price_change', 'price_change_pct',
            'price_lag_1', 'price_lag_7'
        ]
        self.last_training_data = None
    
    def prepare_features(self, df):
        """
        Prepare features from historical price data.
        
        Args:
            df: DataFrame with 'date' and 'price_per_gram' columns
        
        Returns:
            DataFrame: DataFrame with engineered features
        """
        df = df.copy()
        
        # Ensure date is datetime
        if not pd.api.types.is_datetime64_any_dtype(df['date']):
            df['date'] = pd.to_datetime(df['date'])
        
        # Sort by date
        df = df.sort_values('date').reset_index(drop=True)
        
        # Time-based features
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        df['day_of_month'] = df['date'].dt.day
        
        # Moving averages
        df['ma_7'] = df['price_per_gram'].rolling(window=7, min_periods=1).mean()
        df['ma_30'] = df['price_per_gram'].rolling(window=30, min_periods=1).mean()
        
        # Price momentum
        df['price_change'] = df['price_per_gram'].diff().fillna(0)
        df['price_change_pct'] = df['price_per_gram'].pct_change().fillna(0)
        
        # Lag features
        df['price_lag_1'] = df['price_per_gram'].shift(1).fillna(df['price_per_gram'].iloc[0])
        df['price_lag_7'] = df['price_per_gram'].shift(7).fillna(df['price_per_gram'].iloc[0])
        
        return df
    
    def train(self, historical_data):
        """
        Train the model on historical data.
        
        Args:
            historical_data: DataFrame with 'date' and 'price_per_gram' columns
        
        Returns:
            dict: Training metrics including R2 score
        """
        if len(historical_data) < 30:
            raise ValueError("Need at least 30 data points for training")
        
        # Prepare features
        df = self.prepare_features(historical_data)
        
        # Store last training data for predictions
        self.last_training_data = df.tail(30).copy()
        
        # Extract features and target
        X = df[self.feature_cols].values
        y = df['price_per_gram'].values
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        self.is_trained = True
        
        # Calculate metrics
        train_score = self.model.score(X_scaled, y)
        predictions = self.model.predict(X_scaled)
        
        # Calculate RMSE and MAE
        rmse = np.sqrt(np.mean((y - predictions) ** 2))
        mae = np.mean(np.abs(y - predictions))
        
        return {
            'r2_score': float(train_score),
            'rmse': float(rmse),
            'mae': float(mae),
            'data_points': len(df)
        }
    
    def _prepare_prediction_features(self, target_date, recent_data):
        """
        Prepare features for a future date prediction.
        
        Args:
            target_date: datetime object for prediction
            recent_data: DataFrame with recent historical data
        
        Returns:
            numpy array: Feature vector for prediction
        """
        # Time-based features for target date
        day_of_week = target_date.weekday()
        month = target_date.month
        day_of_month = target_date.day
        
        # Calculate moving averages from recent data
        recent_prices = recent_data['price_per_gram'].values
        ma_7 = np.mean(recent_prices[-7:]) if len(recent_prices) >= 7 else np.mean(recent_prices)
        ma_30 = np.mean(recent_prices[-30:]) if len(recent_prices) >= 30 else np.mean(recent_prices)
        
        # Price momentum
        price_change = recent_prices[-1] - recent_prices[-2] if len(recent_prices) >= 2 else 0
        price_change_pct = price_change / recent_prices[-2] if len(recent_prices) >= 2 and recent_prices[-2] != 0 else 0
        
        # Lag features
        price_lag_1 = recent_prices[-1]
        price_lag_7 = recent_prices[-7] if len(recent_prices) >= 7 else recent_prices[0]
        
        # Create feature vector
        features = np.array([[
            day_of_week, month, day_of_month,
            ma_7, ma_30, price_change, price_change_pct,
            price_lag_1, price_lag_7
        ]])
        
        return features
    
    def predict(self, target_date, recent_data=None):
        """
        Predict gold price for a future date.
        
        Args:
            target_date: datetime object or string (YYYY-MM-DD) for prediction
            recent_data: DataFrame with recent historical data (optional, uses last training data if not provided)
        
        Returns:
            dict: Prediction results with confidence interval
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Please train the model first.")
        
        # Convert target_date to datetime if string
        if isinstance(target_date, str):
            target_date = datetime.strptime(target_date, '%Y-%m-%d')
        
        # Use last training data if recent_data not provided
        if recent_data is None:
            if self.last_training_data is None:
                raise ValueError("No recent data available for prediction")
            recent_data = self.last_training_data
        else:
            recent_data = self.prepare_features(recent_data)
        
        # Prepare features for prediction
        features = self._prepare_prediction_features(target_date, recent_data)
        features_scaled = self.scaler.transform(features)
        
        # Make prediction
        prediction = self.model.predict(features_scaled)[0]
        
        # Calculate confidence interval (simplified using recent price volatility)
        recent_prices = recent_data['price_per_gram'].values
        std_error = np.std(recent_prices) * 0.05  # 5% of standard deviation
        
        confidence_interval = {
            'lower': float(prediction - 1.96 * std_error),
            'upper': float(prediction + 1.96 * std_error)
        }
        
        return {
            'predicted_price': float(prediction),
            'confidence_interval': confidence_interval,
            'target_date': target_date.strftime('%Y-%m-%d')
        }
    
    def predict_with_weight(self, target_date, weight_grams, recent_data=None):
        """
        Predict total gold price for a specific weight.
        
        Args:
            target_date: datetime object or string for prediction
            weight_grams: Weight in grams
            recent_data: DataFrame with recent historical data
        
        Returns:
            dict: Prediction results with total price
        """
        prediction = self.predict(target_date, recent_data)
        
        # Calculate total price
        total_price = prediction['predicted_price'] * weight_grams
        total_lower = prediction['confidence_interval']['lower'] * weight_grams
        total_upper = prediction['confidence_interval']['upper'] * weight_grams
        
        return {
            'predicted_price_per_gram': prediction['predicted_price'],
            'weight_grams': weight_grams,
            'total_price': float(total_price),
            'confidence_interval': {
                'lower': float(total_lower),
                'upper': float(total_upper)
            },
            'target_date': prediction['target_date']
        }
