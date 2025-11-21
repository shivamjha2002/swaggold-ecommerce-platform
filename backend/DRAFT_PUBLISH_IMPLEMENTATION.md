# Product Draft/Publish System Implementation

## Overview
This document describes the implementation of the Product Draft/Publish system for the Swati Jewellers e-commerce platform.

## Changes Made

### 1. Product Model (`backend/app/models/product.py`)

#### New Fields Added:
- `status`: StringField with choices ['draft', 'published'], defaults to 'draft'
- `published_at`: DateTimeField to track when a product was published

#### New Methods Added:
- `publish()`: Sets status to 'published' and records timestamp
- `unpublish()`: Sets status to 'draft' and clears timestamp

#### Updated Methods:
- `to_dict()`: Now includes 'status' and 'published_at' fields in the output

#### New Indexes:
- Added index on 'status' field
- Added compound index on ['status', 'category', 'is_active']

### 2. Product Service (`backend/app/services/product_service.py`)

#### Updated Methods:
- `create_product()`: Now accepts 'status' field, defaults to 'draft'
- `update_product()`: Now handles 'status' field updates with automatic published_at management
- `get_products_with_filters()`: Now filters by status='published' for public access

#### New Methods:
- `get_admin_products_with_filters()`: Returns all products (draft + published) with status filter support
- `publish_product(product_id)`: Publishes a draft product
- `unpublish_product(product_id)`: Unpublishes a product back to draft

### 3. Product Routes (`backend/app/routes/products.py`)

#### Updated Endpoints:
- `GET /api/products/`: Now returns only published products (public endpoint)

#### New Endpoints:
- `GET /api/products/admin`: Returns all products including drafts (admin only, requires JWT + admin role)
  - Query params: page, per_page, category, status, min_price, max_price, min_weight, max_weight, search
  
- `POST /api/products/<product_id>/publish`: Publishes a draft product (admin only)
  - Returns: Updated product with status='published'
  
- `POST /api/products/<product_id>/unpublish`: Unpublishes a product (admin only)
  - Returns: Updated product with status='draft'

### 4. Database Migration Script (`backend/scripts/migrate_product_status.py`)

Created a migration script to:
- Set all existing products to 'published' status
- Set published_at to the product's created_at timestamp
- Provides interactive confirmation before running
- Displays migration progress and summary

#### Usage:
```bash
cd backend
python scripts/migrate_product_status.py
```

### 5. Updated Tests (`backend/test_products.py`)

Updated all existing product tests to:
- Create products with status='published' for tests that query the public endpoint
- Verify that new products default to 'draft' status
- Ensure backward compatibility with existing functionality

## API Examples

### Create a Draft Product
```bash
POST /api/products/
Content-Type: application/json

{
  "name": "Gold Ring",
  "category": "Ring",
  "base_price": 15000,
  "weight": 5.0
}

Response:
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Gold Ring",
    "status": "draft",
    "published_at": null,
    ...
  }
}
```

### Create a Published Product
```bash
POST /api/products/
Content-Type: application/json

{
  "name": "Gold Ring",
  "category": "Ring",
  "base_price": 15000,
  "weight": 5.0,
  "status": "published"
}
```

### Get All Products (Admin)
```bash
GET /api/products/admin?status=draft
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

### Publish a Product
```bash
POST /api/products/<product_id>/publish
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "data": {
    "id": "...",
    "status": "published",
    "published_at": "2025-11-14T10:30:00",
    ...
  },
  "message": "Product published successfully"
}
```

### Unpublish a Product
```bash
POST /api/products/<product_id>/unpublish
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "data": {
    "id": "...",
    "status": "draft",
    "published_at": null,
    ...
  },
  "message": "Product unpublished successfully"
}
```

## Security

All admin endpoints are protected with:
1. `@jwt_required()`: Ensures valid JWT token is present
2. `@admin_required`: Ensures user has admin role

## Backward Compatibility

- Existing products will need to be migrated using the migration script
- The public endpoint now filters by status='published', so draft products are hidden
- All existing functionality remains intact
- Tests have been updated to work with the new status field

## Database Indexes

New indexes have been added for optimal query performance:
- Single index on `status`
- Compound index on `(status, category, is_active)`

These indexes will improve performance for:
- Filtering products by status
- Admin queries that combine status with other filters
- Public queries that filter published products

## Next Steps

1. Run the migration script to update existing products
2. Update frontend to use new endpoints and handle status field
3. Implement UI for draft/publish workflow in admin panel
4. Test the complete flow end-to-end
