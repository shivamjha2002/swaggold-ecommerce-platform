"""Test export endpoints."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app import create_app
from app.models.customer import Customer
from app.models.sale import Sale
from app.models.khata import KhataTransaction
from datetime import datetime, timedelta
import json


def test_sales_export():
    """Test sales export endpoint."""
    app = create_app('testing')
    
    with app.app_context():
        client = app.test_client()
        
        # Test without date filters
        response = client.get('/api/analytics/sales')
        print(f"\n=== Sales Export (All) ===")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = json.loads(response.data)
            print(f"Success: {data.get('success')}")
            print(f"Count: {data.get('count')}")
            if data.get('data'):
                print(f"Sample: {data['data'][0] if data['data'] else 'No data'}")
        else:
            print(f"Error: {response.data}")
        
        # Test with date filters
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        response = client.get(
            f'/api/analytics/sales?start_date={start_date.date()}&end_date={end_date.date()}'
        )
        print(f"\n=== Sales Export (Last 30 Days) ===")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = json.loads(response.data)
            print(f"Success: {data.get('success')}")
            print(f"Count: {data.get('count')}")


def test_customers_export():
    """Test customers export endpoint."""
    app = create_app('testing')
    
    with app.app_context():
        client = app.test_client()
        
        response = client.get('/api/customers')
        print(f"\n=== Customers Export ===")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = json.loads(response.data)
            print(f"Success: {data.get('success')}")
            print(f"Total: {data.get('pagination', {}).get('total')}")
            if data.get('data'):
                print(f"Sample: {data['data'][0] if data['data'] else 'No data'}")
        else:
            print(f"Error: {response.data}")


def test_khata_export():
    """Test khata transactions export endpoint."""
    app = create_app('testing')
    
    with app.app_context():
        client = app.test_client()
        
        # Test without date filters
        response = client.get('/api/khata/transactions')
        print(f"\n=== Khata Export (All) ===")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = json.loads(response.data)
            print(f"Success: {data.get('success')}")
            print(f"Total: {data.get('pagination', {}).get('total')}")
            if data.get('data'):
                print(f"Sample: {data['data'][0] if data['data'] else 'No data'}")
        else:
            print(f"Error: {response.data}")
        
        # Test with date filters
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        response = client.get(
            f'/api/khata/transactions?start_date={start_date.date()}&end_date={end_date.date()}'
        )
        print(f"\n=== Khata Export (Last 30 Days) ===")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = json.loads(response.data)
            print(f"Success: {data.get('success')}")
            print(f"Total: {data.get('pagination', {}).get('total')}")


if __name__ == '__main__':
    print("Testing Export Endpoints...")
    print("=" * 50)
    
    test_sales_export()
    test_customers_export()
    test_khata_export()
    
    print("\n" + "=" * 50)
    print("Export tests completed!")
