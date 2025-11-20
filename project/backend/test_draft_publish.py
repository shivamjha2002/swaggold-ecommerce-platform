"""Test script for draft/publish functionality."""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.models.product import Product
from app.services.product_service import ProductService
from datetime import datetime


def test_draft_publish():
    """Test the draft/publish functionality."""
    print("=" * 60)
    print("Testing Product Draft/Publish System")
    print("=" * 60)
    
    # Test 1: Create product with default status (draft)
    print("\n1. Testing product creation with default status...")
    product_data = {
        'name': 'Test Product',
        'category': 'Ring',
        'base_price': 10000,
        'weight': 5.0
    }
    product = ProductService.create_product(product_data)
    assert product.status == 'draft', f"Expected status 'draft', got '{product.status}'"
    assert product.published_at is None, "Expected published_at to be None for draft"
    print("✓ Product created with status 'draft'")
    
    # Test 2: Publish product
    print("\n2. Testing publish method...")
    product.publish()
    assert product.status == 'published', f"Expected status 'published', got '{product.status}'"
    assert product.published_at is not None, "Expected published_at to be set"
    print(f"✓ Product published at {product.published_at}")
    
    # Test 3: Unpublish product
    print("\n3. Testing unpublish method...")
    product.unpublish()
    assert product.status == 'draft', f"Expected status 'draft', got '{product.status}'"
    assert product.published_at is None, "Expected published_at to be None after unpublish"
    print("✓ Product unpublished back to draft")
    
    # Test 4: Create product with explicit status
    print("\n4. Testing product creation with explicit status...")
    published_data = {
        'name': 'Published Product',
        'category': 'Necklace',
        'base_price': 20000,
        'weight': 10.0,
        'status': 'published'
    }
    published_product = ProductService.create_product(published_data)
    assert published_product.status == 'published', "Expected status 'published'"
    print("✓ Product created with status 'published'")
    
    # Test 5: Test to_dict includes new fields
    print("\n5. Testing to_dict method...")
    product_dict = product.to_dict()
    assert 'status' in product_dict, "Expected 'status' in product dict"
    assert 'published_at' in product_dict, "Expected 'published_at' in product dict"
    print("✓ Product dict includes status and published_at fields")
    
    # Test 6: Test service methods
    print("\n6. Testing service publish/unpublish methods...")
    result = ProductService.publish_product(str(product.id))
    assert result is not None, "Expected publish_product to return product"
    assert result.status == 'published', "Expected status 'published'"
    
    result = ProductService.unpublish_product(str(product.id))
    assert result is not None, "Expected unpublish_product to return product"
    assert result.status == 'draft', "Expected status 'draft'"
    print("✓ Service methods work correctly")
    
    print("\n" + "=" * 60)
    print("All tests passed! ✓")
    print("=" * 60)


if __name__ == '__main__':
    try:
        test_draft_publish()
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
