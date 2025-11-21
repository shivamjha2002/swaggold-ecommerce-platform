"""
Rollback script for product status migration.

This script removes the status and published_at fields from products,
reverting them to the pre-migration state.

Usage:
    python backend/scripts/rollback_product_status.py [--env=development|production]
    
Options:
    --env: Environment to use (default: development)
    --dry-run: Preview changes without applying them
    --backup-file: Restore from specific backup file
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


def list_backups():
    """List available backup files."""
    backup_dir = os.path.join(os.path.dirname(__file__), '..', 'backups')
    
    if not os.path.exists(backup_dir):
        return []
    
    backups = []
    for filename in os.listdir(backup_dir):
        if filename.startswith('products_backup_') and filename.endswith('.json'):
            filepath = os.path.join(backup_dir, filename)
            backups.append({
                'filename': filename,
                'filepath': filepath,
                'size': os.path.getsize(filepath),
                'modified': datetime.fromtimestamp(os.path.getmtime(filepath))
            })
    
    return sorted(backups, key=lambda x: x['modified'], reverse=True)


def restore_from_backup(backup_file, dry_run=False):
    """
    Restore products from backup file.
    
    Args:
        backup_file: Path to backup JSON file
        dry_run: If True, only preview changes without applying them
    """
    try:
        print(f"\nRestoring from backup: {backup_file}")
        
        with open(backup_file, 'r') as f:
            backup_data = json.load(f)
        
        print(f"Backup contains {len(backup_data)} products")
        
        if dry_run:
            print("\n⚠ DRY RUN MODE - No changes will be applied\n")
            print("Products that would be restored:")
            for item in backup_data[:10]:
                print(f"  - {item['name']} (status: {item['status']})")
            if len(backup_data) > 10:
                print(f"  ... and {len(backup_data) - 10} more")
            return
        
        restored_count = 0
        errors = []
        
        for item in backup_data:
            try:
                product = Product.objects(id=item['id']).first()
                if product:
                    # Restore original status
                    if item['status']:
                        product.status = item['status']
                    else:
                        # Remove status field if it didn't exist
                        product.status = None
                    
                    # Restore published_at
                    if item['published_at']:
                        product.published_at = datetime.fromisoformat(item['published_at'])
                    else:
                        product.published_at = None
                    
                    product.save()
                    restored_count += 1
                    print(f"  ✓ Restored: {product.name}")
                else:
                    print(f"  ⚠ Product not found: {item['name']} (ID: {item['id']})")
                    
            except Exception as e:
                error_msg = f"Failed to restore {item['name']}: {str(e)}"
                errors.append(error_msg)
                print(f"  ✗ {error_msg}")
        
        print(f"\n✓ Successfully restored: {restored_count} products")
        
        if errors:
            print(f"✗ Errors: {len(errors)}")
            for error in errors:
                print(f"  - {error}")
        
    except Exception as e:
        print(f"✗ Error restoring from backup: {str(e)}")
        sys.exit(1)


def rollback_migration(dry_run=False):
    """
    Rollback product status migration.
    
    Args:
        dry_run: If True, only preview changes without applying them
    
    Removes status and published_at fields from all products.
    """
    try:
        print("\n" + "=" * 70)
        print("PRODUCT STATUS ROLLBACK")
        print("=" * 70)
        
        if dry_run:
            print("\n⚠ DRY RUN MODE - No changes will be applied\n")
        
        print("\nAnalyzing products...")
        
        # Find all products with status field
        products = Product.objects()
        total_products = products.count()
        has_status = []
        no_status = []
        
        for product in products:
            if hasattr(product, 'status') and product.status:
                has_status.append(product)
            else:
                no_status.append(product)
        
        print(f"\nRollback Summary:")
        print(f"  Total products: {total_products}")
        print(f"  Has status field: {len(has_status)}")
        print(f"  No status field: {len(no_status)}")
        
        if len(has_status) == 0:
            print("\n✓ No products have status field. Nothing to rollback.")
            return
        
        print(f"\nProducts to be rolled back:")
        for i, product in enumerate(has_status[:10], 1):  # Show first 10
            status = getattr(product, 'status', 'N/A')
            print(f"  {i}. {product.name} (status: {status})")
        
        if len(has_status) > 10:
            print(f"  ... and {len(has_status) - 10} more")
        
        if dry_run:
            print("\n✓ Dry run completed. Use without --dry-run to apply changes.")
            return
        
        # Perform rollback
        print("\nApplying rollback...")
        rolled_back_count = 0
        errors = []
        
        for product in has_status:
            try:
                # Remove status and published_at fields
                product.status = None
                product.published_at = None
                product.save()
                rolled_back_count += 1
                print(f"  ✓ Rolled back: {product.name}")
            except Exception as e:
                error_msg = f"Failed to rollback {product.name}: {str(e)}"
                errors.append(error_msg)
                print(f"  ✗ {error_msg}")
        
        print("\n" + "=" * 70)
        print("ROLLBACK COMPLETED")
        print("=" * 70)
        print(f"\n✓ Successfully rolled back: {rolled_back_count} products")
        
        if errors:
            print(f"✗ Errors: {len(errors)}")
            for error in errors:
                print(f"  - {error}")
        
        print(f"\nFinal status:")
        print(f"  Total products: {Product.objects.count()}")
        
    except Exception as e:
        print(f"\n✗ Error during rollback: {str(e)}")
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
    parser = argparse.ArgumentParser(description='Rollback product status migration')
    parser.add_argument('--env', default='development', 
                       choices=['development', 'production'],
                       help='Environment to use (default: development)')
    parser.add_argument('--dry-run', action='store_true',
                       help='Preview changes without applying them')
    parser.add_argument('--backup-file', type=str,
                       help='Restore from specific backup file')
    parser.add_argument('--list-backups', action='store_true',
                       help='List available backup files')
    
    args = parser.parse_args()
    
    # List backups if requested
    if args.list_backups:
        print("\n" + "=" * 70)
        print("AVAILABLE BACKUPS")
        print("=" * 70)
        
        backups = list_backups()
        
        if not backups:
            print("\nNo backup files found.")
        else:
            print(f"\nFound {len(backups)} backup file(s):\n")
            for i, backup in enumerate(backups, 1):
                print(f"{i}. {backup['filename']}")
                print(f"   Modified: {backup['modified'].strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"   Size: {backup['size']} bytes")
                print(f"   Path: {backup['filepath']}\n")
        
        sys.exit(0)
    
    print("\n" + "=" * 70)
    print("PRODUCT STATUS ROLLBACK SCRIPT")
    print("=" * 70)
    print(f"\nEnvironment: {args.env}")
    print(f"Dry run: {args.dry_run}")
    
    if args.backup_file:
        print(f"Backup file: {args.backup_file}")
    
    if args.env == 'production' and not args.dry_run:
        print("\n⚠ WARNING: You are about to modify PRODUCTION database!")
        
        if args.backup_file:
            print("This will restore products from backup file.")
        else:
            print("This will remove status fields from all products.")
        
        response = input("\nType 'ROLLBACK PRODUCTION' to continue: ")
        
        if response != 'ROLLBACK PRODUCTION':
            print("Rollback cancelled.")
            sys.exit(0)
    
    # Connect to database
    connect_to_db(args.env)
    
    # Run rollback
    if args.backup_file:
        if not os.path.exists(args.backup_file):
            print(f"\n✗ Backup file not found: {args.backup_file}")
            print("\nUse --list-backups to see available backups")
            sys.exit(1)
        
        restore_from_backup(args.backup_file, dry_run=args.dry_run)
    else:
        rollback_migration(dry_run=args.dry_run)
