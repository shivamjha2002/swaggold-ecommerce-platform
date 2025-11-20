"""Script to train ML models from command line."""
import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.ml.train import train_gold_model, train_diamond_model, train_all_models


def main():
    """Main function to train models."""
    # Create Flask app context
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("ML Model Training Script")
        print("=" * 60)
        print()
        
        if len(sys.argv) > 1:
            model_type = sys.argv[1].lower()
            
            if model_type == 'gold':
                print("Training Gold Price Prediction Model")
                print("-" * 60)
                result = train_gold_model()
                print()
                print("✓ Gold model training completed successfully!")
                print(f"  R² Score: {result['metrics']['r2_score']:.4f}")
                print(f"  Data Points: {result['data_points']}")
                
            elif model_type == 'diamond':
                print("Training Diamond Price Prediction Model")
                print("-" * 60)
                result = train_diamond_model()
                print()
                print("✓ Diamond model training completed successfully!")
                print(f"  R² Score: {result['metrics']['r2_score']:.4f}")
                print(f"  Data Points: {result['data_points']}")
                
            elif model_type == 'all':
                print("Training All Models")
                print("-" * 60)
                results = train_all_models()
                print()
                
                if results['gold_model']:
                    print("✓ Gold model trained successfully")
                else:
                    print("✗ Gold model training failed")
                
                if results['diamond_model']:
                    print("✓ Diamond model trained successfully")
                else:
                    print("✗ Diamond model training failed")
                
                if results['errors']:
                    print()
                    print(f"Errors encountered: {len(results['errors'])}")
                    for error in results['errors']:
                        print(f"  - {error}")
            else:
                print(f"Unknown model type: {model_type}")
                print()
                print("Usage: python scripts/train_models.py [gold|diamond|all]")
                print()
                print("Examples:")
                print("  python scripts/train_models.py gold     # Train gold model only")
                print("  python scripts/train_models.py diamond  # Train diamond model only")
                print("  python scripts/train_models.py all      # Train all models")
                sys.exit(1)
        else:
            # Train all models by default
            print("Training All Models (default)")
            print("-" * 60)
            results = train_all_models()
            print()
            
            if results['gold_model']:
                print("✓ Gold model trained successfully")
            else:
                print("✗ Gold model training failed")
            
            if results['diamond_model']:
                print("✓ Diamond model trained successfully")
            else:
                print("✗ Diamond model training failed")
            
            if results['errors']:
                print()
                print(f"Errors encountered: {len(results['errors'])}")
                for error in results['errors']:
                    print(f"  - {error}")
        
        print()
        print("=" * 60)


if __name__ == '__main__':
    main()
