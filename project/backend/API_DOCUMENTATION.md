# Swati Jewellers API Documentation

## Base URL

```
Development: http://localhost:5000/api
Production: https://api.swatijewellers.com/api
```

## Authentication

Most admin endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Getting a Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

## Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Error description",
    "details": { ... }
  }
}
```

## Products API

### List Published Products (Public)

Get all published products visible to public users.

```http
GET /api/products
```

**Query Parameters:**
- `category` (optional): Filter by category (rings, necklaces, earrings, etc.)
- `search` (optional): Search in product name and description
- `min_price` (optional): Minimum price filter
- `max_price` (optional): Maximum price filter
- `page` (optional, default: 1): Page number
- `per_page` (optional, default: 20): Items per page

**Example Request:**
```http
GET /api/products?category=rings&page=1&per_page=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Gold Ring",
        "category": "rings",
        "base_price": 25000,
        "weight": 5.5,
        "gold_purity": "916",
        "description": "Beautiful gold ring",
        "image_url": "https://example.com/image.jpg",
        "stock_quantity": 10,
        "status": "published",
        "published_at": "2025-11-15T10:30:00Z",
        "is_active": true,
        "created_at": "2025-11-10T08:00:00Z"
      }
    ],
    "total": 45,
    "page": 1,
    "pages": 5
  }
}
```

### List All Products (Admin)

Get all products including drafts. Requires authentication.

```http
GET /api/products/admin
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (draft, published, all)
- `category` (optional): Filter by category
- `search` (optional): Search in product name and description
- `page` (optional, default: 1): Page number
- `per_page` (optional, default: 20): Items per page

**Example Request:**
```http
GET /api/products/admin?status=draft&page=1
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response:** Same format as public products list, but includes draft products.

### Get Product Details

Get details of a specific product.

```http
GET /api/products/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Gold Ring",
    "category": "rings",
    "base_price": 25000,
    "weight": 5.5,
    "gold_purity": "916",
    "description": "Beautiful gold ring",
    "image_url": "https://example.com/image.jpg",
    "stock_quantity": 10,
    "status": "published",
    "published_at": "2025-11-15T10:30:00Z",
    "is_active": true,
    "created_at": "2025-11-10T08:00:00Z",
    "updated_at": "2025-11-15T10:30:00Z"
  }
}
```

### Create Product (Admin)

Create a new product. Requires authentication.

```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Diamond Necklace",
  "category": "necklaces",
  "base_price": 150000,
  "weight": 25.5,
  "gold_purity": "916",
  "description": "Elegant diamond necklace",
  "image_url": "https://example.com/necklace.jpg",
  "stock_quantity": 3,
  "status": "draft"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Diamond Necklace",
    "status": "draft",
    ...
  }
}
```

### Update Product (Admin)

Update an existing product. Requires authentication.

```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "base_price": 155000,
  "stock_quantity": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Diamond Necklace",
    "base_price": 155000,
    "stock_quantity": 5,
    ...
  }
}
```

### Publish Product (Admin)

Publish a draft product to make it visible to public users. Requires authentication.

```http
POST /api/products/:id/publish
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Diamond Necklace",
    "status": "published",
    "published_at": "2025-11-15T12:00:00Z",
    ...
  }
}
```

### Unpublish Product (Admin)

Unpublish a product to hide it from public users. Requires authentication.

```http
POST /api/products/:id/unpublish
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Diamond Necklace",
    "status": "draft",
    "published_at": null,
    ...
  }
}
```

### Delete Product (Admin)

Soft delete a product. Requires authentication.

```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

## Orders API

All order endpoints require admin authentication.

### List Orders

Get all orders with pagination and filtering.

```http
GET /api/orders
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `per_page` (optional, default: 20): Items per page
- `status` (optional): Filter by status (pending, processing, completed, cancelled)
- `date_from` (optional): Start date (ISO format: 2025-11-01)
- `date_to` (optional): End date (ISO format: 2025-11-30)
- `search` (optional): Search by customer name or order number

**Example Request:**
```http
GET /api/orders?status=pending&page=1&per_page=10
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "507f1f77bcf86cd799439013",
        "order_number": "ORD-20251115-001",
        "customer_id": "507f1f77bcf86cd799439014",
        "customer_name": "John Doe",
        "customer_phone": "+91-9876543210",
        "customer_email": "john@example.com",
        "items": [
          {
            "product_id": "507f1f77bcf86cd799439011",
            "product_name": "Gold Ring",
            "quantity": 2,
            "unit_price": 25000,
            "total_price": 50000
          }
        ],
        "subtotal": 50000,
        "tax_amount": 2500,
        "total_amount": 52500,
        "status": "pending",
        "payment_status": "unpaid",
        "created_at": "2025-11-15T10:00:00Z",
        "updated_at": "2025-11-15T10:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "pages": 3
  }
}
```

### Get Order Details

Get complete details of a specific order.

```http
GET /api/orders/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "order_number": "ORD-20251115-001",
    "customer_id": "507f1f77bcf86cd799439014",
    "customer_name": "John Doe",
    "customer_phone": "+91-9876543210",
    "customer_email": "john@example.com",
    "items": [
      {
        "product_id": "507f1f77bcf86cd799439011",
        "product_name": "Gold Ring",
        "quantity": 2,
        "unit_price": 25000,
        "total_price": 50000
      }
    ],
    "subtotal": 50000,
    "tax_amount": 2500,
    "total_amount": 52500,
    "status": "pending",
    "payment_status": "unpaid",
    "notes": "Customer requested gift wrapping",
    "admin_notes": "Priority order",
    "created_at": "2025-11-15T10:00:00Z",
    "updated_at": "2025-11-15T10:00:00Z",
    "completed_at": null
  }
}
```

### Create Order

Create a new order.

```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer_id": "507f1f77bcf86cd799439014",
  "customer_name": "John Doe",
  "customer_phone": "+91-9876543210",
  "customer_email": "john@example.com",
  "items": [
    {
      "product_id": "507f1f77bcf86cd799439011",
      "product_name": "Gold Ring",
      "quantity": 2,
      "unit_price": 25000,
      "total_price": 50000
    }
  ],
  "subtotal": 50000,
  "tax_amount": 2500,
  "total_amount": 52500,
  "payment_status": "unpaid",
  "notes": "Customer requested gift wrapping"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "order_number": "ORD-20251115-001",
    "status": "pending",
    ...
  }
}
```

### Update Order Status

Update the status of an order.

```http
PUT /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "processing"
}
```

**Valid Status Values:**
- `pending`: Order received, awaiting processing
- `processing`: Order being prepared/fulfilled
- `completed`: Order successfully completed
- `cancelled`: Order cancelled

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "order_number": "ORD-20251115-001",
    "status": "processing",
    "updated_at": "2025-11-15T11:00:00Z",
    ...
  }
}
```

### Add Order Notes

Add or update notes for an order.

```http
PUT /api/orders/:id/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Customer called to confirm delivery address",
  "admin_notes": "Deliver between 2-4 PM"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "notes": "Customer called to confirm delivery address",
    "admin_notes": "Deliver between 2-4 PM",
    ...
  }
}
```

## Analytics API

### Get Dashboard Analytics

Get comprehensive analytics data for the admin dashboard.

```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

**Query Parameters:**
- `date_from` (optional): Start date for analytics period
- `date_to` (optional): End date for analytics period

**Response:**
```json
{
  "success": true,
  "data": {
    "total_revenue": 1250000,
    "total_orders": 45,
    "average_order_value": 27777.78,
    "conversion_rate": 3.5,
    "product_stats": {
      "total_products": 120,
      "published_products": 95,
      "draft_products": 25
    },
    "order_stats": {
      "pending": 5,
      "processing": 8,
      "completed": 30,
      "cancelled": 2
    },
    "top_products": [
      {
        "product_id": "507f1f77bcf86cd799439011",
        "product_name": "Gold Ring",
        "sales_count": 25,
        "revenue": 625000
      }
    ],
    "sales_trend": [
      {
        "date": "2025-11-01",
        "revenue": 50000,
        "orders": 3
      }
    ]
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Database or service down |

## Rate Limiting

Currently no rate limiting is implemented. In production, consider implementing rate limiting to prevent abuse.

## Pagination

All list endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

Pagination response includes:
- `total`: Total number of items
- `page`: Current page number
- `pages`: Total number of pages

## Best Practices

1. **Always use HTTPS in production**
2. **Store JWT tokens securely** (httpOnly cookies or secure storage)
3. **Implement token refresh** for long-lived sessions
4. **Handle errors gracefully** on the client side
5. **Use pagination** for large datasets
6. **Cache responses** where appropriate
7. **Validate input** on both client and server
8. **Log API errors** for debugging

## Support

For API support or questions, contact: support@swatijewellers.com
