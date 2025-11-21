"""Verification script to check if model training implementation is complete."""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

def verify_implementation():
    """Verify that all training components are in place."""
    print("=" * 70)
    print("Model Training Implementation Verification")
    print("=" * 70)
    print()
    
    checks = []
    
    # Check 1: Training module exists
    try:
        from app.ml.train import train_gold_model, train_diamond_model, train_all_models
        checks.append(("✓", "Training module (app.ml.train) exists"))
    except ImportError as e:
        checks.append(("✗", f"Training module import failed: {e}"))
    
    # Check 2: Training script exists
    script_path = os.path.join(os.path.dirname(__file__), 'scripts', 'train_models.py')
    if os.path.exists(script_path):
        checks.append(("✓", "Training script (scripts/train_models.py) exists"))
    else:
        checks.append(("✗", "Training script not found"))
    
    # Check 3: Models directory exists
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    if os.path.exists(models_dir):
        checks.append(("✓", "Models directory exists"))
        
        # Check for existing model files
        gold_model = os.path.join(models_dir, 'gold_model.pkl')
        diamond_model = os.path.join(models_dir, 'diamond_model.pkl')
        
        if os.path.exists(gold_model):
            checks.append(("✓", "Gold model file exists"))
        else:
            checks.append(("ℹ", "Gold model file not found (needs training)"))
        
        if os.path.exists(diamond_model):
            checks.append(("✓", "Diamond model file exists"))
        else:
            checks.append(("ℹ", "Diamond model file not found (needs training)"))
    else:
        checks.append(("✗", "Models directory not found"))
    
    # Check 4: ML Service has reload functionality
    try:
        from app.services.ml_service import MLService
        ml_service = MLService()
        
        if hasattr(ml_service, 'reload_models'):
            checks.append(("✓", "ML Service has reload_models() method"))
        else:
            checks.append(("✗", "ML Service missing reload_models() method"))
        
        if hasattr(ml_service, 'load_models'):
            checks.append(("✓", "ML Service has load_models() method"))
        else:
            checks.append(("✗", "ML Service missing load_models() method"))
    except Exception as e:
        checks.append(("✗", f"ML Service check failed: {e}"))
    
    # Check 5: Predictor classes exist
    try:
        from app.ml.gold_predictor import GoldPricePredictor
        from app.ml.diamond_predictor import DiamondPricePredictor
        checks.append(("✓", "Gold and Diamond predictor classes exist"))
    except ImportError as e:
        checks.append(("✗", f"Predictor classes import failed: {e}"))
    
    # Check 6: Database models exist
    try:
        from app.models.price_history import PriceHistory, DiamondPriceHistory, TrainingLog
        checks.append(("✓", "Database models (PriceHistory, DiamondPriceHistory, TrainingLog) exist"))
    except ImportError as e:
        checks.append(("✗", f"Database models import failed: {e}"))
    
    # Print results
    for status, message in checks:
        print(f"{status} {message}")
    
    print()
    print("=" * 70)
    
    # Summary
    passed = sum(1 for s, _ in checks if s == "✓")
    failed = sum(1 for s, _ in checks if s == "✗")
    info = sum(1 for s, _ in checks if s == "ℹ")
    
    print(f"Summary: {passed} passed, {failed} failed, {info} info")
    
    if failed == 0:
        print()
        print("✓ All required components are in place!")
        print()
        print("Next steps:")
        print("1. Ensure MongoDB is running")
        print("2. Seed historical data using scripts/seed_gold_prices.py and scripts/seed_diamond_prices.py")
        print("3. Train models using: python scripts/train_models.py all")
        return True
    else:
        print()
        print("✗ Some components are missing. Please review the failures above.")
        return False


if __name__ == '__main__':
    success = verify_implementation()
    sys.exit(0 if success else 1)
