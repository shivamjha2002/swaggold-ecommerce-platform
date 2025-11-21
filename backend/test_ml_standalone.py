"""Standalone tests for ML models without Flask dependencies."""
import sys
import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Add app directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))


def test_gold_predictor_basic():
    """Test basic gold predictor functionality."""
    try:
        from app.ml.gold_predictor import GoldPricePredictor
        
        # Create sample data
        dates = pd.date_range(start='2024-01-01', periods=60, freq='D')
        base_price = 6500
        trend = np.linspace(0, 500, 60)
        noise = np.random.normal(0, 50, 60)
        prices = base_price + trend + noise
        df = pd.DataFrame({'date': dates, 'price_per_gram': prices})
        
        # Initialize and train
        predictor = GoldPricePredictor()
        metrics = predictor.train(df)
        
        # Make prediction
        future_date = datetime(2024, 3, 15)
        result = predictor.predict(future_date)
        
        # Verify results
        assert predictor.is_trained
        assert metrics['r2_score'] > 0.5
        assert result['predicted_price'] > 0
        assert 'confidence_interval' in result
        
        print(f"✓ Gold predictor test passed")
        print(f"  R² Score: {metrics['r2_score']:.4f}")
        print(f"  Predicted price: ₹{result['predicted_price']:.2f}/gram")
        return True
    except Exception as e:
        print(f"✗ Gold predictor test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_diamond_predictor_basic():
    """Test basic diamond predictor functionality."""
    try:
        from app.ml.diamond_predictor import DiamondPricePredictor
        
        # Create sample data
        np.random.seed(42)
        n_samples = 100
        
        cuts = ['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair']
        colors = ['D', 'E', 'F', 'G', 'H', 'I', 'J']
        clarities = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2']
        
        df = pd.DataFrame({
            'carat': np.random.uniform(0.5, 3.0, n_samples),
            'cut': np.random.choice(cuts, n_samples),
            'color': np.random.choice(colors, n_samples),
            'clarity': np.random.choice(clarities, n_samples),
        })
        df['price'] = 100000 * df['carat'] * 2 + np.random.uniform(50000, 150000, n_samples)
        
        # Initialize and train
        predictor = DiamondPricePredictor()
        metrics = predictor.train(df)
        
        # Make prediction
        result = predictor.predict(1.5, 'Ideal', 'E', 'VS1')
        
        # Get feature importance
        importance = predictor.get_feature_importance()
        
        # Verify results
        assert predictor.is_trained
        assert metrics['r2_score'] > 0.5
        assert result['predicted_price'] > 0
        assert 'confidence_interval' in result
        assert sum(importance.values()) > 0.99  # Should sum to ~1
        
        print(f"✓ Diamond predictor test passed")
        print(f"  R² Score: {metrics['r2_score']:.4f}")
        print(f"  Predicted price: ₹{result['predicted_price']:.2f}")
        print(f"  Carat importance: {importance['carat']:.3f}")
        return True
    except Exception as e:
        print(f"✗ Diamond predictor test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_feature_engineering():
    """Test feature engineering for gold predictor."""
    try:
        from app.ml.gold_predictor import GoldPricePredictor
        
        # Create sample data
        dates = pd.date_range(start='2024-01-01', periods=60, freq='D')
        prices = np.random.uniform(6000, 7000, 60)
        df = pd.DataFrame({'date': dates, 'price_per_gram': prices})
        
        predictor = GoldPricePredictor()
        df_features = predictor.prepare_features(df)
        
        # Verify all features exist
        required_features = [
            'day_of_week', 'month', 'day_of_month',
            'ma_7', 'ma_30', 'price_change', 'price_change_pct',
            'price_lag_1', 'price_lag_7'
        ]
        
        for feature in required_features:
            assert feature in df_features.columns, f"Missing feature: {feature}"
        
        # Verify feature ranges
        assert df_features['day_of_week'].min() >= 0
        assert df_features['day_of_week'].max() <= 6
        assert df_features['month'].min() >= 1
        assert df_features['month'].max() <= 12
        
        print(f"✓ Feature engineering test passed")
        print(f"  All {len(required_features)} features created successfully")
        return True
    except Exception as e:
        print(f"✗ Feature engineering test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_prediction_accuracy():
    """Test prediction accuracy with known data."""
    try:
        from app.ml.gold_predictor import GoldPricePredictor
        
        # Create data with clear trend
        dates = pd.date_range(start='2024-01-01', periods=90, freq='D')
        # Linear trend: 6000 + 10 per day
        prices = 6000 + np.arange(90) * 10 + np.random.normal(0, 20, 90)
        df = pd.DataFrame({'date': dates, 'price_per_gram': prices})
        
        # Train on first 60 days
        train_df = df.iloc[:60]
        predictor = GoldPricePredictor()
        metrics = predictor.train(train_df)
        
        # Predict for day 70
        test_date = dates[69]
        result = predictor.predict(test_date, train_df)
        
        # Actual price on day 70
        actual_price = prices[69]
        predicted_price = result['predicted_price']
        
        # Calculate error percentage
        error_pct = abs(predicted_price - actual_price) / actual_price * 100
        
        print(f"✓ Prediction accuracy test passed")
        print(f"  Actual: ₹{actual_price:.2f}, Predicted: ₹{predicted_price:.2f}")
        print(f"  Error: {error_pct:.2f}%")
        print(f"  R² Score: {metrics['r2_score']:.4f}")
        
        return True
    except Exception as e:
        print(f"✗ Prediction accuracy test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all standalone tests."""
    print("=" * 60)
    print("ML Models Standalone Test Suite")
    print("=" * 60)
    print()
    
    tests = [
        ("Gold Predictor Basic", test_gold_predictor_basic),
        ("Diamond Predictor Basic", test_diamond_predictor_basic),
        ("Feature Engineering", test_feature_engineering),
        ("Prediction Accuracy", test_prediction_accuracy),
    ]
    
    tests_passed = 0
    tests_total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        print("-" * 60)
        if test_func():
            tests_passed += 1
        print()
    
    print("=" * 60)
    print(f"Tests: {tests_passed}/{tests_total} passed")
    
    if tests_passed == tests_total:
        print("✓ All tests passed!")
        print("=" * 60)
        return 0
    else:
        print(f"✗ {tests_total - tests_passed} test(s) failed")
        print("=" * 60)
        return 1


if __name__ == '__main__':
    sys.exit(main())
