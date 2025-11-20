"""
Database migration script to add status field to existing products.

This script sets all existing products to 'published' status to maintain
backward compatibility when introducing the draft/publish feature.

Usage:
    python backend/scripts/migrate_product_status.py [--env=development|production]
    
Options:
    --env: Environment to use (default: development)
    --dry-run: Preview changes without applying them
    --backup: Create backup before migration
"""
import sys
import os
import argparse
from datetime import datetime
import json

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from mongoengine import connect
from app.models.product import Product
from app.config import config


def create_backup():
    """Create a backup of current product data."""
    try:
        backup_dir = os.path.join(os.path.dirname(__file__), '..', 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'products_backup_{timestamp}.json')
        
        products = Product.objects()
        backup_data = []
        
        for product in products:
            backup_data.append({
                'id': str(product.id),
                'name': product.name,
                'status': getattr(product, 'status', None),
                'published_at': product.published_at.isoformat() if hasattr(product, 'published_at') and product.published_at else None,
                'created_at': product.created_at.isoformat() if product.created_at else None
            })
        
        with open(backup_file, 'w') as f:
            json.dump(backup_data, f, indent=2)
        
        print(f"✓ Backup created: {backup_file}")
        return backup_file
        
    except Exception as e:
        print(f"✗ Error creating backup: {str(e)}")
        return None


def migrate_product_status(dry_run=False, create_backup_flag=False):
    """
    Migrate existing products to add status field.
    
    Args:
        dry_run: If True, only preview changes without applying them
        create_backup_flag: If True, create backup before migration
    
    Sets all existing products to 'published' status with current timestamp.
    """
    try:
        print("\n" + "=" * 70)
        print("PRODUCT STATUS MIGRATION")
        print("=" * 70)
        
        if dry_run:
            print("\n⚠ DRY RUN MODE - No changes will be applied\n")
        
        # Create backup if requested
        if create_backup_flag and not dry_run:
            backup_file = create_backup()
            if not backup_file:
                print("\n⚠ Warning: Backup failed. Continue anyway? (yes/no): ", end='')
                response = input()
                if response.lower() not in ['yes', 'y']:
                    print("Migration cancelled.")
                    return
        
        print("\nAnalyzing products...")
        
        # Find all products
        products = Product.objects()
        total_products = products.count()
        needs_migration = []
        already_migrated = []
        
        for product in products:
            # Check if product needs migration
            if not hasattr(product, 'status') or product.status is None or product.status == '':
                needs_migration.append(product)
            else:
                already_migrated.append(product)
        
        print(f"\nMigration Summary:")
        print(f"  Total products: {total_products}")
        print(f"  Already migrated: {len(already_migrated)}")
        print(f"  Needs migration: {len(needs_migration)}")
        
        if len(needs_migration) == 0:
            print("\n✓ All products already have status field. No migration needed.")
            return
        
        print(f"\nProducts to be migrated:")
        for i, product in enumerate(needs_migration[:10], 1):  # Show first 10
            print(f"  {i}. {product.name} (ID: {product.id})")
        
        if len(needs_migration) > 10:
            print(f"  ... and {len(needs_migration) - 10} more")
        
        if dry_run:
            print("\n✓ Dry run completed. Use without --dry-run to apply changes.")
            return
        
        # Perform migration
        print("\nApplying migration...")
        migrated_count = 0
        errors = []
        
        for product in needs_migration:
            try:
                product.status = 'published'
                product.published_at = product.created_at or datetime.utcnow()
                product.save()
                migrated_count += 1
                print(f"  ✓ Migrated: {product.name}")
            except Exception as e:
                error_msg = f"Failed to migrate {product.name}: {str(e)}"
                errors.append(error_msg)
                print(f"  ✗ {error_msg}")
        
        print("\n" + "=" * 70)
        print("MIGRATION COMPLETED")
        print("=" * 70)
        print(f"\n✓ Successfully migrated: {migrated_count} products")
        
        if errors:
            print(f"✗ Errors: {len(errors)}")
            for error in errors:
                print(f"  - {error}")
        
        print(f"\nFinal status:")
        print(f"  Total products: {Product.objects.count()}")
        print(f"  Published: {Product.objects(status='published').count()}")
        print(f"  Draft: {Product.objects(status='draft').count()}")
        
    except Exception as e:
        print(f"\n✗ Error during migration: {str(e)}")
        sys.exit(1)


def connect_to_db(env='development'):
    """Connect to MongoDB based on environment."""
    try:
        db_config = config.get(env)
        if not db_config:
            print(f"✗ Invalid environment: {env}")
            sys.exit(1)
        
        connect(
            db=db_config.MONGODB_DB,
            host=db_config.MONGODB_HOST,
            port=db_config.MONGODB_PORT,
            username=db_config.MONGODB_USERNAME,
            password=db_config.MONGODB_PASSWORD
        )
        
        print(f"✓ Connected to MongoDB ({env} environment)")
        return True
        
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Migrate product status field')
    parser.add_argument('--env', default='development', 
                       choices=['development', 'production'],
                       help='Environment to use (default: development)')
    parser.add_argument('--dry-run', action='store_true',
                       help='Preview changes without applying them')
    parser.add_argument('--backup', action='store_true',
                       help='Create backup before migration')
    
    args = parser.parse_args()
    
    print("\n" + "=" * 70)
    print("PRODUCT STATUS MIGRATION SCRIPT")
    print("=" * 70)
    print(f"\nEnvironment: {args.env}")
    print(f"Dry run: {args.dry_run}")
    print(f"Create backup: {args.backup}")
    
    if args.env == 'production' and not args.dry_run:
        print("\n⚠ WARNING: You are about to modify PRODUCTION database!")
        print("This will set all existing products to 'published' status.")
        response = input("\nType 'MIGRATE PRODUCTION' to continue: ")
        
        if response != 'MIGRATE PRODUCTION':
            print("Migration cancelled.")
            sys.exit(0)
    
    # Connect to database
    connect_to_db(args.env)
    
    # Run migration
    migrate_product_status(dry_run=args.dry_run, create_backup_flag=args.backup)
