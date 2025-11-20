"""Quick script to check if data exists in database."""
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.models.price_history import PriceHistory, DiamondPriceHistory

def main():
    app = create_app('development')
    
    with app.app_context():
        print("=" * 60)
        print("Database Data Check")
        print("=" * 60)
        
        # Check gold prices
        gold_count = PriceHistory.objects(metal_type='gold', purity='916').count()
        print(f"\nGold price records: {gold_count}")
        
        if gold_count > 0:
            latest = PriceHistory.objects(metal_type='gold', purity='916').order_by('-date').first()
            print(f"Latest gold price: ₹{latest.price_per_gram}/gram on {latest.date}")
        else:
            print("⚠️  No gold price data found! Run: python scripts/seed_data.py")
        
        # Check diamond prices
        diamond_count = DiamondPriceHistory.objects().count()
        print(f"\nDiamond price records: {diamond_count}")
        
        if diamond_count == 0:
            print("⚠️  No diamond price data found! Run: python scripts/seed_data.py")
        
        # Check if models exist
        print("\n" + "=" * 60)
        print("Model Files Check")
        print("=" * 60)
        
        import os.path
        gold_model = os.path.exists('models/gold_model.pkl')
        diamond_model = os.path.exists('models/diamond_model.pkl')
        
        print(f"\nGold model exists: {'✓ Yes' if gold_model else '✗ No'}")
        print(f"Diamond model exists: {'✓ Yes' if diamond_model else '✗ No'}")
        
        if not gold_model or not diamond_model:
            print("\n⚠️  Models not trained! Run: python scripts/train_models.py all")
        
        print("\n" + "=" * 60)
        
        # Summary
        if gold_count >= 30 and diamond_count >= 50:
            if gold_model and diamond_model:
                print("✓ Everything is ready!")
            else:
                print("Next step: Train models with 'python scripts/train_models.py all'")
        else:
            print("Next step: Seed data with 'python scripts/seed_data.py'")
        
        print("=" * 60)

if __name__ == '__main__':
    main()
