"""Database initialization script to create indexes."""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import (
    Product, Customer, Sale, KhataTransaction,
    PriceHistory, DiamondPriceHistory, TrainingLog, User
)


def init_indexes():
    """Initialize database indexes for all collections."""
    print("Initializing database indexes...")
    
    try:
        # Create indexes for each model
        models = [
            Product, Customer, Sale, KhataTransaction,
            PriceHistory, DiamondPriceHistory, TrainingLog, User
        ]
        
        for model in models:
            print(f"Creating indexes for {model.__name__}...")
            model.ensure_indexes()
            print(f"✓ Indexes created for {model.__name__}")
        
        print("\n✓ All indexes created successfully!")
        return True
        
    except Exception as e:
        print(f"\n✗ Error creating indexes: {str(e)}")
        return False


def verify_connection():
    """Verify database connection."""
    print("Verifying database connection...")
    
    try:
        from mongoengine import connection
        db = connection.get_db()
        collections = db.list_collection_names()
        print(f"✓ Connected to database: {db.name}")
        print(f"  Existing collections: {', '.join(collections) if collections else 'None'}")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {str(e)}")
        return False


def main():
    """Main initialization function."""
    print("=" * 60)
    print("Database Initialization Script")
    print("=" * 60)
    print()
    
    # Create Flask app to initialize database connection
    app = create_app('development')
    
    with app.app_context():
        # Verify connection
        if not verify_connection():
            sys.exit(1)
        
        print()
        
        # Initialize indexes
        if not init_indexes():
            sys.exit(1)
        
        print()
        print("=" * 60)
        print("Database initialization completed successfully!")
        print("=" * 60)


if __name__ == '__main__':
    main()
