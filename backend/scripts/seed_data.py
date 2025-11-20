"""Database seeding script to populate sample data."""
import sys
import os
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import (
    Product, Customer, PriceHistory, DiamondPriceHistory, User
)


def seed_users():
    """Create sample admin users."""
    print("Seeding users...")
    
    try:
        # Check if admin user already exists
        if User.objects(username='admin').first():
            print("  Admin user already exists, skipping...")
            return
        
        # Create admin user
        admin = User(
            username='admin',
            email='admin@swatijewellers.com',
            role='admin',
            is_active=True
        )
        admin.set_password('admin123')  # Change this in production!
        admin.save()
        print("  ✓ Created admin user (username: admin, password: admin123)")
        
        # Create staff user
        staff = User(
            username='staff',
            email='staff@swatijewellers.com',
            role='staff',
            is_active=True
        )
        staff.set_password('staff123')
        staff.save()
        print("  ✓ Created staff user (username: staff, password: staff123)")
        
    except Exception as e:
        print(f"  ✗ Error seeding users: {str(e)}")


def seed_price_history():
    """Create sample price history data with realistic trends."""
    print("Seeding price history...")
    
    try:
        # Check if price history already exists
        existing_count = PriceHistory.objects().count()
        if existing_count > 0:
            print(f"  Price history already exists ({existing_count} records), skipping...")
            return
        
        # Generate 3 years (1095 days) of gold price history with realistic trends
        print("  Generating gold price history (3 years)...")
        base_price = 5800
        today = datetime.utcnow()
        
        # Simulate realistic price movements with trends
        for i in range(1095, 0, -1):
            date = today - timedelta(days=i)
            
            # Add seasonal trends and random walk
            days_from_start = 1095 - i
            trend = (days_from_start / 1095) * 600  # Upward trend over 3 years
            seasonal = 100 * random.choice([1, -1]) * (0.5 + 0.5 * random.random())
            daily_change = random.uniform(-50, 80)
            
            price = base_price + trend + seasonal + daily_change
            
            PriceHistory(
                metal_type='gold',
                purity='916',
                price_per_gram=round(price, 2),
                date=date,
                source='seed_data',
                currency='INR'
            ).save()
        
        print(f"  ✓ Created 1095 days (3 years) of gold price history")
        
        # Generate 3 years of silver price history
        print("  Generating silver price history (3 years)...")
        base_price = 65
        for i in range(1095, 0, -1):
            date = today - timedelta(days=i)
            
            days_from_start = 1095 - i
            trend = (days_from_start / 1095) * 20
            seasonal = 5 * random.choice([1, -1]) * random.random()
            daily_change = random.uniform(-3, 5)
            
            price = base_price + trend + seasonal + daily_change
            
            PriceHistory(
                metal_type='silver',
                purity='999',
                price_per_gram=round(price, 2),
                date=date,
                source='seed_data',
                currency='INR'
            ).save()
        
        print(f"  ✓ Created 1095 days (3 years) of silver price history")
        
    except Exception as e:
        print(f"  ✗ Error seeding price history: {str(e)}")


def seed_diamond_prices():
    """Create massive diamond price dataset with realistic variations."""
    print("Seeding diamond prices...")
    
    try:
        # Check if diamond prices already exist
        existing_count = DiamondPriceHistory.objects().count()
        if existing_count > 0:
            print(f"  Diamond prices already exist ({existing_count} records), skipping...")
            return
        
        print("  Generating comprehensive diamond price dataset...")
        
        # Comprehensive diamond attributes
        cuts = ['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair']
        colors = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
        clarities = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1']
        
        # Generate varied carat weights
        carats = []
        # Small diamonds (0.3 to 1.0 carats) - more common
        carats.extend([round(0.3 + i * 0.05, 2) for i in range(15)])  # 0.3 to 1.0
        # Medium diamonds (1.0 to 2.5 carats)
        carats.extend([round(1.0 + i * 0.1, 2) for i in range(16)])  # 1.0 to 2.5
        # Large diamonds (2.5 to 5.0 carats) - less common
        carats.extend([round(2.5 + i * 0.25, 2) for i in range(11)])  # 2.5 to 5.0
        
        count = 0
        today = datetime.utcnow()
        
        # Price multipliers based on attributes
        cut_multipliers = {
            'Ideal': 1.25,
            'Excellent': 1.15,
            'Very Good': 1.05,
            'Good': 0.95,
            'Fair': 0.80
        }
        
        color_multipliers = {
            'D': 1.40, 'E': 1.30, 'F': 1.20, 'G': 1.10,
            'H': 1.00, 'I': 0.90, 'J': 0.80, 'K': 0.70
        }
        
        clarity_multipliers = {
            'IF': 1.50, 'VVS1': 1.35, 'VVS2': 1.25, 'VS1': 1.15,
            'VS2': 1.05, 'SI1': 0.90, 'SI2': 0.75, 'I1': 0.60
        }
        
        # Generate multiple records for each combination to increase dataset size
        for carat in carats:
            for cut in cuts:
                for color in colors:
                    for clarity in clarities:
                        # Generate 3-5 price points for each combination (different dates/variations)
                        num_records = random.randint(3, 5)
                        
                        for _ in range(num_records):
                            # Base price calculation (exponential with carat weight)
                            # Price per carat increases exponentially with size
                            base_price_per_carat = 180000 * (carat ** 1.5)
                            base_price = base_price_per_carat * carat
                            
                            # Apply multipliers
                            price = base_price
                            price *= cut_multipliers.get(cut, 1.0)
                            price *= color_multipliers.get(color, 1.0)
                            price *= clarity_multipliers.get(clarity, 1.0)
                            
                            # Add realistic random variation (±8%)
                            variation = random.uniform(0.92, 1.08)
                            price *= variation
                            
                            # Random date within last 2 years
                            days_ago = random.randint(0, 730)
                            date = today - timedelta(days=days_ago)
                            
                            DiamondPriceHistory(
                                carat=carat,
                                cut=cut,
                                color=color,
                                clarity=clarity,
                                price=round(price, 2),
                                date=date,
                                source='seed_data',
                                currency='INR'
                            ).save()
                            
                            count += 1
                            
                            # Progress indicator
                            if count % 1000 == 0:
                                print(f"    Generated {count} records...")
        
        print(f"  ✓ Created {count} diamond price records")
        print(f"    Combinations: {len(carats)} carats × {len(cuts)} cuts × {len(colors)} colors × {len(clarities)} clarities")
        
    except Exception as e:
        print(f"  ✗ Error seeding diamond prices: {str(e)}")


def seed_products():
    """Create sample products."""
    print("Seeding products...")
    
    try:
        # Check if products already exist
        if Product.objects().count() > 0:
            print("  Products already exist, skipping...")
            return
        
        sample_products = [
            {
                'name': 'Traditional Gold Nath Set',
                'category': 'Nath',
                'base_price': 120000,
                'weight': 4.110,
                'gold_purity': '916',
                'description': 'Handcrafted traditional nath set with intricate designs',
                'image_url': 'https://example.com/nath1.jpg',
                'stock_quantity': 5
            },
            {
                'name': 'Diamond Pendant Set',
                'category': 'Pendant Set',
                'base_price': 85000,
                'weight': 3.250,
                'gold_purity': '916',
                'description': 'Elegant diamond pendant set with matching earrings',
                'image_url': 'https://example.com/pendant1.jpg',
                'stock_quantity': 8
            },
            {
                'name': 'Bridal Tika',
                'category': 'Tika',
                'base_price': 45000,
                'weight': 2.100,
                'gold_purity': '916',
                'description': 'Beautiful bridal tika with pearl and stone work',
                'image_url': 'https://example.com/tika1.jpg',
                'stock_quantity': 3
            },
            {
                'name': 'Gold Chain Necklace',
                'category': 'Necklace',
                'base_price': 150000,
                'weight': 8.500,
                'gold_purity': '916',
                'description': 'Classic gold chain necklace, 22 karat',
                'image_url': 'https://example.com/necklace1.jpg',
                'stock_quantity': 10
            },
            {
                'name': 'Gold Jhumka Earrings',
                'category': 'Earrings',
                'base_price': 35000,
                'weight': 1.850,
                'gold_purity': '916',
                'description': 'Traditional jhumka earrings with meenakari work',
                'image_url': 'https://example.com/earrings1.jpg',
                'stock_quantity': 15
            },
            {
                'name': 'Gold Bangles Set (6 pieces)',
                'category': 'Bangles',
                'base_price': 180000,
                'weight': 12.000,
                'gold_purity': '916',
                'description': 'Set of 6 gold bangles with traditional patterns',
                'image_url': 'https://example.com/bangles1.jpg',
                'stock_quantity': 4
            },
            {
                'name': 'Diamond Ring',
                'category': 'Ring',
                'base_price': 95000,
                'weight': 2.500,
                'gold_purity': '750',
                'description': 'Solitaire diamond ring in 18k gold',
                'image_url': 'https://example.com/ring1.jpg',
                'stock_quantity': 6
            },
            {
                'name': 'Gold Bracelet',
                'category': 'Bracelet',
                'base_price': 65000,
                'weight': 4.200,
                'gold_purity': '916',
                'description': 'Elegant gold bracelet with modern design',
                'image_url': 'https://example.com/bracelet1.jpg',
                'stock_quantity': 7
            },
            {
                'name': 'Complete Bridal Set',
                'category': 'Bridal Set',
                'base_price': 450000,
                'weight': 25.000,
                'gold_purity': '916',
                'description': 'Complete bridal jewelry set including necklace, earrings, bangles, and tika',
                'image_url': 'https://example.com/bridal1.jpg',
                'stock_quantity': 2
            }
        ]
        
        for product_data in sample_products:
            Product(**product_data).save()
        
        print(f"  ✓ Created {len(sample_products)} sample products")
        
    except Exception as e:
        print(f"  ✗ Error seeding products: {str(e)}")


def seed_customers():
    """Create sample customers."""
    print("Seeding customers...")
    
    try:
        # Check if customers already exist
        if Customer.objects().count() > 0:
            print("  Customers already exist, skipping...")
            return
        
        sample_customers = [
            {
                'name': 'Priya Sharma',
                'phone': '+919876543210',
                'email': 'priya.sharma@example.com',
                'address': '123 MG Road, Mumbai, Maharashtra',
                'current_balance': 0
            },
            {
                'name': 'Rahul Verma',
                'phone': '+919876543211',
                'email': 'rahul.verma@example.com',
                'address': '456 Park Street, Delhi',
                'current_balance': 0
            },
            {
                'name': 'Anjali Patel',
                'phone': '+919876543212',
                'email': 'anjali.patel@example.com',
                'address': '789 Ring Road, Ahmedabad, Gujarat',
                'current_balance': 0
            }
        ]
        
        for customer_data in sample_customers:
            Customer(**customer_data).save()
        
        print(f"  ✓ Created {len(sample_customers)} sample customers")
        
    except Exception as e:
        print(f"  ✗ Error seeding customers: {str(e)}")


def main():
    """Main seeding function."""
    print("=" * 60)
    print("Database Seeding Script")
    print("=" * 60)
    print()
    
    # Create Flask app to initialize database connection
    app = create_app('development')
    
    with app.app_context():
        # Seed data
        seed_users()
        seed_price_history()
        seed_diamond_prices()
        seed_products()
        seed_customers()
        
        print()
        print("=" * 60)
        print("Database seeding completed successfully!")
        print("=" * 60)
        print()
        print("Default credentials:")
        print("  Admin - username: admin, password: admin123")
        print("  Staff - username: staff, password: staff123")
        print()
        print("⚠️  Remember to change default passwords in production!")
        print("=" * 60)


if __name__ == '__main__':
    main()
