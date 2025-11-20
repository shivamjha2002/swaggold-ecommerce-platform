# Database Migration Guide

## Product Status Migration

This guide covers the migration process for adding the `status` and `published_at` fields to existing products.

### Overview

The product status migration adds support for draft/publish workflow by:
- Adding `status` field to all products (values: 'draft' or 'published')
- Adding `published_at` timestamp field
- Setting existing products to 'published' status to maintain backward compatibility

### Prerequisites

1. **Backup your database** before running any migration
2. Ensure MongoDB is running
3. Activate the Python virtual environment
4. Test migration on development environment first

### Migration Scripts

Two scripts are provided:

1. **migrate_product_status.py** - Applies the migration
2. **rollback_product_status.py** - Reverts the migration

### Step-by-Step Migration Process

#### 1. Backup Database

**Using MongoDB tools:**
```bash
# Backup entire database
mongodump --db swati_jewellers_dev --out ./backups/pre-migration-backup

# Or using Docker
docker-compose exec mongodb mongodump --username admin --password <password> --authenticationDatabase admin --out /data/backup
```

**Using migration script:**
```bash
# The migration script can create a JSON backup
python backend/scripts/migrate_product_status.py --backup --dry-run
```

#### 2. Test Migration (Dry Run)

Always test the migration first with `--dry-run` flag:

```bash
# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Run dry run on development
python backend/scripts/migrate_product_status.py --env=development --dry-run
```

**Expected Output:**
```
======================================================================
PRODUCT STATUS MIGRATION SCRIPT
======================================================================

Environment: development
Dry run: True
Create backup: False

======================================================================
PRODUCT STATUS MIGRATION
======================================================================

⚠ DRY RUN MODE - No changes will be applied

✓ Connected to MongoDB (development environment)

Analyzing products...

Migration Summary:
  Total products: 50
  Already migrated: 0
  Needs migration: 50

Products to be migrated:
  1. Gold Ring (ID: 507f1f77bcf86cd799439011)
  2. Diamond Necklace (ID: 507f1f77bcf86cd799439012)
  ...

✓ Dry run completed. Use without --dry-run to apply changes.
```

#### 3. Run Migration on Development

```bash
# Run migration with backup
python backend/scripts/migrate_product_status.py --env=development --backup
```

**Expected Output:**
```
======================================================================
PRODUCT STATUS MIGRATION
======================================================================

✓ Backup created: backend/backups/products_backup_20251115_120000.json
✓ Connected to MongoDB (development environment)

Analyzing products...

Migration Summary:
  Total products: 50
  Already migrated: 0
  Needs migration: 50

Applying migration...
  ✓ Migrated: Gold Ring
  ✓ Migrated: Diamond Necklace
  ...

======================================================================
MIGRATION COMPLETED
======================================================================

✓ Successfully migrated: 50 products

Final status:
  Total products: 50
  Published: 50
  Draft: 0
```

#### 4. Verify Migration

Check that products have the new fields:

```bash
# Using MongoDB shell
mongo swati_jewellers_dev
db.product.findOne()

# Should show:
# {
#   ...
#   "status": "published",
#   "published_at": ISODate("2025-11-15T10:00:00Z"),
#   ...
# }
```

**Using Python:**
```python
from app.models.product import Product
from mongoengine import connect

connect(db='swati_jewellers_dev', host='localhost', port=27017)

# Check a product
product = Product.objects.first()
print(f"Status: {product.status}")
print(f"Published at: {product.published_at}")

# Count by status
print(f"Published: {Product.objects(status='published').count()}")
print(f"Draft: {Product.objects(status='draft').count()}")
```

#### 5. Test Application

After migration, test the application:

1. **Backend API:**
   ```bash
   # Start backend
   python backend/run.py
   
   # Test public endpoint (should return only published products)
   curl http://localhost:5000/api/products
   
   # Test admin endpoint (should return all products)
   curl -H "Authorization: Bearer <token>" http://localhost:5000/api/products/admin
   ```

2. **Frontend:**
   - Verify products display correctly
   - Test creating new products with draft status
   - Test publish/unpublish functionality
   - Verify draft products are hidden from public view

#### 6. Production Migration

**IMPORTANT:** Only proceed to production after thorough testing in development.

```bash
# 1. Create full database backup
mongodump --db swati_jewellers --out ./backups/production-pre-migration-$(date +%Y%m%d)

# 2. Run dry run on production
python backend/scripts/migrate_product_status.py --env=production --dry-run

# 3. Review dry run output carefully

# 4. Run migration with backup
python backend/scripts/migrate_product_status.py --env=production --backup

# You will be prompted to type 'MIGRATE PRODUCTION' to confirm
```

### Rollback Procedure

If you need to rollback the migration:

#### Option 1: Restore from Backup File

```bash
# List available backups
python backend/scripts/rollback_product_status.py --list-backups

# Restore from specific backup
python backend/scripts/rollback_product_status.py --env=development --backup-file=backend/backups/products_backup_20251115_120000.json
```

#### Option 2: Remove Status Fields

```bash
# Dry run first
python backend/scripts/rollback_product_status.py --env=development --dry-run

# Apply rollback
python backend/scripts/rollback_product_status.py --env=development
```

#### Option 3: Restore from MongoDB Backup

```bash
# Restore entire database
mongorestore --db swati_jewellers_dev --drop ./backups/pre-migration-backup/swati_jewellers_dev

# Or using Docker
docker-compose exec mongodb mongorestore --username admin --password <password> --authenticationDatabase admin --drop /data/backup
```

### Troubleshooting

#### Migration Script Errors

**Error: "No module named 'mongoengine'"**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r backend/requirements.txt
```

**Error: "Failed to connect to MongoDB"**
```bash
# Check MongoDB is running
# Windows:
net start MongoDB

# Linux:
sudo systemctl status mongod

# Mac:
brew services list

# Check connection string in backend/.env
```

**Error: "Invalid environment"**
```bash
# Ensure you're using correct environment name
python backend/scripts/migrate_product_status.py --env=development
# Valid values: development, production
```

#### Partial Migration

If migration fails partway through:

1. Check the error message
2. Fix the issue (e.g., database connection, permissions)
3. Re-run the migration script
   - The script will skip already migrated products
   - Only unmigrated products will be processed

#### Verification Issues

**Products not showing correct status:**
```python
# Check product status in database
from app.models.product import Product
from mongoengine import connect

connect(db='swati_jewellers_dev', host='localhost', port=27017)

# Find products without status
products_no_status = Product.objects(status__exists=False)
print(f"Products without status: {products_no_status.count()}")

# Find products with None status
products_none_status = [p for p in Product.objects() if p.status is None]
print(f"Products with None status: {len(products_none_status)}")
```

### Migration Script Options

#### migrate_product_status.py

```bash
python backend/scripts/migrate_product_status.py [OPTIONS]

Options:
  --env=ENV           Environment (development|production) [default: development]
  --dry-run          Preview changes without applying them
  --backup           Create JSON backup before migration
  -h, --help         Show help message
```

#### rollback_product_status.py

```bash
python backend/scripts/rollback_product_status.py [OPTIONS]

Options:
  --env=ENV           Environment (development|production) [default: development]
  --dry-run          Preview changes without applying them
  --backup-file=FILE  Restore from specific backup file
  --list-backups     List available backup files
  -h, --help         Show help message
```

### Best Practices

1. **Always backup before migration**
   - Use both MongoDB backup and script backup
   - Store backups in safe location
   - Test restore procedure

2. **Test thoroughly in development**
   - Run dry run first
   - Verify all products migrate correctly
   - Test application functionality
   - Check both public and admin views

3. **Plan production migration**
   - Schedule during low-traffic period
   - Notify team members
   - Have rollback plan ready
   - Monitor application after migration

4. **Document the process**
   - Record migration date and time
   - Note any issues encountered
   - Document any custom changes made

### Post-Migration Checklist

- [ ] All products have `status` field
- [ ] All products have `published_at` timestamp
- [ ] Public API returns only published products
- [ ] Admin API returns all products
- [ ] Publish/unpublish functionality works
- [ ] Frontend displays products correctly
- [ ] Draft products are hidden from public
- [ ] Product creation defaults to draft status
- [ ] Backup files are stored safely
- [ ] Team is notified of changes

### Support

If you encounter issues during migration:

1. Check this guide's troubleshooting section
2. Review migration script output for error messages
3. Check application logs
4. Verify database connection and permissions
5. Contact development team for assistance

### Additional Resources

- [Backend README](./README.md) - General backend documentation
- [API Documentation](./API_DOCUMENTATION.md) - API endpoint details
- [Product Model](./app/models/product.py) - Product model definition
- [Product Service](./app/services/product_service.py) - Product business logic
