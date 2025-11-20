"""Script to seed diamond price historical data."""
import sys
import os
import argparse
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from mongoengine import connect
from app.models.price_history import DiamondPriceHistory
from app.config import config


# Diamond grading scales
CUT_GRADES = ['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair']
COLOR_GRADES = ['D', 'E', 'F', 'G', 'H', 'I', 'J']
CLARITY_GRADES = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2']

# Multipliers for pricing formula
CUT_MULTIPLIERS = {
    'Ideal': 1.20,
    'Excellent': 1.15,
    'Very Good': 1.10,
    'Good': 1.00,
    'Fair': 0.90
}

COLOR_MULTIPLIERS = {
    'D': 1.20,
    'E': 1.15,
    'F': 1.10,
    'G': 1.05,
    'H': 1.00,
    'I': 0.95,
    'J': 0.90
}

CLARITY_MULTIPLIERS = {
    'IF': 1.30,
    'VVS1': 1.25,
    'VVS2': 1.20,
    'VS1': 1.15,
    'VS2': 1.10,
    'SI1': 1.00,
    'SI2': 0.90
}


def calculate_diamond_price(carat, cut, color, clarity):
    """
    Calculate diamond price based on 4Cs using realistic pricing formula.
    
    Formula:
    - Base price = carat^2 * 50000 (exponential relationship with carat)
    - Apply multipliers for cut, color, and clarity
    - Add random variation (±10%) for market fluctuations
    
    Args:
        carat: Diamond carat weight (0.3 to 3.0)
        cut: Cut quality grade
        color: Color grade
        clarity: Clarity grade
    
    Returns:
        Calculated price in INR
    """
    # Base price with exponential carat relationship
    base_price = (carat ** 2) * 50000
    
    # Apply quality multipliers
    cut_mult = CUT_MULTIPLIERS.get(cut, 1.0)
    color_mult = COLOR_MULTIPLIERS.get(color, 1.0)
    clarity_mult = CLARITY_MULTIPLIERS.get(clarity, 1.0)
    
    # Calculate final price with multipliers
    price = base_price * cut_mult * color_mult * clarity_mult
    
    # Add random market variation (±10%)
    variation = random.uniform(0.90, 1.10)
    final_price = price * variation
    
    return round(final_price, 2)


def generate_diamond_prices(count=100, date_range_days=90):
    """
    Generate realistic diamond price data with diverse 4C combinations.
    
    Args:
        count: Number of diamond records to generate
        date_range_days: Spread records over this many days
    
    Returns:
        List of diamond price records
    """
    diamonds = []
    
    # Calculate date range
    end_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=date_range_days - 1)
    
    for i in range(count):
        # Generate random carat weight (weighted towards smaller diamonds)
        # Most diamonds are between 0.3 and 2.0 carats
        carat = round(random.triangular(0.3, 3.0, 0.8), 2)
        
        # Select random grades (weighted towards middle grades)
        cut = random.choice(CUT_GRADES)
        color = random.choice(COLOR_GRADES)
        clarity = random.choice(CLARITY_GRADES)
        
        # Calculate price
        price = calculate_diamond_price(carat, cut, color, clarity)
        
        # Assign random date within range
        days_offset = random.randint(0, date_range_days - 1)
        record_date = start_date + timedelta(days=days_offset)
        
        # Create diamond record
        diamond_record = {
            'carat': carat,
            'cut': cut,
            'color': color,
            'clarity': clarity,
            'price': price,
            'currency': 'INR',
            'date': record_date,
            'source': 'seeded'
        }
        
        diamonds.append(diamond_record)
    
    return diamonds


def seed_diamond_prices(count=100, date_range_days=90, clear_existing=False):
    """
    Seed database with diamond price data.
    
    Args:
        count: Number of diamond records to generate
        date_range_days: Spread records over this many days
        clear_existing: Whether to clear existing seeded data (default: False)
    
    Returns:
        Number of records inserted
    """
    print(f"Generating {count} diamond price records...")
    print(f"Date range: {date_range_days} days")
    print()
    
    # Clear existing seeded data if requested
    if clear_existing:
        print("Clearing existing seeded diamond price data...")
        deleted_count = DiamondPriceHistory.objects(source='seeded').delete()
        print(f"Deleted {deleted_count} existing records")
        print()
    
    # Generate diamond data
    diamonds = generate_diamond_prices(count, date_range_days)
    
    # Insert into database
    print("Inserting diamond price data into MongoDB...")
    inserted_count = 0
    error_count = 0
    
    for i, diamond_data in enumerate(diamonds, 1):
        try:
            diamond_history = DiamondPriceHistory(**diamond_data)
            diamond_history.save()
            inserted_count += 1
            
            # Progress indicator
            if i % 10 == 0 or i == len(diamonds):
                print(f"  Progress: {i}/{len(diamonds)} records processed", end='\r')
                
        except Exception as e:
            error_count += 1
            print(f"\n  ✗ Error inserting diamond record: {str(e)}")
            continue
    
    print()  # New line after progress indicator
    
    # Calculate statistics
    prices = [d['price'] for d in diamonds]
    carats = [d['carat'] for d in diamonds]
    
    # Count grade distributions
    cut_dist = {}
    color_dist = {}
    clarity_dist = {}
    
    for d in diamonds:
        cut_dist[d['cut']] = cut_dist.get(d['cut'], 0) + 1
        color_dist[d['color']] = color_dist.get(d['color'], 0) + 1
        clarity_dist[d['clarity']] = clarity_dist.get(d['clarity'], 0) + 1
    
    print()
    print("=" * 60)
    print("Diamond Price Data Seeding Complete!")
    print("=" * 60)
    print(f"✓ Records inserted: {inserted_count}")
    
    if error_count > 0:
        print(f"⚠ Errors encountered: {error_count}")
    
    print()
    print("Statistics:")
    print(f"  Carat range: {min(carats):.2f} - {max(carats):.2f}")
    print(f"  Price range: ₹{min(prices):,.2f} - ₹{max(prices):,.2f}")
    print(f"  Average price: ₹{sum(prices)/len(prices):,.2f}")
    print()
    print("Grade Distribution:")
    print(f"  Cut grades: {len(cut_dist)} types")
    for grade, count in sorted(cut_dist.items(), key=lambda x: CUT_GRADES.index(x[0])):
        print(f"    {grade}: {count}")
    print(f"  Color grades: {len(color_dist)} types")
    for grade, count in sorted(color_dist.items(), key=lambda x: COLOR_GRADES.index(x[0])):
        print(f"    {grade}: {count}")
    print(f"  Clarity grades: {len(clarity_dist)} types")
    for grade, count in sorted(clarity_dist.items(), key=lambda x: CLARITY_GRADES.index(x[0])):
        print(f"    {grade}: {count}")
    print()
    
    # Verify data was inserted correctly
    print("Verifying inserted data...")
    verification_count = DiamondPriceHistory.objects(source='seeded').count()
    
    if verification_count >= inserted_count:
        print(f"✓ Verification successful: {verification_count} records found in database")
    else:
        print(f"⚠ Verification warning: Expected {inserted_count} records, found {verification_count}")
    
    print()
    
    return inserted_count


def main():
    """Main function to run the seeding script."""
    parser = argparse.ArgumentParser(
        description='Seed diamond price historical data into MongoDB',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python seed_diamond_prices.py                        # Seed 100 records with defaults
  python seed_diamond_prices.py --count 200            # Seed 200 records
  python seed_diamond_prices.py --days 180             # Spread over 180 days
  python seed_diamond_prices.py --clear                # Clear existing seeded data
        """
    )
    
    parser.add_argument(
        '--count',
        type=int,
        default=100,
        help='Number of diamond records to generate (default: 100)'
    )
    
    parser.add_argument(
        '--days',
        type=int,
        default=90,
        help='Spread records over this many days (default: 90)'
    )
    
    parser.add_argument(
        '--clear',
        action='store_true',
        help='Clear existing seeded data before inserting new data'
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.count < 1:
        print("Error: --count must be at least 1")
        sys.exit(1)
    
    if args.days < 1:
        print("Error: --days must be at least 1")
        sys.exit(1)
    
    print("=" * 60)
    print("Diamond Price Data Seeding Script")
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
        seed_diamond_prices(
            count=args.count,
            date_range_days=args.days,
            clear_existing=args.clear
        )
    except Exception as e:
        print(f"✗ Error seeding data: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
