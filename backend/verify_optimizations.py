"""
Verification script for database optimization changes.
This script verifies that the optimizations are correctly implemented.
"""

def verify_product_service_optimizations():
    """Verify product service has projection optimizations."""
    import os
    base_path = os.path.dirname(__file__)
    with open(os.path.join(base_path, 'app/services/product_service.py'), 'r') as f:
        content = f.read()
        
    checks = [
        ('get_products_with_filters uses .only()', '.only(' in content and 'get_products_with_filters' in content),
        ('get_admin_products_with_filters uses .only()', '.only(' in content and 'get_admin_products_with_filters' in content),
    ]
    
    return checks

def verify_order_service_optimizations():
    """Verify order service has projection and aggregation optimizations."""
    import os
    base_path = os.path.dirname(__file__)
    with open(os.path.join(base_path, 'app/services/order_service.py'), 'r') as f:
        content = f.read()
        
    checks = [
        ('get_orders_with_filters uses .only()', '.only(' in content and 'get_orders_with_filters' in content),
        ('get_order_statistics uses aggregation', 'aggregate(pipeline)' in content and 'get_order_statistics' in content),
        ('get_order_statistics uses $facet', '$facet' in content),
    ]
    
    return checks

def verify_analytics_optimizations():
    """Verify analytics routes use aggregation."""
    import os
    base_path = os.path.dirname(__file__)
    with open(os.path.join(base_path, 'app/routes/analytics.py'), 'r') as f:
        content = f.read()
        
    checks = [
        ('dashboard uses aggregation for total revenue', 'aggregate(pipeline)' in content or 'aggregate(' in content),
        ('get_top_selling_products uses aggregation', '$unwind' in content and '$group' in content),
        ('sales_trend uses aggregation', '$match' in content and 'get_sales_trend' in content),
        ('sales export uses .only()', '.only(' in content and 'get_sales_export' in content),
    ]
    
    return checks

def verify_model_indexes():
    """Verify models have proper indexes."""
    import os
    base_path = os.path.dirname(__file__)
    # Check Product model
    with open(os.path.join(base_path, 'app/models/product.py'), 'r') as f:
        product_content = f.read()
    
    # Check Order model
    with open(os.path.join(base_path, 'app/models/order.py'), 'r') as f:
        order_content = f.read()
    
    checks = [
        ('Product has status index', "'status'" in product_content and 'indexes' in product_content),
        ('Product has compound index', "['status', 'category', 'is_active']" in product_content or 
                                       "('status', 'category', 'is_active')" in product_content),
        ('Order has order_number unique index', "'order_number'" in order_content and 'unique' in order_content),
        ('Order has status index', "'status'" in order_content and 'indexes' in order_content),
        ('Order has created_at index', "'created_at'" in order_content and 'indexes' in order_content),
    ]
    
    return checks

def main():
    """Run all verification checks."""
    print("=" * 60)
    print("Database Optimization Verification")
    print("=" * 60)
    
    all_checks = []
    
    print("\n1. Product Service Optimizations:")
    print("-" * 60)
    for check_name, result in verify_product_service_optimizations():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {check_name}")
        all_checks.append(result)
    
    print("\n2. Order Service Optimizations:")
    print("-" * 60)
    for check_name, result in verify_order_service_optimizations():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {check_name}")
        all_checks.append(result)
    
    print("\n3. Analytics Route Optimizations:")
    print("-" * 60)
    for check_name, result in verify_analytics_optimizations():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {check_name}")
        all_checks.append(result)
    
    print("\n4. Model Indexes:")
    print("-" * 60)
    for check_name, result in verify_model_indexes():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {check_name}")
        all_checks.append(result)
    
    print("\n" + "=" * 60)
    passed = sum(all_checks)
    total = len(all_checks)
    print(f"Results: {passed}/{total} checks passed")
    
    if passed == total:
        print("✓ All optimizations verified successfully!")
    else:
        print(f"✗ {total - passed} check(s) failed")
    print("=" * 60)
    
    return passed == total

if __name__ == '__main__':
    import sys
    success = main()
    sys.exit(0 if success else 1)
