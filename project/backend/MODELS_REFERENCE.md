# Models Reference Guide

Quick reference for all database models in the Swati Jewellers application.

---

## Product Model

**Collection:** `products`

### Fields:
- `name` (String, required) - Product name
- `category` (String, required) - Category (Nath, Pendant Set, Tika, etc.)
- `base_price` (Float, required) - Base price in INR
- `weight` (Float, required) - Weight in grams
- `gold_purity` (String) - Purity level (916, 750, 585)
- `description` (String) - Product description
- `image_url` (String) - Image URL
- `stock_quantity` (Integer) - Available stock
- `is_active` (Boolean) - Active status
- `created_at` (DateTime) - Creation timestamp
- `updated_at` (DateTime) - Last update timestamp

### Methods:
- `calculate_current_price(current_gold_rate=None)` - Calculate current price based on gold rate
- `to_dict(include_current_price=False)` - Convert to dictionary

### Indexes:
- category, is_active, base_price, weight

---

## Customer Model

**Collection:** `customers`

### Fields:
- `name` (String, required) - Customer name
- `phone` (String, required, unique) - Phone number
- `email` (String) - Email address
- `address` (String) - Physical address
- `current_balance` (Float) - Current balance (+ = owes, - = credit)
- `created_at` (DateTime) - Creation timestamp
- `updated_at` (DateTime) - Last update timestamp

### Methods:
- `update_balance(amount, transaction_type)` - Update balance atomically
- `get_balance_status()` - Get human-readable balance status
- `to_dict()` - Convert to dictionary

### Indexes:
- phone (unique), email, current_balance, name

---

## KhataTransaction Model

**Collection:** `khata_transactions`

### Fields:
- `customer` (Reference) - Customer reference
- `transaction_type` (String, required) - 'credit' or 'debit'
- `amount` (Float, required) - Transaction amount
- `balance_after` (Float, required) - Balance after transaction
- `description` (String) - Transaction description
- `payment_method` (String) - Payment method (cash, upi, card, etc.)
- `reference_number` (String) - Reference number
- `created_at` (DateTime) - Transaction timestamp
- `created_by` (String) - Admin who created transaction

### Methods:
- `to_dict()` - Convert to dictionary
- `get_customer_transactions(customer_id, limit, skip)` - Get paginated transactions
- `get_transaction_summary(customer_id)` - Get summary statistics

### Indexes:
- customer, created_at (desc), transaction_type

---

## Sale Model

**Collection:** `sales`

### Fields:
- `customer` (Reference) - Customer reference
- `products` (List[Dict]) - List of products sold
- `total_amount` (Float, required) - Total before discount
- `discount` (Float) - Discount amount
- `final_amount` (Float, required) - Final amount after discount
- `payment_status` (String) - 'paid', 'partial', or 'pending'
- `payment_method` (String) - Payment method
- `notes` (String) - Additional notes
- `created_at` (DateTime) - Sale timestamp
- `created_by` (String) - Admin who created sale

### Methods:
- `calculate_totals()` - Calculate total from products
- `apply_discount(discount_amount, discount_percentage)` - Apply discount
- `to_dict()` - Convert to dictionary
- `get_sales_summary(start_date, end_date)` - Get sales statistics

### Indexes:
- customer, created_at (desc), payment_status

---

## PriceHistory Model

**Collection:** `price_history`

### Fields:
- `metal_type` (String, required) - 'gold', 'silver', or 'platinum'
- `purity` (String) - Purity level (e.g., '916', '999')
- `price_per_gram` (Float, required) - Price per gram
- `currency` (String) - Currency code (default: INR)
- `date` (DateTime, required) - Price date
- `source` (String) - Data source

### Methods:
- `to_dict()` - Convert to dictionary
- `get_latest_price(metal_type, purity)` - Get latest price
- `get_price_trend(metal_type, purity, days)` - Get price trend

### Indexes:
- (metal_type, date), date, (metal_type, purity, date)

---

## DiamondPriceHistory Model

**Collection:** `diamond_price_history`

### Fields:
- `carat` (Float, required) - Diamond weight in carats
- `cut` (String, required) - Cut quality (Ideal, Excellent, etc.)
- `color` (String, required) - Color grade (D, E, F, etc.)
- `clarity` (String, required) - Clarity grade (FL, IF, VVS1, etc.)
- `price` (Float, required) - Diamond price
- `currency` (String) - Currency code (default: INR)
- `date` (DateTime, required) - Price date
- `source` (String) - Data source

### Methods:
- `to_dict()` - Convert to dictionary
- `get_similar_diamonds(carat, cut, color, clarity, tolerance)` - Find similar diamonds

### Indexes:
- date, (carat, cut, color, clarity), (cut, color, clarity, date)

---

## TrainingLog Model

**Collection:** `training_logs`

### Fields:
- `model_name` (String, required) - ML model name
- `metrics` (Dict) - Training metrics (R2, RMSE, etc.)
- `data_points` (Integer) - Number of training data points
- `trained_at` (DateTime) - Training timestamp
- `model_version` (String) - Model version
- `notes` (String) - Additional notes

### Methods:
- `to_dict()` - Convert to dictionary

### Indexes:
- (model_name, trained_at), trained_at

---

## User Model

**Collection:** `users`

### Fields:
- `username` (String, required, unique) - Username
- `email` (String, required, unique) - Email address
- `password_hash` (String, required) - Hashed password
- `role` (String) - 'admin' or 'staff'
- `is_active` (Boolean) - Active status
- `created_at` (DateTime) - Creation timestamp
- `last_login` (DateTime) - Last login timestamp

### Methods:
- `set_password(password)` - Hash and set password
- `check_password(password)` - Verify password
- `update_last_login()` - Update last login timestamp
- `to_dict(include_sensitive)` - Convert to dictionary
- `authenticate(username, password)` - Authenticate user

### Indexes:
- username (unique), email (unique), role, is_active

---

## Usage Examples

### Create a Product:
```python
from app.models import Product

product = Product(
    name="Gold Necklace",
    category="Necklace",
    base_price=150000,
    weight=10.5,
    gold_purity="916",
    stock_quantity=5
)
product.save()

# Calculate current price
current_price = product.calculate_current_price()
```

### Create a Customer:
```python
from app.models import Customer

customer = Customer(
    name="John Doe",
    phone="+919876543210",
    email="john@example.com"
)
customer.save()
```

### Record a Khata Transaction:
```python
from app.models import KhataTransaction, Customer

customer = Customer.objects(phone="+919876543210").first()

# Customer makes a purchase (debit)
transaction = KhataTransaction(
    customer=customer,
    transaction_type="debit",
    amount=50000,
    description="Purchase of gold necklace",
    payment_method="khata"
)
transaction.balance_after = customer.update_balance(50000, "debit")
transaction.save()
```

### Create a User:
```python
from app.models import User

user = User(
    username="admin",
    email="admin@example.com",
    role="admin"
)
user.set_password("secure_password")
user.save()

# Authenticate
authenticated_user = User.authenticate("admin", "secure_password")
```

### Query Price History:
```python
from app.models import PriceHistory

# Get latest gold price
latest_price = PriceHistory.get_latest_price('gold', '916')

# Get 30-day trend
trend = PriceHistory.get_price_trend('gold', '916', days=30)
```

---

## Important Notes

1. **Balance Convention**: In Customer model, positive balance means customer owes money, negative means store owes money.

2. **Transaction Types**: 
   - `debit` = customer owes more (purchase)
   - `credit` = customer pays (payment)

3. **Password Security**: Always use `set_password()` method, never store plain text passwords.

4. **Indexes**: All models have appropriate indexes for performance. Run `ensure_indexes()` after model changes.

5. **Timestamps**: `created_at` and `updated_at` are managed automatically.

6. **References**: Use mongoengine's `ReferenceField` for relationships between models.
