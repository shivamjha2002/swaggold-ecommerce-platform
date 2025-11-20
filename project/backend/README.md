# Swati Jewellers Backend

Flask REST API backend for Swati Jewellers e-commerce platform with ML-powered price prediction.

## Setup

### 1. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:
- `SECRET_KEY`: Flask secret key (generate with: `python -c "import secrets; print(secrets.token_hex(32))"`)
- `JWT_SECRET_KEY`: JWT secret key (generate with: `python -c "import secrets; print(secrets.token_hex(32))"`)
- `MONGODB_URI`: MongoDB connection string
- `CORS_ORIGINS`: Allowed CORS origins

For detailed environment configuration, see [ENVIRONMENT_CONFIGURATION.md](../ENVIRONMENT_CONFIGURATION.md)

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows (if installed as service)
net start MongoDB

# Linux
sudo systemctl start mongod

# Mac
brew services start mongodb-community
```

### 5. Run the Application

```bash
# Development mode
python run.py

# Or with Flask CLI
flask run
```

The API will be available at `http://localhost:5000`

## Project Structure

```
backend/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── config.py            # Configuration classes
│   ├── models/              # Database models
│   ├── routes/              # API blueprints
│   ├── services/            # Business logic
│   ├── ml/                  # ML models
│   └── utils/               # Utilities
├── models/                  # Saved ML models
├── data/                    # Training data
├── requirements.txt         # Python dependencies
├── run.py                   # Application entry point
└── .env                     # Environment variables
```

## API Endpoints

### Health Check
- `GET /api/health` - Check API health status

### Products

#### Public Endpoints
- `GET /api/products` - List published products (public)
  - Query params: `category`, `search`, `min_price`, `max_price`, `page`, `per_page`
  - Returns only products with `status='published'`
  
- `GET /api/products/:id` - Get product details
  - Returns product information including status

#### Admin Endpoints (Requires Authentication)
- `GET /api/products/admin` - List all products including drafts
  - Query params: `status` (draft/published/all), `category`, `search`, `page`, `per_page`
  - Returns all products regardless of status
  
- `POST /api/products` - Create product
  - Body: `name`, `category`, `base_price`, `weight`, `gold_purity`, `description`, `image_url`, `stock_quantity`, `status` (draft/published)
  - Default status: `draft`
  
- `PUT /api/products/:id` - Update product
  - Body: Any product fields to update
  
- `DELETE /api/products/:id` - Delete product
  - Soft delete by setting `is_active=false`
  
- `POST /api/products/:id/publish` - Publish a draft product
  - Changes status from `draft` to `published`
  - Sets `published_at` timestamp
  
- `POST /api/products/:id/unpublish` - Unpublish a product
  - Changes status from `published` to `draft`
  - Clears `published_at` timestamp

### Customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id/khata` - Get customer khata

### Khata
- `POST /api/khata/transactions` - Create transaction
- `GET /api/khata/summary` - Get summary

### Orders (Admin Only - Requires Authentication)

- `GET /api/orders` - List orders with pagination and filters
  - Query params: 
    - `page` (default: 1)
    - `per_page` (default: 20)
    - `status` (pending/processing/completed/cancelled)
    - `date_from` (ISO date string)
    - `date_to` (ISO date string)
    - `search` (customer name or order number)
  - Returns: `{ orders: [], total: number, page: number, pages: number }`
  
- `GET /api/orders/:id` - Get order details
  - Returns complete order information including items, customer, and status history
  
- `POST /api/orders` - Create new order
  - Body: 
    ```json
    {
      "customer_id": "string",
      "customer_name": "string",
      "customer_phone": "string",
      "customer_email": "string",
      "items": [
        {
          "product_id": "string",
          "product_name": "string",
          "quantity": number,
          "unit_price": number,
          "total_price": number
        }
      ],
      "subtotal": number,
      "tax_amount": number,
      "total_amount": number,
      "payment_status": "unpaid|partial|paid",
      "notes": "string"
    }
    ```
  - Generates unique order number automatically
  
- `PUT /api/orders/:id/status` - Update order status
  - Body: `{ "status": "pending|processing|completed|cancelled" }`
  - Updates `completed_at` timestamp when status changes to `completed`
  
- `PUT /api/orders/:id/notes` - Add notes to order
  - Body: `{ "notes": "string", "admin_notes": "string" }`

### Predictions
- `POST /api/predictions/gold` - Predict gold price
- `POST /api/predictions/diamond` - Predict diamond price
- `GET /api/predictions/trends` - Get price trends
- `POST /api/predictions/retrain` - Retrain models (admin)

### Authentication
- `POST /api/auth/login` - User login
  - Body: `{ "username": "string", "password": "string" }`
  - Returns: `{ "access_token": "string", "user": {...} }`
  
- `POST /api/auth/register` - User registration (admin)
  - Body: `{ "username": "string", "password": "string", "email": "string", "role": "admin|user" }`

## Development

### Running Tests

```bash
pytest
```

### Code Style

```bash
# Format code
black app/

# Lint code
flake8 app/
```

## Deployment

### Using Gunicorn

```bash
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

### Using Docker

```bash
docker build -t swati-jewellers-backend .
docker run -p 5000:5000 swati-jewellers-backend
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| FLASK_ENV | Environment (development/testing/production) | development | Yes |
| SECRET_KEY | Flask secret key | - | Yes |
| JWT_SECRET_KEY | JWT secret key | - | Yes |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/swati_jewellers_dev | Yes |
| CORS_ORIGINS | Allowed CORS origins (comma-separated) | * | Yes |
| PORT | Server port | 5000 | No |
| GUNICORN_WORKERS | Number of Gunicorn workers | 4 | No |
| GUNICORN_LOG_LEVEL | Gunicorn log level | info | No |

For complete environment configuration guide, see [ENVIRONMENT_CONFIGURATION.md](../ENVIRONMENT_CONFIGURATION.md)

## License

Proprietary - Swati Jewellers


## Docker Deployment

### Development with Docker

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Stop environment
docker-compose -f docker-compose.dev.yml down
```

### Production with Docker

```bash
# Create .env file from example
cp .env.example .env

# Edit .env with production values
# Update MONGO_ROOT_PASSWORD, JWT_SECRET_KEY, CORS_ORIGINS

# Start production environment
docker-compose up -d

# Initialize database (first time only)
docker-compose exec backend python scripts/init_db.py
docker-compose exec backend python scripts/seed_data.py

# Train ML models (first time only)
docker-compose exec backend python scripts/train_models.py

# View logs
docker-compose logs -f backend

# Stop environment
docker-compose down
```

### Using Makefile Commands

```bash
# Development
make dev-up          # Start development environment
make dev-down        # Stop development environment
make dev-logs        # View logs

# Production
make prod-up         # Start production environment
make prod-down       # Stop production environment
make prod-logs       # View logs

# Database
make init-db         # Initialize database
make seed-db         # Seed sample data
make backup          # Backup MongoDB
make restore         # Restore MongoDB

# ML Models
make train-models    # Train ML models

# Utilities
make health          # Check application health
make clean           # Remove all containers and volumes
```

## Production Configuration

### Gunicorn Settings

The application uses Gunicorn in production with the following default settings:
- Workers: CPU cores * 2 + 1
- Timeout: 120 seconds
- Worker class: sync
- Bind: 0.0.0.0:5000

Customize by editing `gunicorn.conf.py` or setting environment variables:
- `GUNICORN_WORKERS`: Number of worker processes
- `GUNICORN_LOG_LEVEL`: Log level (debug, info, warning, error, critical)

### Health Check

The `/api/health` endpoint provides comprehensive health information:

```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T10:30:00",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "message": "Database connection successful"
    },
    "ml_models": {
      "status": "healthy",
      "message": "All ML models available"
    }
  }
}
```

Status codes:
- `200`: All systems healthy
- `503`: System degraded (database or ML models unavailable)

### Security Considerations

1. **Change default passwords**: Update `MONGO_ROOT_PASSWORD` in production
2. **Secure JWT secret**: Generate random secret with `openssl rand -hex 32`
3. **Configure CORS**: Only allow trusted origins, never use `*` in production
4. **Use HTTPS**: Configure SSL certificates with reverse proxy
5. **Regular updates**: Keep dependencies and Docker images updated

### Monitoring

Monitor application health:
```bash
# Check health endpoint
curl http://localhost:5000/api/health

# View container stats
docker stats swati-jewellers-backend

# View logs
docker-compose logs -f backend
```

### Backup and Restore

Backup MongoDB:
```bash
make backup
# Or manually:
docker-compose exec mongodb mongodump --username admin --password <password> --authenticationDatabase admin --out /data/backup
```

Restore MongoDB:
```bash
make restore BACKUP_DIR=./backups/mongodb-backup-20251114-103000
# Or manually:
docker-compose exec mongodb mongorestore --username admin --password <password> --authenticationDatabase admin /data/backup
```

## Troubleshooting

### Database Connection Issues

```bash
# Check MongoDB status
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb

# Test connection
docker-compose exec backend python -c "from mongoengine import connect; connect(host='${MONGODB_URI}'); print('Connected!')"
```

### ML Models Not Found

```bash
# Train models
docker-compose exec backend python scripts/train_models.py

# Verify models exist
docker-compose exec backend ls -lh models/
```

### Port Already in Use

```bash
# Change port in docker-compose.yml
ports:
  - "5001:5000"  # Use port 5001 instead
```

For more detailed deployment instructions, see [DEPLOYMENT.md](../DEPLOYMENT.md) in the project root.

## New Features

### Product Draft/Publish Workflow

The system now supports a draft/publish workflow for products:

- **Draft Status**: Products can be created in draft mode, making them invisible to public users
- **Publish/Unpublish**: Admins can publish draft products or unpublish published products
- **Admin View**: Admins can view all products (draft + published) via `/api/products/admin`
- **Public View**: Public users only see published products via `/api/products`
- **Status Tracking**: Products track `status` field and `published_at` timestamp

**Use Cases:**
- Prepare product listings before making them live
- Temporarily hide products without deleting them
- Bulk manage product visibility

### Order Management System

Complete order management functionality for admins:

- **Order Creation**: Create orders with multiple items and customer information
- **Status Tracking**: Track orders through lifecycle (pending → processing → completed/cancelled)
- **Filtering & Search**: Filter orders by status, date range, and search by customer/order number
- **Order Details**: View complete order information including items, pricing, and timeline
- **Notes**: Add internal notes to orders for tracking
- **Pagination**: Efficient pagination for large order lists

**Order Statuses:**
- `pending`: New order awaiting processing
- `processing`: Order being prepared/fulfilled
- `completed`: Order successfully fulfilled
- `cancelled`: Order cancelled

### Enhanced Analytics

The admin dashboard now includes:
- Conversion rate tracking
- Draft vs published product counts
- Order status breakdown
- Average order value calculations
- Real-time data updates
- Export functionality for reports

### Database Optimizations

- Indexes on `Product.status`, `Order.status`, `Order.created_at`
- Compound indexes for common query patterns
- Optimized aggregation queries for analytics

## Migration Guide

### Migrating Existing Products

If you have existing products in your database, run the migration script to add the `status` field:

```bash
# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run migration
python backend/scripts/migrate_product_status.py
```

This script will:
- Add `status='published'` to all existing products
- Set `published_at` to the product's `created_at` timestamp
- Preserve all other product data

**Note:** Existing products are set to `published` by default to maintain current behavior.
