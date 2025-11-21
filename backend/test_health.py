"""Test health check endpoint."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
import json

def test_health_check():
    """Test the health check endpoint."""
    app = create_app('development')
    client = app.test_client()
    
    response = client.get('/api/health')
    
    print(f'Status Code: {response.status_code}')
    print(f'Response:')
    print(json.dumps(response.get_json(), indent=2))
    
    # Verify response structure
    data = response.get_json()
    assert 'status' in data
    assert 'version' in data
    assert 'timestamp' in data
    assert 'checks' in data
    assert 'database' in data['checks']
    assert 'ml_models' in data['checks']
    
    print('\n✓ Health check endpoint working correctly!')

if __name__ == '__main__':
    test_health_check()
