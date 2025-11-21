"""Diamond price predictor using Random Forest Regression."""
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import pandas as pd
import numpy as np
import pickle


class DiamondPricePredictor:
    """
    Diamond price prediction model using Random Forest.
    
    Features:
    - Carat (weight)
    - Cut quality (encoded)
    - Color grade (encoded)
    - Clarity grade (encoded)
    """
    
    def __init__(self, n_estimators=100, max_depth=10, random_state=42):
        """
        Initialize the diamond price predictor.
        
        Args:
            n_estimators: Number of trees in the forest
            max_depth: Maximum depth of trees
            random_state: Random state for reproducibility
        """
        self.model = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=random_state,
            n_jobs=-1  # Use all available cores
        )
        self.encoders = {
            'cut': LabelEncoder(),
            'color': LabelEncoder(),
            'clarity': LabelEncoder()
        }
        self.is_trained = False
        self.feature_cols = ['carat', 'cut_encoded', 'color_encoded', 'clarity_encoded']
        
        # Define valid values for categorical features
        self.valid_cuts = ['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor']
        self.valid_colors = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']
        self.valid_clarities = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3']
    
    def prepare_features(self, df):
        """
        Encode categorical features for diamond data.
        
        Args:
            df: DataFrame with 'carat', 'cut', 'color', 'clarity' columns
        
        Returns:
            DataFrame: DataFrame with encoded features
        """
        df = df.copy()
        
        # Validate categorical values
        if 'cut' in df.columns:
            invalid_cuts = set(df['cut'].unique()) - set(self.valid_cuts)
            if invalid_cuts:
                raise ValueError(f"Invalid cut values: {invalid_cuts}")
        
        if 'color' in df.columns:
            invalid_colors = set(df['color'].unique()) - set(self.valid_colors)
            if invalid_colors:
                raise ValueError(f"Invalid color values: {invalid_colors}")
        
        if 'clarity' in df.columns:
            invalid_clarities = set(df['clarity'].unique()) - set(self.valid_clarities)
            if invalid_clarities:
                raise ValueError(f"Invalid clarity values: {invalid_clarities}")
        
        # Encode categorical variables
        df['cut_encoded'] = self.encoders['cut'].fit_transform(df['cut'])
        df['color_encoded'] = self.encoders['color'].fit_transform(df['color'])
        df['clarity_encoded'] = self.encoders['clarity'].fit_transform(df['clarity'])
        
        return df
    
    def train(self, historical_data):
        """
        Train the model on historical diamond data.
        
        Args:
            historical_data: DataFrame with 'carat', 'cut', 'color', 'clarity', 'price' columns
        
        Returns:
            dict: Training metrics including R2 score
        """
        if len(historical_data) < 50:
            raise ValueError("Need at least 50 data points for training")
        
        # Prepare features
        df = self.prepare_features(historical_data)
        
        # Extract features and target
        X = df[self.feature_cols].values
        y = df['price'].values
        
        # Train model
        self.model.fit(X, y)
        self.is_trained = True
        
        # Calculate metrics
        train_score = self.model.score(X, y)
        predictions = self.model.predict(X)
        
        # Calculate RMSE and MAE
        rmse = np.sqrt(np.mean((y - predictions) ** 2))
        mae = np.mean(np.abs(y - predictions))
        
        # Calculate MAPE (Mean Absolute Percentage Error)
        mape = np.mean(np.abs((y - predictions) / y)) * 100
        
        return {
            'r2_score': float(train_score),
            'rmse': float(rmse),
            'mae': float(mae),
            'mape': float(mape),
            'data_points': len(df)
        }
    
    def _encode_features(self, carat, cut, color, clarity):
        """
        Encode features for a single diamond.
        
        Args:
            carat: Diamond carat weight
            cut: Cut quality
            color: Color grade
            clarity: Clarity grade
        
        Returns:
            numpy array: Encoded feature vector
        """
        # Validate inputs
        if cut not in self.valid_cuts:
            raise ValueError(f"Invalid cut: {cut}. Must be one of {self.valid_cuts}")
        if color not in self.valid_colors:
            raise ValueError(f"Invalid color: {color}. Must be one of {self.valid_colors}")
        if clarity not in self.valid_clarities:
            raise ValueError(f"Invalid clarity: {clarity}. Must be one of {self.valid_clarities}")
        if carat <= 0:
            raise ValueError("Carat must be positive")
        
        # Encode categorical features
        cut_encoded = self.encoders['cut'].transform([cut])[0]
        color_encoded = self.encoders['color'].transform([color])[0]
        clarity_encoded = self.encoders['clarity'].transform([clarity])[0]
        
        # Create feature vector
        features = np.array([[carat, cut_encoded, color_encoded, clarity_encoded]])
        
        return features
    
    def predict(self, carat, cut, color, clarity):
        """
        Predict diamond price based on 4Cs.
        
        Args:
            carat: Diamond carat weight
            cut: Cut quality (Ideal, Excellent, Very Good, Good, Fair, Poor)
            color: Color grade (D, E, F, G, H, I, J, K, L, M)
            clarity: Clarity grade (FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2, I1, I2, I3)
        
        Returns:
            dict: Prediction results with confidence interval
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Please train the model first.")
        
        # Encode features
        features = self._encode_features(carat, cut, color, clarity)
        
        # Make prediction
        prediction = self.model.predict(features)[0]
        
        # Estimate confidence interval using tree predictions
        tree_predictions = np.array([tree.predict(features)[0] for tree in self.model.estimators_])
        std_error = np.std(tree_predictions)
        
        confidence_interval = {
            'lower': float(max(0, prediction - 1.96 * std_error)),  # Ensure non-negative
            'upper': float(prediction + 1.96 * std_error)
        }
        
        return {
            'predicted_price': float(prediction),
            'confidence_interval': confidence_interval,
            'features_used': {
                'carat': carat,
                'cut': cut,
                'color': color,
                'clarity': clarity
            }
        }
    
    def get_feature_importance(self):
        """
        Get feature importance from the trained model.
        
        Returns:
            dict: Feature importance scores
        """
        if not self.is_trained:
            raise ValueError("Model not trained")
        
        importances = self.model.feature_importances_
        
        return {
            'carat': float(importances[0]),
            'cut': float(importances[1]),
            'color': float(importances[2]),
            'clarity': float(importances[3])
        }
    
    def save_encoders(self, filepath):
        """
        Save label encoders to file.
        
        Args:
            filepath: Path to save encoders
        """
        with open(filepath, 'wb') as f:
            pickle.dump(self.encoders, f)
    
    def load_encoders(self, filepath):
        """
        Load label encoders from file.
        
        Args:
            filepath: Path to load encoders from
        """
        with open(filepath, 'rb') as f:
            self.encoders = pickle.load(f)
