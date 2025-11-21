"""Test analytics endpoints."""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app import create_app
from app.models.customer import Customer
from app.models.sale import Sale
from app.models.product import Product
from datetime import datetime, timedelta


def test_analytics_endpoint():
    """Test the analytics dashboard endpoint."""
    app = create_app('development')
    
    with app.test_client() as client:
        # Test analytics endpoint
        response = client.get('/api/analytics/dashboard')
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.get_json()}")
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'data' in data
        assert 'summary' in data['data']
        assert 'sales_analytics' in data['data']
        assert 'top_selling_products' in data['data']
        assert 'khata_summary' in data['data']
        assert 'recent_sales' in data['data']
        
        print("✓ Analytics dashboard endpoint works correctly")


def test_sales_trend_endpoint():
    """Test the sales trend endpoint."""
    app = create_app('development')
    
    with app.test_client() as client:
        # Test sales trend endpoint
        response = client.get('/api/analytics/sales-trend?months=6')
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.get_json()}")
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True
        assert 'data' in data
        assert isinstance(data['data'], list)
        
        print("✓ Sales trend endpoint works correctly")


if __name__ == '__main__':
    print("Testing Analytics Endpoints...")
    print("-" * 50)
    
    try:
        test_analytics_endpoint()
        print()
        test_sales_trend_endpoint()
        print()
        print("=" * 50)
        print("All analytics tests passed! ✓")
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
