"""Script to seed gold price historical data."""
import sys
import os
import argparse
from datetime import datetime, timedelta
import random
import math
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from mongoengine import connect
from app.models.price_history import PriceHistory
from app.config import config


def generate_gold_prices(start_date, end_date, base_price=5500.0, volatility=0.02):
    """
    Generate realistic gold price data with trends and volatility.
    
    Uses a random walk algorithm with:
    - Daily volatility (random price changes)
    - Seasonal patterns (monthly cycles)
    - Long-term trend (slight upward bias)
    
    Args:
        start_date: Start date for price data
        end_date: End date for price data
        base_price: Starting price per gram (default: ₹5500)
        volatility: Daily price volatility as percentage (default: 0.02 = 2%)
    
    Returns:
        List of price records with date and price_per_gram
    """
    prices = []
    current_date = start_date
    current_price = base_price
    
    # Calculate total days for trend calculation
    total_days = (end_date - start_date).days
    
    while current_date <= end_date:
        # Random walk component (daily volatility)
        daily_change = random.gauss(0, volatility)
        
        # Seasonal pattern (monthly cycle)
        day_of_year = current_date.timetuple().tm_yday
        seasonal_factor = 0.01 * math.sin(2 * math.pi * day_of_year / 365)
        
        # Long-term trend (slight upward bias)
        days_elapsed = (current_date - start_date).days
        trend_factor = 0.0001 * (days_elapsed / total_days)
        
        # Combine all factors
        total_change = daily_change + seasonal_factor + trend_factor
        current_price = current_price * (1 + total_change)
        
        # Ensure price doesn't go below a reasonable minimum
        current_price = max(current_price, base_price * 0.7)
        
        # Create price record
        price_record = {
            'metal_type': 'gold',
            'purity': '916',  # 22 karat gold
            'price_per_gram': round(current_price, 2),
            'currency': 'INR',
            'date': current_date,
            'source': 'seeded'
        }
        
        prices.append(price_record)
        current_date += timedelta(days=1)
    
    return prices


def seed_gold_prices(days=90, base_price=5500.0, volatility=0.02, clear_existing=False):
    """
    Seed database with gold price data.
    
    Args:
        days: Number of days of historical data to generate
        base_price: Starting price per gram (default: ₹5500)
        volatility: Daily price volatility (default: 0.02 = 2%)
        clear_existing: Whether to clear existing seeded data (default: False)
    
    Returns:
        Number of records inserted
    """
    print(f"Generating {days} days of gold price data...")
    print(f"Base price: ₹{base_price}/gram")
    print(f"Volatility: {volatility * 100}%")
    print()
    
    # Calculate date range
    end_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=days - 1)
    
    print(f"Date range: {start_date.date()} to {end_date.date()}")
    print()
    
    # Clear existing seeded data if requested
    if clear_existing:
        print("Clearing existing seeded gold price data...")
        deleted_count = PriceHistory.objects(
            metal_type='gold',
            source='seeded'
        ).delete()
        print(f"Deleted {deleted_count} existing records")
        print()
    
    # Generate price data
    prices = generate_gold_prices(start_date, end_date, base_price, volatility)
    
    # Insert into database
    print("Inserting price data into MongoDB...")
    inserted_count = 0
    updated_count = 0
    error_count = 0
    
    for i, price_data in enumerate(prices, 1):
        try:
            # Check if record already exists for this date
            existing = PriceHistory.objects(
                metal_type=price_data['metal_type'],
                purity=price_data['purity'],
                date=price_data['date']
            ).first()
            
            if existing:
                # Update existing record (handle duplicates gracefully)
                existing.price_per_gram = price_data['price_per_gram']
                existing.source = price_data['source']
                existing.save()
                updated_count += 1
            else:
                # Create new record
                price_history = PriceHistory(**price_data)
                price_history.save()
                inserted_count += 1
            
            # Progress indicator
            if i % 10 == 0 or i == len(prices):
                print(f"  Progress: {i}/{len(prices)} records processed", end='\r')
                
        except Exception as e:
            error_count += 1
            print(f"\n  ✗ Error inserting record for {price_data['date'].date()}: {str(e)}")
            continue
    
    print()  # New line after progress indicator
    
    print()
    print("=" * 60)
    print("Gold Price Data Seeding Complete!")
    print("=" * 60)
    print(f"✓ New records inserted: {inserted_count}")
    print(f"✓ Existing records updated: {updated_count}")
    print(f"✓ Total records processed: {len(prices)}")
    
    if error_count > 0:
        print(f"⚠ Errors encountered: {error_count}")
    
    print(f"✓ Price range: ₹{min(p['price_per_gram'] for p in prices):.2f} - ₹{max(p['price_per_gram'] for p in prices):.2f}")
    print()
    
    # Verify data was inserted correctly
    print("Verifying inserted data...")
    verification_count = PriceHistory.objects(
        metal_type='gold',
        purity='916',
        date__gte=start_date,
        date__lte=end_date
    ).count()
    
    if verification_count >= len(prices) - error_count:
        print(f"✓ Verification successful: {verification_count} records found in database")
    else:
        print(f"⚠ Verification warning: Expected {len(prices) - error_count} records, found {verification_count}")
    
    print()
    
    return inserted_count + updated_count


def main():
    """Main function to run the seeding script."""
    parser = argparse.ArgumentParser(
        description='Seed gold price historical data into MongoDB',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python seed_gold_prices.py                           # Seed 90 days with defaults
  python seed_gold_prices.py --days 180                # Seed 180 days
  python seed_gold_prices.py --base-price 6000         # Start at ₹6000/gram
  python seed_gold_prices.py --volatility 0.03         # 3% daily volatility
  python seed_gold_prices.py --clear                   # Clear existing seeded data
        """
    )
    
    parser.add_argument(
        '--days',
        type=int,
        default=90,
        help='Number of days of historical data to generate (default: 90)'
    )
    
    parser.add_argument(
        '--base-price',
        type=float,
        default=5500.0,
        help='Starting price per gram in INR (default: 5500.0)'
    )
    
    parser.add_argument(
        '--volatility',
        type=float,
        default=0.02,
        help='Daily price volatility as decimal (default: 0.02 = 2%%)'
    )
    
    parser.add_argument(
        '--clear',
        action='store_true',
        help='Clear existing seeded data before inserting new data'
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.days < 1:
        print("Error: --days must be at least 1")
        sys.exit(1)
    
    if args.base_price <= 0:
        print("Error: --base-price must be positive")
        sys.exit(1)
    
    if args.volatility < 0 or args.volatility > 1:
        print("Error: --volatility must be between 0 and 1")
        sys.exit(1)
    
    print("=" * 60)
    print("Gold Price Data Seeding Script")
    print("=" * 60)
    print()
    
    # Connect to MongoDB
    try:
        mongodb_uri = os.environ.get('MONGODB_URI') or config['development'].MONGODB_URI
        print(f"Connecting to MongoDB...")
        connect(host=mongodb_uri, alias='default')
        print("✓ Connected to MongoDB successfully")
        print()
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {str(e)}")
        sys.exit(1)
    
    # Seed data
    try:
        seed_gold_prices(
            days=args.days,
            base_price=args.base_price,
            volatility=args.volatility,
            clear_existing=args.clear
        )
    except Exception as e:
        print(f"✗ Error seeding data: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
