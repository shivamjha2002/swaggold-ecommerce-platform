"""Direct tests for ML models without Flask app initialization."""
import sys
import os
import numpy as np
import pandas as pd
from datetime import datetime

# Add app/ml directory to path to import modules directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app', 'ml'))


def test_gold_predictor():
    """Test gold predictor directly."""
    try:
        from gold_predictor import GoldPricePredictor
        
        print("Testing Gold Price Predictor...")
        print("-" * 60)
        
        # Create sample data
        dates = pd.date_range(start='2024-01-01', periods=60, freq='D')
        base_price = 6500
        trend = np.linspace(0, 500, 60)
        noise = np.random.normal(0, 50, 60)
        prices = base_price + trend + noise
        df = pd.DataFrame({'date': dates, 'price_per_gram': prices})
        
        print(f"✓ Created training data: {len(df)} records")
        print(f"  Price range: ₹{df['price_per_gram'].min():.2f} - ₹{df['price_per_gram'].max():.2f}")
        
        # Initialize predictor
        predictor = GoldPricePredictor()
        print(f"✓ Initialized predictor")
        print(f"  Features: {len(predictor.feature_cols)}")
        
        # Test feature engineering
        df_features = predictor.prepare_features(df)
        print(f"✓ Feature engineering successful")
        print(f"  Features created: {', '.join(predictor.feature_cols)}")
        
        # Train model
        metrics = predictor.train(df)
        print(f"✓ Model training successful")
        print(f"  R² Score: {metrics['r2_score']:.4f}")
        print(f"  RMSE: ₹{metrics['rmse']:.2f}")
        print(f"  MAE: ₹{metrics['mae']:.2f}")
        
        # Make prediction
        future_date = datetime(2024, 3, 15)
        result = predictor.predict(future_date)
        print(f"✓ Prediction successful")
        print(f"  Date: {result['target_date']}")
        print(f"  Predicted price: ₹{result['predicted_price']:.2f}/gram")
        print(f"  Confidence interval: ₹{result['confidence_interval']['lower']:.2f} - ₹{result['confidence_interval']['upper']:.2f}")
        
        # Test prediction with weight
        weight = 10.5
        result_weight = predictor.predict_with_weight(future_date, weight)
        print(f"✓ Prediction with weight successful")
        print(f"  Weight: {weight}g")
        print(f"  Total price: ₹{result_weight['total_price']:.2f}")
        
        print()
        print("=" * 60)
        print("✓ ALL GOLD PREDICTOR TESTS PASSED")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n✗ Gold predictor test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_diamond_predictor():
    """Test diamond predictor directly."""
    try:
        from diamond_predictor import DiamondPricePredictor
        
        print("\nTesting Diamond Price Predictor...")
        print("-" * 60)
        
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
        
        print(f"✓ Created training data: {len(df)} records")
        print(f"  Carat range: {df['carat'].min():.2f} - {df['carat'].max():.2f}")
        print(f"  Price range: ₹{df['price'].min():.2f} - ₹{df['price'].max():.2f}")
        
        # Initialize predictor
        predictor = DiamondPricePredictor()
        print(f"✓ Initialized predictor")
        print(f"  Features: {len(predictor.feature_cols)}")
        print(f"  Valid cuts: {len(predictor.valid_cuts)}")
        print(f"  Valid colors: {len(predictor.valid_colors)}")
        print(f"  Valid clarities: {len(predictor.valid_clarities)}")
        
        # Train model
        metrics = predictor.train(df)
        print(f"✓ Model training successful")
        print(f"  R² Score: {metrics['r2_score']:.4f}")
        print(f"  RMSE: ₹{metrics['rmse']:.2f}")
        print(f"  MAE: ₹{metrics['mae']:.2f}")
        print(f"  MAPE: {metrics['mape']:.2f}%")
        
        # Make prediction
        result = predictor.predict(1.5, 'Ideal', 'E', 'VS1')
        print(f"✓ Prediction successful")
        print(f"  Diamond: 1.5 carat, Ideal cut, E color, VS1 clarity")
        print(f"  Predicted price: ₹{result['predicted_price']:.2f}")
        print(f"  Confidence interval: ₹{result['confidence_interval']['lower']:.2f} - ₹{result['confidence_interval']['upper']:.2f}")
        
        # Get feature importance
        importance = predictor.get_feature_importance()
        print(f"✓ Feature importance calculated")
        print(f"  Carat: {importance['carat']:.3f}")
        print(f"  Cut: {importance['cut']:.3f}")
        print(f"  Color: {importance['color']:.3f}")
        print(f"  Clarity: {importance['clarity']:.3f}")
        
        print()
        print("=" * 60)
        print("✓ ALL DIAMOND PREDICTOR TESTS PASSED")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n✗ Diamond predictor test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("ML Models Direct Test Suite")
    print("=" * 60)
    print()
    
    results = []
    results.append(test_gold_predictor())
    results.append(test_diamond_predictor())
    
    print()
    print("=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    
    if all(results):
        print("✓ ALL TESTS PASSED!")
        return 0
    else:
        print(f"✗ {len([r for r in results if not r])} test(s) failed")
        return 1


if __name__ == '__main__':
    sys.exit(main())
