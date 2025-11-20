"""Script to verify seeded price data in MongoDB."""
import sys
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from mongoengine import connect
from app.models.price_history import PriceHistory, DiamondPriceHistory
from app.config import config


def verify_gold_prices():
    """
    Verify gold price data in MongoDB.
    
    Returns:
        dict: Verification results
    """
    print("Verifying Gold Price Data")
    print("-" * 60)
    
    # Query all gold price records
    all_gold = PriceHistory.objects(metal_type='gold')
    seeded_gold = PriceHistory.objects(metal_type='gold', source='seeded')
    
    if all_gold.count() == 0:
        print("✗ No gold price records found in database")
        return {
            'success': False,
            'total_records': 0,
            'seeded_records': 0
        }
    
    # Get date range
    earliest = all_gold.order_by('date').first()
    latest = all_gold.order_by('-date').first()
    
    # Get price range
    prices = [p.price_per_gram for p in all_gold]
    min_price = min(prices)
    max_price = max(prices)
    avg_price = sum(prices) / len(prices)
    
    # Calculate date coverage
    date_range_days = (latest.date - earliest.date).days + 1
    
    print(f"✓ Total gold price records: {all_gold.count()}")
    print(f"✓ Seeded records: {seeded_gold.count()}")
    print()
    print("Date Coverage:")
    print(f"  Earliest: {earliest.date.date()}")
    print(f"  Latest: {latest.date.date()}")
    print(f"  Range: {date_range_days} days")
    print()
    print("Price Statistics:")
    print(f"  Minimum: ₹{min_price:.2f}/gram")
    print(f"  Maximum: ₹{max_price:.2f}/gram")
    print(f"  Average: ₹{avg_price:.2f}/gram")
    print()
    
    # Check for data gaps
    current_date = earliest.date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = latest.date.replace(hour=0, minute=0, second=0, microsecond=0)
    gaps = []
    
    while current_date <= end_date:
        record = PriceHistory.objects(
            metal_type='gold',
            date__gte=current_date,
            date__lt=current_date + timedelta(days=1)
        ).first()
        
        if not record:
            gaps.append(current_date.date())
        
        current_date += timedelta(days=1)
    
    if gaps:
        print(f"⚠ Found {len(gaps)} date gaps in data")
        if len(gaps) <= 10:
            print(f"  Missing dates: {', '.join(str(d) for d in gaps)}")
    else:
        print("✓ No date gaps found - continuous data coverage")
    
    print()
    
    return {
        'success': True,
        'total_records': all_gold.count(),
        'seeded_records': seeded_gold.count(),
        'date_range_days': date_range_days,
        'price_range': (min_price, max_price),
        'gaps': len(gaps)
    }


def verify_diamond_prices():
    """
    Verify diamond price data in MongoDB.
    
    Returns:
        dict: Verification results
    """
    print("Verifying Diamond Price Data")
    print("-" * 60)
    
    # Query all diamond price records
    all_diamonds = DiamondPriceHistory.objects()
    seeded_diamonds = DiamondPriceHistory.objects(source='seeded')
    
    if all_diamonds.count() == 0:
        print("✗ No diamond price records found in database")
        return {
            'success': False,
            'total_records': 0,
            'seeded_records': 0
        }
    
    # Get statistics
    prices = [d.price for d in all_diamonds]
    carats = [d.carat for d in all_diamonds]
    
    min_price = min(prices)
    max_price = max(prices)
    avg_price = sum(prices) / len(prices)
    
    min_carat = min(carats)
    max_carat = max(carats)
    avg_carat = sum(carats) / len(carats)
    
    # Count unique grades
    cuts = set(d.cut for d in all_diamonds)
    colors = set(d.color for d in all_diamonds)
    clarities = set(d.clarity for d in all_diamonds)
    
    # Get date range
    earliest = all_diamonds.order_by('date').first()
    latest = all_diamonds.order_by('-date').first()
    date_range_days = (latest.date - earliest.date).days + 1
    
    print(f"✓ Total diamond price records: {all_diamonds.count()}")
    print(f"✓ Seeded records: {seeded_diamonds.count()}")
    print()
    print("Date Coverage:")
    print(f"  Earliest: {earliest.date.date()}")
    print(f"  Latest: {latest.date.date()}")
    print(f"  Range: {date_range_days} days")
    print()
    print("Carat Statistics:")
    print(f"  Minimum: {min_carat:.2f} carats")
    print(f"  Maximum: {max_carat:.2f} carats")
    print(f"  Average: {avg_carat:.2f} carats")
    print()
    print("Price Statistics:")
    print(f"  Minimum: ₹{min_price:,.2f}")
    print(f"  Maximum: ₹{max_price:,.2f}")
    print(f"  Average: ₹{avg_price:,.2f}")
    print()
    print("Grade Diversity:")
    print(f"  Cut grades: {len(cuts)} types - {', '.join(sorted(cuts))}")
    print(f"  Color grades: {len(colors)} types - {', '.join(sorted(colors))}")
    print(f"  Clarity grades: {len(clarities)} types - {', '.join(sorted(clarities))}")
    print()
    
    # Check for sufficient diversity
    warnings = []
    if len(cuts) < 3:
        warnings.append("Limited cut grade diversity")
    if len(colors) < 4:
        warnings.append("Limited color grade diversity")
    if len(clarities) < 4:
        warnings.append("Limited clarity grade diversity")
    
    if warnings:
        print("⚠ Warnings:")
        for warning in warnings:
            print(f"  - {warning}")
        print()
    else:
        print("✓ Good grade diversity for model training")
        print()
    
    return {
        'success': True,
        'total_records': all_diamonds.count(),
        'seeded_records': seeded_diamonds.count(),
        'date_range_days': date_range_days,
        'carat_range': (min_carat, max_carat),
        'price_range': (min_price, max_price),
        'grade_diversity': {
            'cuts': len(cuts),
            'colors': len(colors),
            'clarities': len(clarities)
        }
    }


def main():
    """Main function to verify seeded data."""
    print("=" * 60)
    print("Price Data Verification Script")
    print("=" * 60)
    print()
    
    # Connect to MongoDB
    try:
        mongodb_uri = os.environ.get('MONGODB_URI') or config['development'].MONGODB_URI
        print(f"Connecting to MongoDB...")
        connect(host=mongodb_uri, alias='default')
        print("✓ Connected to MongoDB successfully")
        print()
        print()
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {str(e)}")
        sys.exit(1)
    
    # Verify gold prices
    try:
        gold_results = verify_gold_prices()
    except Exception as e:
        print(f"✗ Error verifying gold prices: {str(e)}")
        import traceback
        traceback.print_exc()
        gold_results = {'success': False}
    
    print()
    
    # Verify diamond prices
    try:
        diamond_results = verify_diamond_prices()
    except Exception as e:
        print(f"✗ Error verifying diamond prices: {str(e)}")
        import traceback
        traceback.print_exc()
        diamond_results = {'success': False}
    
    # Summary
    print("=" * 60)
    print("Verification Summary")
    print("=" * 60)
    
    if gold_results['success'] and diamond_results['success']:
        print("✓ All data verification checks passed!")
        print()
        print("Ready for model training:")
        print(f"  Gold price records: {gold_results['total_records']}")
        print(f"  Diamond price records: {diamond_results['total_records']}")
        print()
        print("Next steps:")
        print("  1. Run: python scripts/train_models.py all")
        print("  2. Restart the backend server to load trained models")
        print("  3. Test prediction endpoints")
    else:
        print("✗ Some verification checks failed")
        print()
        if not gold_results['success']:
            print("  - Gold price data needs to be seeded")
            print("    Run: python scripts/seed_gold_prices.py")
        if not diamond_results['success']:
            print("  - Diamond price data needs to be seeded")
            print("    Run: python scripts/seed_diamond_prices.py")
    
    print()


if __name__ == '__main__':
    main()
