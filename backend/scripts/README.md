# Database Scripts

This directory contains scripts for database initialization and seeding.

## Scripts

### setup_db.py
Complete database setup script that initializes indexes and seeds sample data.

**Usage:**
```bash
cd backend
python scripts/setup_db.py
```

This script will:
1. Verify database connection
2. Create all necessary indexes
3. Seed sample data (users, products, customers, price history)

### init_db.py
Initialize database indexes only (without seeding data).

**Usage:**
```bash
cd backend
python scripts/init_db.py
```

### seed_data.py
Seed sample data only (assumes indexes are already created).

**Usage:**
```bash
cd backend
python scripts/seed_data.py
```

## Sample Data

The seeding script creates:

- **Users**: 2 users (admin and staff)
- **Products**: 9 sample jewelry products across different categories
- **Customers**: 3 sample customers
- **Price History**: 90 days of gold and silver price data
- **Diamond Prices**: Sample diamond price data for various combinations of 4Cs

## Default Credentials

After running the setup script, you can login with:

- **Admin User**
  - Username: `admin`
  - Password: `admin123`

- **Staff User**
  - Username: `staff`
  - Password: `staff123`

⚠️ **Important**: Change these default passwords in production!

## Requirements

Make sure MongoDB is running and the `MONGODB_URI` environment variable is set correctly in your `.env` file.

## Troubleshooting

If you encounter connection errors:
1. Verify MongoDB is running: `mongod --version`
2. Check your `.env` file has the correct `MONGODB_URI`
3. Ensure the database user has proper permissions

If you need to reset the database:
1. Drop the database in MongoDB
2. Run `setup_db.py` again to recreate everything
