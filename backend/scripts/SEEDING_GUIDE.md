# Data Seeding Guide

This guide explains how to use the data seeding scripts to populate historical price data for ML model training.

## Overview

The prediction functionality requires historical price data to train ML models. These scripts generate realistic sample data for:
- **Gold prices**: Daily price data with realistic volatility and trends
- **Diamond prices**: Price data based on the 4Cs (Carat, Cut, Color, Clarity)

## Prerequisites

1. MongoDB must be running and accessible
2. Python environment with required dependencies installed
3. `.env` file configured with `MONGODB_URI`

## Scripts

### 1. Gold Price Seeding (`seed_gold_prices.py`)

Generates historical gold price data using a random walk algorithm with seasonal patterns.

**Basic Usage:**
```bash
python scripts/seed_gold_prices.py
```

**Options:**
```bash
# Seed 180 days of data
python scripts/seed_gold_prices.py --days 180

# Start at a different base price
python scripts/seed_gold_prices.py --base-price 6000

# Adjust volatility (higher = more price variation)
python scripts/seed_gold_prices.py --volatility 0.03

# Clear existing seeded data before inserting
python scripts/seed_gold_prices.py --clear

# Combine options
python scripts/seed_gold_prices.py --days 180 --base-price 6000 --volatility 0.03 --clear
```

**Parameters:**
- `--days`: Number of days of historical data (default: 90)
- `--base-price`: Starting price per gram in INR (default: 5500.0)
- `--volatility`: Daily price volatility as decimal (default: 0.02 = 2%)
- `--clear`: Clear existing seeded data before inserting

### 2. Diamond Price Seeding (`seed_diamond_prices.py`)

Generates diamond price data with diverse combinations of the 4Cs.

**Basic Usage:**
```bash
python scripts/seed_diamond_prices.py
```

**Options:**
```bash
# Generate 200 diamond records
python scripts/seed_diamond_prices.py --count 200

# Spread records over 180 days
python scripts/seed_diamond_prices.py --days 180

# Clear existing seeded data before inserting
python scripts/seed_diamond_prices.py --clear

# Combine options
python scripts/seed_diamond_prices.py --count 200 --days 180 --clear
```

**Parameters:**
- `--count`: Number of diamond records to generate (default: 100)
- `--days`: Spread records over this many days (default: 90)
- `--clear`: Clear existing seeded data before inserting

### 3. Data Verification (`verify_seeded_data.py`)

Verifies that data was inserted correctly and provides statistics.

**Usage:**
```bash
python scripts/verify_seeded_data.py
```

This script will:
- Check for gold and diamond price records
- Display date coverage and statistics
- Identify any data gaps
- Verify grade diversity for diamonds
- Provide recommendations for next steps

## Quick Start

To set up the complete dataset for ML training:

```bash
# 1. Seed gold price data (90 days)
python scripts/seed_gold_prices.py

# 2. Seed diamond price data (100 records)
python scripts/seed_diamond_prices.py

# 3. Verify the data
python scripts/verify_seeded_data.py

# 4. Train the models
python scripts/train_models.py all

# 5. Restart the backend server
python run.py
```

## Data Characteristics

### Gold Prices
- **Metal Type**: Gold (916 purity / 22 karat)
- **Price Range**: Typically ₹3,850 - ₹7,150 per gram
- **Volatility**: 2% daily variation by default
- **Patterns**: Includes seasonal cycles and long-term trends
- **Source**: Marked as 'seeded' for easy identification

### Diamond Prices
- **Carat Range**: 0.3 to 3.0 carats (weighted towards smaller diamonds)
- **Cut Grades**: Ideal, Excellent, Very Good, Good, Fair
- **Color Grades**: D, E, F, G, H, I, J
- **Clarity Grades**: IF, VVS1, VVS2, VS1, VS2, SI1, SI2
- **Price Formula**: Based on carat² × quality multipliers × market variation
- **Source**: Marked as 'seeded' for easy identification

## Handling Duplicates

Both scripts handle duplicate entries gracefully:
- **Gold prices**: Updates existing records for the same date
- **Diamond prices**: Allows multiple records (diamonds can have same specs but different prices)

## Troubleshooting

### MongoDB Connection Error
```
✗ Failed to connect to MongoDB: ...
```
**Solution**: Ensure MongoDB is running and `MONGODB_URI` is correctly set in `.env`

### Import Errors
```
ModuleNotFoundError: No module named 'flask_cors'
```
**Solution**: Install dependencies: `pip install -r requirements.txt`

### Insufficient Data for Training
```
⚠ Limited grade diversity
```
**Solution**: Increase the count of diamond records: `--count 200`

## Minimum Requirements for Model Training

- **Gold Model**: Minimum 30 days of price data
- **Diamond Model**: Minimum 50 diamond records with diverse grades

For best results:
- **Gold**: 90+ days of data
- **Diamond**: 100+ records covering various 4C combinations

## Clearing Data

To start fresh:

```bash
# Clear and reseed gold prices
python scripts/seed_gold_prices.py --clear --days 90

# Clear and reseed diamond prices
python scripts/seed_diamond_prices.py --clear --count 100
```

## Next Steps

After seeding data:
1. Verify data with `verify_seeded_data.py`
2. Train models with `train_models.py`
3. Check model status via admin dashboard
4. Test prediction endpoints

## Notes

- Seeded data is marked with `source='seeded'` for easy identification
- Scripts are idempotent - safe to run multiple times
- Use `--clear` flag to remove old seeded data before generating new data
- All prices are in INR (Indian Rupees)
