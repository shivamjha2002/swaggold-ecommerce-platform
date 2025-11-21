"""Combined database setup script - initializes and seeds the database."""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from init_db import init_indexes, verify_connection
from seed_data import (
    seed_users, seed_price_history, seed_diamond_prices,
    seed_products, seed_customers
)
from app import create_app


def main():
    """Main setup function."""
    print("=" * 60)
    print("Complete Database Setup Script")
    print("=" * 60)
    print()
    
    # Create Flask app to initialize database connection
    app = create_app('development')
    
    with app.app_context():
        # Step 1: Verify connection
        print("Step 1: Verifying database connection...")
        if not verify_connection():
            print("\n✗ Setup failed: Could not connect to database")
            sys.exit(1)
        print()
        
        # Step 2: Initialize indexes
        print("Step 2: Initializing database indexes...")
        if not init_indexes():
            print("\n✗ Setup failed: Could not create indexes")
            sys.exit(1)
        print()
        
        # Step 3: Seed data
        print("Step 3: Seeding sample data...")
        seed_users()
        seed_price_history()
        seed_diamond_prices()
        seed_products()
        seed_customers()
        print()
        
        print("=" * 60)
        print("✓ Complete database setup finished successfully!")
        print("=" * 60)
        print()
        print("Your database is ready to use!")
        print()
        print("Default credentials:")
        print("  Admin - username: admin, password: admin123")
        print("  Staff - username: staff, password: staff123")
        print()
        print("⚠️  Remember to change default passwords in production!")
        print("=" * 60)


if __name__ == '__main__':
    main()
