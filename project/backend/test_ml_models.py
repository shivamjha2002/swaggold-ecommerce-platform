"""Tests for ML models - gold and diamond price predictors."""
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta


def test_ml_imports():
    """Test that ML models can be imported."""
    try:
        from app.ml import GoldPricePredictor, DiamondPricePredictor
        from app.ml.train import train_gold_model, train_diamond_model
        from app.services.ml_service import MLService
        print("✓ All ML modules imported successfully")
        return True
    except ImportError as e:
        print(f"✗ Import error: {str(e)}")
        return False


def test_gold_predictor_initialization():
    """Test gold predictor initialization."""
    try:
        from app.ml import GoldPricePredictor
        
        predictor = GoldPricePredictor()
        assert predictor.model is not None
        assert predictor.scaler is not None
        assert predictor.is_trained == False
        assert len(predictor.feature_cols) == 9
        
        print("✓ Gold predictor initialized correctly")
        return True
    except Exception as e:
        print(f"✗ Gold predictor initialization failed: {str(e)}")
        return False


def test_diamond_predictor_initialization():
    """Test diamond predictor initialization."""
    try:
        from app.ml import DiamondPricePredictor
        
        predictor = DiamondPricePredictor()
        assert predictor.model is not None
        assert predictor.encoders is not None
        assert predictor.is_trained == False
        assert len(predictor.feature_cols) == 4
        assert len(predictor.valid_cuts) == 6
        assert len(predictor.valid_colors) == 10
        assert len(predictor.valid_clarities) == 11
        
        print("✓ Diamond predictor initialized correctly")
        return True
    except Exception as e:
        print(f"✗ Diamond predictor initialization failed: {str(e)}")
        return False


def test_gold_feature_engineering():
    """Test gold price feature engineering."""
    try:
        from app.ml import GoldPricePredictor
        
        # Create sample data
        dates = pd.date_range(start='2024-01-01', periods=60, freq='D')
        prices = np.random.uniform(6000, 7000, 60)
        df = pd.DataFrame({'date': dates, 'price_per_gram': prices})
        
        predictor = GoldPricePredictor()
        df_features = predictor.prepare_features(df)
        
        # Check all features are created
        assert 'day_of_week' in df_features.columns
        assert 'month' in df_features.columns
        assert 'day_of_month' in df_features.columns
        assert 'ma_7' in df_features.columns
        assert 'ma_30' in df_features.columns
        assert 'price_change' in df_features.columns
        assert 'price_change_pct' in df_features.columns
        assert 'price_lag_1' in df_features.columns
        assert 'price_lag_7' in df_features.columns
        
        # Check feature values are reasonable
        assert df_features['day_of_week'].min() >= 0
        assert df_features['day_of_week'].max() <= 6
        assert df_features['month'].min() >= 1
        assert df_features['month'].max() <= 12
        
        print("✓ Gold feature engineering works correctly")
        return True
    except Exception as e:
        print(f"✗ Gold feature engineering failed: {str(e)}")
        return False


def test_gold_model_training():
    """Test gold model training with sample data."""
    try:
        from app.ml import GoldPricePredictor
        
        # Create sample training data (60 days)
        dates = pd.date_range(start='2024-01-01', periods=60, freq='D')
        # Create realistic price trend with some noise
        base_price = 6500
        trend = np.linspace(0, 500, 60)
        noise = np.random.normal(0, 50, 60)
        prices = base_price + trend + noise
        
        df = pd.DataFrame({'date': dates, 'price_per_gram': prices})
        
        predictor = GoldPricePredictor()
        metrics = predictor.train(df)
        
        # Check training completed
        assert predictor.is_trained == True
        assert 'r2_score' in metrics
        assert 'rmse' in metrics
        assert 'mae' in metrics
        assert metrics['data_points'] == 60
        
        # R2 score should be reasonable (at least 0.5 for this simple data)
        assert metrics['r2_score'] >= 0.5
        
        print(f"✓ Gold model training successful (R² = {metrics['r2_score']:.4f})")
        return True
    except Exception as e:
        print(f"✗ Gold model training failed: {str(e)}")
        return False


def test_gold_model_prediction():
    """Test gold model prediction."""
    try:
        from app.ml import GoldPricePredictor
        
        # Create and train model
        dates = pd.date_range(start='2024-01-01', periods=60, freq='D')
        base_price = 6500
        trend = np.linspace(0, 500, 60)
        noise = np.random.normal(0, 50, 60)
        prices = base_price + trend + noise
        df = pd.DataFrame({'date': dates, 'price_per_gram': prices})
        
        predictor = GoldPricePredictor()
        predictor.train(df)
        
        # Make prediction for future date
        future_date = datetime(2024, 3, 15)
        result = predictor.predict(future_date)
        
        # Check prediction structure
        assert 'predicted_price' in result
        assert 'confidence_interval' in result
        assert 'lower' in result['confidence_interval']
        assert 'upper' in result['confidence_interval']
        assert 'target_date' in result
        
        # Check prediction is reasonable
        assert result['predicted_price'] > 0
        assert result['confidence_interval']['lower'] < result['predicted_price']
        assert result['confidence_interval']['upper'] > result['predicted_price']
        
        print(f"✓ Gold prediction successful (₹{result['predicted_price']:.2f}/gram)")
        return True
    except Exception as e:
        print(f"✗ Gold prediction failed: {str(e)}")
        return False


def test_gold_prediction_with_weight():
    """Test gold prediction with weight calculation."""
    try:
        from app.ml import GoldPricePredictor
        
        # Create and train model
        dates = pd.date_range(start='2024-01-01', periods=60, freq='D')
        prices = np.random.uniform(6000, 7000, 60)
        df = pd.DataFrame({'date': dates, 'price_per_gram': prices})
        
        predictor = GoldPricePredictor()
        predictor.train(df)
        
        # Make prediction with weight
        future_date = datetime(2024, 3, 15)
        weight = 10.5
        result = predictor.predict_with_weight(future_date, weight)
        
        # Check result structure
        assert 'predicted_price_per_gram' in result
        assert 'weight_grams' in result
        assert 'total_price' in result
        assert result['weight_grams'] == weight
        
        # Check calculation
        expected_total = result['predicted_price_per_gram'] * weight
        assert abs(result['total_price'] - expected_total) < 0.01
        
        print(f"✓ Gold prediction with weight successful (₹{result['total_price']:.2f} for {weight}g)")
        return True
    except Exception as e:
        print(f"✗ Gold prediction with weight failed: {str(e)}")
        return False


def test_diamond_model_training():
    """Test diamond model training with sample data."""
    try:
        from app.ml import DiamondPricePredictor
        
        # Create sample diamond data (100 records)
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
        
        # Generate realistic prices based on features
        # Price increases with carat, better cut, better color, better clarity
        base_price = 100000
        df['price'] = (
            base_price * df['carat'] * 2 +
            np.random.uniform(50000, 150000, n_samples)
        )
        
        predictor = DiamondPricePredictor()
        metrics = predictor.train(df)
        
        # Check training completed
        assert predictor.is_trained == True
        assert 'r2_score' in metrics
        assert 'rmse' in metrics
        assert 'mae' in metrics
        assert 'mape' in metrics
        assert metrics['data_points'] == n_samples
        
        print(f"✓ Diamond model training successful (R² = {metrics['r2_score']:.4f})")
        return True
    except Exception as e:
        print(f"✗ Diamond model training failed: {str(e)}")
        return False


def test_diamond_model_prediction():
    """Test diamond model prediction."""
    try:
        from app.ml import DiamondPricePredictor
        
        # Create and train model
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
        
        predictor = DiamondPricePredictor()
        predictor.train(df)
        
        # Make prediction
        result = predictor.predict(1.5, 'Ideal', 'E', 'VS1')
        
        # Check prediction structure
        assert 'predicted_price' in result
        assert 'confidence_interval' in result
        assert 'features_used' in result
        assert result['features_used']['carat'] == 1.5
        assert result['features_used']['cut'] == 'Ideal'
        
        # Check prediction is reasonable
        assert result['predicted_price'] > 0
        assert result['confidence_interval']['lower'] >= 0
        assert result['confidence_interval']['upper'] > result['predicted_price']
        
        print(f"✓ Diamond prediction successful (₹{result['predicted_price']:.2f})")
        return True
    except Exception as e:
        print(f"✗ Diamond prediction failed: {str(e)}")
        return False


def test_diamond_feature_importance():
    """Test diamond model feature importance."""
    try:
        from app.ml import DiamondPricePredictor
        
        # Create and train model
        np.random.seed(42)
        n_samples = 100
        
        cuts = ['Ideal', 'Excellent', 'Very Good']
        colors = ['D', 'E', 'F', 'G']
        clarities = ['IF', 'VVS1', 'VS1', 'VS2']
        
        df = pd.DataFrame({
            'carat': np.random.uniform(0.5, 3.0, n_samples),
            'cut': np.random.choice(cuts, n_samples),
            'color': np.random.choice(colors, n_samples),
            'clarity': np.random.choice(clarities, n_samples),
        })
        df['price'] = 100000 * df['carat'] * 2 + np.random.uniform(50000, 150000, n_samples)
        
        predictor = DiamondPricePredictor()
        predictor.train(df)
        
        # Get feature importance
        importance = predictor.get_feature_importance()
        
        # Check structure
        assert 'carat' in importance
        assert 'cut' in importance
        assert 'color' in importance
        assert 'clarity' in importance
        
        # Check values sum to approximately 1
        total = sum(importance.values())
        assert abs(total - 1.0) < 0.01
        
        print(f"✓ Feature importance calculated (carat: {importance['carat']:.3f})")
        return True
    except Exception as e:
        print(f"✗ Feature importance test failed: {str(e)}")
        return False


def test_ml_service_initialization():
    """Test ML service initialization."""
    try:
        from app.services.ml_service import MLService
        
        service = MLService()
        assert service.models_dir is not None
        assert hasattr(service, 'gold_model')
        assert hasattr(service, 'diamond_model')
        assert hasattr(service, 'load_models')
        assert hasattr(service, 'predict_gold_price')
        assert hasattr(service, 'predict_diamond_price')
        
        print("✓ ML service initialized correctly")
        return True
    except Exception as e:
        print(f"✗ ML service initialization failed: {str(e)}")
        return False


def test_error_handling():
    """Test error handling for untrained models."""
    try:
        from app.ml import GoldPricePredictor, DiamondPricePredictor
        
        # Test gold predictor
        gold_predictor = GoldPricePredictor()
        try:
            gold_predictor.predict(datetime.now())
            print("✗ Gold predictor should raise error when untrained")
            return False
        except ValueError as e:
            assert "not trained" in str(e).lower()
        
        # Test diamond predictor
        diamond_predictor = DiamondPricePredictor()
        try:
            diamond_predictor.predict(1.0, 'Ideal', 'D', 'IF')
            print("✗ Diamond predictor should raise error when untrained")
            return False
        except ValueError as e:
            assert "not trained" in str(e).lower()
        
        print("✓ Error handling works correctly")
        return True
    except Exception as e:
        print(f"✗ Error handling test failed: {str(e)}")
        return False


def main():
    """Run all ML model tests."""
    print("=" * 60)
    print("ML Models Test Suite")
    print("=" * 60)
    print()
    
    tests = [
        ("Import Test", test_ml_imports),
        ("Gold Predictor Init", test_gold_predictor_initialization),
        ("Diamond Predictor Init", test_diamond_predictor_initialization),
        ("Gold Feature Engineering", test_gold_feature_engineering),
        ("Gold Model Training", test_gold_model_training),
        ("Gold Model Prediction", test_gold_model_prediction),
        ("Gold Prediction with Weight", test_gold_prediction_with_weight),
        ("Diamond Model Training", test_diamond_model_training),
        ("Diamond Model Prediction", test_diamond_model_prediction),
        ("Diamond Feature Importance", test_diamond_feature_importance),
        ("ML Service Init", test_ml_service_initialization),
        ("Error Handling", test_error_handling),
    ]
    
    tests_passed = 0
    tests_total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
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
