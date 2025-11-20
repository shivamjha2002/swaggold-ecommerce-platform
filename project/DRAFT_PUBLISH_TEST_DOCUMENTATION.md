# Draft/Publish Workflow Testing Documentation

## Task 13.1 - Test Product Draft/Publish Workflow

This document describes the comprehensive test suite for the product draft/publish workflow, covering all requirements from Task 13.1.

## Test Coverage

### 13.1.1 - Test Creating Products in Draft Status

**Backend Tests:**
- ✅ `test_create_product_default_draft_status` - Verifies products are created with draft status by default
- ✅ `test_create_product_explicit_draft_status` - Tests creating products with explicit draft status
- ✅ `test_create_product_published_status` - Tests creating products directly as published

**Frontend Tests:**
- ✅ `should create a product with default draft status` - Tests UI form creates draft products
- ✅ `should create a product with explicit draft status` - Tests explicit status selection

**Requirements Verified:**
- Products default to draft status when created
- Status field is properly stored and retrieved
- Draft products have `published_at` set to null

---

### 13.1.2 - Test Publishing and Unpublishing Products

**Backend Tests:**
- ✅ `test_publish_draft_product` - Tests publishing a draft product
- ✅ `test_unpublish_published_product` - Tests unpublishing a published product
- ✅ `test_toggle_publish_status_multiple_times` - Tests toggling status multiple times
- ✅ `test_publish_requires_authentication` - Verifies authentication is required
- ✅ `test_unpublish_requires_authentication` - Verifies authentication is required

**Frontend Tests:**
- ✅ `should publish a draft product` - Tests publish button functionality
- ✅ `should unpublish a published product` - Tests unpublish button functionality
- ✅ `should toggle product status multiple times` - Tests repeated status changes

**Requirements Verified:**
- Publish endpoint changes status from draft to published
- Unpublish endpoint changes status from published to draft
- `published_at` timestamp is set when publishing
- `published_at` is cleared when unpublishing
- Only admin users can publish/unpublish
- Status changes are persisted to database

---

### 13.1.3 - Verify Draft Products Are Hidden from Public

**Backend Tests:**
- ✅ `test_public_endpoint_excludes_draft_products` - Verifies public API excludes drafts
- ✅ `test_admin_endpoint_includes_all_products` - Verifies admin API includes all products
- ✅ `test_filter_products_by_status` - Tests status filtering in admin endpoint
- ✅ `test_draft_product_not_accessible_by_id` - Tests draft product access control

**Frontend Tests:**
- ✅ `should not display draft products on public homepage` - Verifies homepage shows only published
- ✅ `should display both draft and published products in admin dashboard` - Verifies admin sees all
- ✅ `should filter products by status in admin dashboard` - Tests status filter UI

**Requirements Verified:**
- Public product list (`/api/products`) only returns published products
- Admin product list (`/api/products/admin`) returns all products
- Status filter works correctly in admin interface
- Draft products are not visible to non-admin users
- Published products are visible to all users

---

### 13.1.4 - Test Bulk Publish/Unpublish Operations

**Backend Tests:**
- ✅ `test_bulk_publish_multiple_products` - Tests publishing multiple products
- ✅ `test_bulk_unpublish_multiple_products` - Tests unpublishing multiple products
- ✅ `test_bulk_operation_with_mixed_statuses` - Tests operations on mixed status products
- ✅ `test_bulk_operation_error_handling` - Tests error handling in bulk operations

**Frontend Tests:**
- ✅ `should handle bulk publish operation` - Tests UI bulk publish functionality
- ✅ `should handle bulk unpublish operation` - Tests UI bulk unpublish functionality
- ✅ `should show error when bulk operation fails` - Tests error handling in UI

**Requirements Verified:**
- Multiple products can be published in sequence
- Multiple products can be unpublished in sequence
- Bulk operations handle errors gracefully
- UI provides feedback during bulk operations
- Failed operations don't affect successful ones

---

### 13.1.5 - Status Indicators and UI Feedback

**Frontend Tests:**
- ✅ `should display draft badge for draft products` - Tests draft status indicator
- ✅ `should display published badge for published products` - Tests published status indicator
- ✅ `should show published date for published products` - Tests published date display

**Requirements Verified:**
- Draft products show clear visual indicators
- Published products show clear visual indicators
- Published date is displayed for published products
- Status badges are easily distinguishable

---

## Additional Test Coverage

### Data Integrity Tests
- ✅ `test_published_at_timestamp_accuracy` - Verifies timestamp accuracy
- ✅ `test_status_field_in_response` - Verifies status fields in API responses

### Error Handling Tests
- ✅ Authentication and authorization checks
- ✅ Invalid product ID handling
- ✅ Network error handling in frontend

---

## Running the Tests

### Backend Tests

#### Run all draft/publish tests:
```bash
cd backend
python run_draft_publish_tests.py
```

#### Run specific test files:
```bash
# Basic functionality tests
python test_draft_publish.py

# Comprehensive workflow tests
python test_draft_publish_workflow.py

# Product service tests (draft/publish related)
python -m pytest test_products.py -v -k "draft or publish"
```

#### Run with pytest:
```bash
python -m pytest test_draft_publish_workflow.py -v
```

### Frontend Tests

#### Run all frontend tests:
```bash
npm test
```

#### Run draft/publish tests specifically:
```bash
npm test -- draftPublish.test.tsx
```

#### Run with coverage:
```bash
npm test -- --coverage draftPublish.test.tsx
```

---

## Test Results Summary

### Expected Outcomes

All tests should pass with the following verifications:

1. **Draft Status Creation** ✅
   - Products default to draft status
   - Explicit status can be set during creation
   - Draft products have null published_at

2. **Publish/Unpublish Operations** ✅
   - Draft products can be published
   - Published products can be unpublished
   - Status changes persist correctly
   - Timestamps are accurate

3. **Access Control** ✅
   - Public API excludes draft products
   - Admin API includes all products
   - Authentication required for publish/unpublish

4. **Bulk Operations** ✅
   - Multiple products can be published/unpublished
   - Error handling works correctly
   - UI provides appropriate feedback

5. **UI Indicators** ✅
   - Status badges display correctly
   - Published dates show for published products
   - Visual distinction between statuses

---

## Test Data

### Sample Draft Product
```json
{
  "name": "Test Draft Product",
  "category": "Ring",
  "base_price": 10000,
  "weight": 5.0,
  "gold_purity": 916,
  "status": "draft",
  "published_at": null
}
```

### Sample Published Product
```json
{
  "name": "Test Published Product",
  "category": "Necklace",
  "base_price": 15000,
  "weight": 8.0,
  "gold_purity": 916,
  "status": "published",
  "published_at": "2024-01-15T10:30:00Z"
}
```

---

## API Endpoints Tested

### Public Endpoints
- `GET /api/products` - List published products only
- `GET /api/products/:id` - Get single product

### Admin Endpoints (Authentication Required)
- `GET /api/products/admin` - List all products (including drafts)
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `POST /api/products/:id/publish` - Publish draft product
- `POST /api/products/:id/unpublish` - Unpublish published product

---

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure JWT token is valid
   - Check admin role is properly set
   - Verify token is included in Authorization header

2. **Database Connection Issues**
   - Ensure MongoDB is running
   - Check database connection string
   - Verify test database is accessible

3. **Test Failures**
   - Clear test data between runs
   - Check for timing issues in async operations
   - Verify mock data matches expected format

### Debug Mode

Run tests with verbose output:
```bash
# Backend
python -m pytest test_draft_publish_workflow.py -v -s

# Frontend
npm test -- --verbose draftPublish.test.tsx
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Draft/Publish Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Backend Tests
        run: |
          cd backend
          python run_draft_publish_tests.py
      - name: Run Frontend Tests
        run: |
          npm test -- draftPublish.test.tsx
```

---

## Test Maintenance

### Adding New Tests

1. Add test function to appropriate test file
2. Follow naming convention: `test_<feature>_<scenario>`
3. Include docstring describing test purpose
4. Update this documentation

### Updating Tests

1. Review test coverage when adding new features
2. Update mock data to match schema changes
3. Ensure backward compatibility
4. Update documentation

---

## Requirements Traceability

| Requirement | Test Coverage | Status |
|-------------|---------------|--------|
| 1.1 - Draft status creation | 3 tests | ✅ Pass |
| 1.2 - Publish products | 5 tests | ✅ Pass |
| 1.3 - Unpublish products | 5 tests | ✅ Pass |
| 1.4 - Hide drafts from public | 4 tests | ✅ Pass |
| 1.5 - Bulk operations | 4 tests | ✅ Pass |
| 1.6 - UI indicators | 3 tests | ✅ Pass |

**Total Test Count:** 24+ comprehensive tests

---

## Conclusion

This test suite provides comprehensive coverage of the draft/publish workflow, ensuring:
- ✅ All requirements from Task 13.1 are tested
- ✅ Both backend and frontend functionality is verified
- ✅ Edge cases and error conditions are handled
- ✅ Data integrity is maintained
- ✅ User experience is validated

The tests can be run individually or as a complete suite, and are suitable for both local development and CI/CD pipelines.
