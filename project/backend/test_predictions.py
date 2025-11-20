"""Tests for Predictions API endpoints."""
import unittest
import json
from datetime import datetime, timedelta
from app import create_app
from app.models.price_history import PriceHistory, DiamondPriceHistory, TrainingLog
from app.ml.train import train_gold_model, train_diamond_model
from app.services.ml_service import ml_service
import pandas as pd


class TestPredictionsAPI(unittest.TestCase):
    """Test cases for Predictions API endpoints."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test client and database connection."""
        cls.app = create_app('testing')
        cls.client = cls.app.test_client()
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
    
    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests."""
        cls.app_context.pop()
    
    def setUp(self):
        """Set up before each test."""
        # Clear collections
        PriceHistory.drop_collection()
        DiamondPriceHistory.drop_collection()
        TrainingLog.drop_collection()
        
        # Create sample gold price history (60 days)
        base_date = datetime.utcnow() - timedelta(days=60)
        for i in range(60):
            PriceHistory(
                metal_type='gold',
                purity='916',
                price_per_gram=6000 + (i * 10) + (i % 5) * 20,  # Trending upward with variation
                date=base_date + timedelta(days=i),
                source='test'
            ).save()
        
        # Create sample diamond price history
        cuts = ['Ideal', 'Excellent', 'Very Good']
        colors = ['D', 'E', 'F', 'G']
        clarities = ['IF', 'VVS1', 'VS1', 'SI1']
        
        for i in range(60):
            DiamondPriceHistory(
                carat=1.0 + (i % 10) * 0.1,
                cut=cuts[i % len(cuts)],
                color=colors[i % len(colors)],
                clarity=clarities[i % len(clarities)],
                price=300000 + (i * 5000) + (i % 3) * 10000,
                date=base_date + timedelta(days=i),
                source='test'
            ).save()
        
        # Train models
        try:
            train_gold_model()
            train_diamond_model()
            ml_service.reload_models()
        except Exception as e:
            print(f"Warning: Model training failed in setUp: {str(e)}")
    
    def tearDown(self):
        """Clean up after each test."""
        PriceHistory.drop_collection()
        DiamondPriceHistory.drop_collection()
        TrainingLog.drop_collection()
    
    def test_predict_gold_price_success(self):
        """Test gold price prediction with valid data."""
        future_date = (datetime.utcnow() + timedelta(days=30)).strftime('%Y-%m-%d')
        
        prediction_data = {
            'date': future_date,
            'weight_grams': 10
        }
        
        response = self.client.post(
            '/api/predictions/gold',
            data=json.dumps(prediction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        
        # Check prediction structure
        prediction = data['data']
        self.assertIn('predicted_price_per_gram', prediction)
        self.assertIn('total_price', prediction)
        self.assertIn('confidence_interval', prediction)
        self.assertIn('lower', prediction['confidence_interval'])
        self.assertIn('upper', prediction['confidence_interval'])
        
        # Verify price is reasonable
        self.assertGreater(prediction['predicted_price_per_gram'], 0)
        self.assertGreater(prediction['total_price'], 0)
    
    def test_predict_gold_price_without_weight(self):
        """Test gold price prediction without weight parameter."""
        future_date = (datetime.utcnow() + timedelta(days=15)).strftime('%Y-%m-%d')
        
        prediction_data = {
            'date': future_date
        }
        
        response = self.client.post(
            '/api/predictions/gold',
            data=json.dumps(prediction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        
        # Should have predicted_price but not total_price
        prediction = data['data']
        self.assertIn('predicted_price', prediction)
    
    def test_predict_gold_price_missing_date(self):
        """Test gold price prediction with missing date."""
        prediction_data = {
            'weight_grams': 10
        }
        
        response = self.client.post(
            '/api/predictions/gold',
            data=json.dumps(prediction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('error', data)
    
    def test_predict_gold_price_invalid_date_format(self):
        """Test gold price prediction with invalid date format."""
        prediction_data = {
            'date': '2025/12/01',  # Wrong format
            'weight_grams': 10
        }
        
        response = self.client.post(
            '/api/predictions/gold',
            data=json.dumps(prediction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_predict_gold_price_past_date(self):
        """Test gold price prediction with past date."""
        past_date = (datetime.utcnow() - timedelta(days=10)).strftime('%Y-%m-%d')
        
        prediction_data = {
            'date': past_date,
            'weight_grams': 10
        }
        
        response = self.client.post(
            '/api/predictions/gold',
            data=json.dumps(prediction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('future', data['error']['message'].lower())
    
    def test_predict_gold_price_negative_weight(self):
        """Test gold price prediction with negative weight."""
        future_date = (datetime.utcnow() + timedelta(days=30)).strftime('%Y-%m-%d')
        
        prediction_data = {
            'date': future_date,
            'weight_grams': -5
        }
        
        response = self.client.post(
            '/api/predictions/gold',
            data=json.dumps(prediction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_predict_diamond_price_success(self):
        """Test diamond price prediction with valid data."""
        prediction_data = {
            'carat': 1.5,
            'cut': 'Ideal',
            'color': 'E',
            'clarity': 'VS1'
        }
        
        response = self.client.post(
            '/api/predictions/diamond',
            data=json.dumps(prediction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        
        # Check prediction structure
        prediction = data['data']
        self.assertIn('predicted_price', prediction)
        self.assertIn('confidence_interval', prediction)
        self.assertIn('features_used', prediction)
        
        # Verify features match input
        self.assertEqual(prediction['features_used']['carat'], 1.5)
        self.assertEqual(prediction['features_used']['cut'], 'Ideal')
        self.assertEqual(prediction['features_used']['color'], 'E')
        self.assertEqual(prediction['features_used']['clarity'], 'VS1')
        
        # Verify price is reasonable
        self.assertGreater(prediction['predicted_price'], 0)
    
    def test_predict_diamond_price_missing_fields(self):
        """Test diamond price prediction with missing required fields."""
        prediction_data = {
            'carat': 1.5,
            'cut': 'Ideal'
            # Missing color and clarity
        }
        
        response = self.client.post(
            '/api/predictions/diamond',
            data=json.dumps(prediction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('missing', data['error']['message'].lower())
    
    def test_predict_diamond_price_invalid_cut(self):
        """Test diamond price prediction with invalid cut."""
        prediction_data = {
            'carat': 1.5,
            'cut': 'InvalidCut',
            'color': 'E',
            'clarity': 'VS1'
        }
        
        response = self.client.post(
            '/api/predictions/diamond',
            data=json.dumps(prediction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('cut', data['error']['message'].lower())
    
    def test_predict_diamond_price_invalid_color(self):
        """Test diamond price prediction with invalid color."""
        prediction_data = {
            'carat': 1.5,
            'cut': 'Ideal',
            'color': 'Z',  # Invalid color
            'clarity': 'VS1'
        }
        
        response = self.client.post(
            '/api/predictions/diamond',
            data=json.dumps(prediction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('color', data['error']['message'].lower())
    
    def test_predict_diamond_price_invalid_clarity(self):
        """Test diamond price prediction with invalid clarity."""
        prediction_data = {
            'carat': 1.5,
            'cut': 'Ideal',
            'color': 'E',
            'clarity': 'InvalidClarity'
        }
        
        response = self.client.post(
            '/api/predictions/diamond',
            data=json.dumps(prediction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('clarity', data['error']['message'].lower())
    
    def test_predict_diamond_price_negative_carat(self):
        """Test diamond price prediction with negative carat."""
        prediction_data = {
            'carat': -1.5,
            'cut': 'Ideal',
            'color': 'E',
            'clarity': 'VS1'
        }
        
        response = self.client.post(
            '/api/predictions/diamond',
            data=json.dumps(prediction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_get_price_trends_default(self):
        """Test getting price trends with default parameters."""
        response = self.client.get('/api/predictions/trends')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        
        trends = data['data']
        self.assertIn('prices', trends)
        self.assertIn('statistics', trends)
        self.assertIn('period_days', trends)
        
        # Check statistics
        stats = trends['statistics']
        self.assertIn('average', stats)
        self.assertIn('min', stats)
        self.assertIn('max', stats)
        self.assertIn('current', stats)
        self.assertIn('change', stats)
        self.assertIn('change_percent', stats)
    
    def test_get_price_trends_custom_days(self):
        """Test getting price trends with custom days parameter."""
        response = self.client.get('/api/predictions/trends?days=7')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        
        trends = data['data']
        self.assertEqual(trends['period_days'], 7)
    
    def test_get_price_trends_invalid_days(self):
        """Test getting price trends with invalid days parameter."""
        response = self.client.get('/api/predictions/trends?days=0')
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_get_price_trends_exceeds_max_days(self):
        """Test getting price trends with days exceeding maximum."""
        response = self.client.get('/api/predictions/trends?days=500')
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
    
    def test_get_models_status(self):
        """Test getting ML models status."""
        response = self.client.get('/api/predictions/status')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        
        status = data['data']
        self.assertIn('gold_model', status)
        self.assertIn('diamond_model', status)
        
        # Check gold model status
        gold_status = status['gold_model']
        self.assertIn('loaded', gold_status)
        self.assertIn('trained', gold_status)
        
        # Check diamond model status
        diamond_status = status['diamond_model']
        self.assertIn('loaded', diamond_status)
        self.assertIn('trained', diamond_status)
    
    def test_retrain_gold_model(self):
        """Test retraining gold model."""
        retrain_data = {
            'model': 'gold'
        }
        
        response = self.client.post(
            '/api/predictions/retrain',
            data=json.dumps(retrain_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertIn('gold_model', data['data'])
        
        # Check training results
        gold_result = data['data']['gold_model']
        self.assertTrue(gold_result['success'])
        self.assertIn('metrics', gold_result)
    
    def test_retrain_diamond_model(self):
        """Test retraining diamond model."""
        retrain_data = {
            'model': 'diamond'
        }
        
        response = self.client.post(
            '/api/predictions/retrain',
            data=json.dumps(retrain_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertIn('diamond_model', data['data'])
        
        # Check training results
        diamond_result = data['data']['diamond_model']
        self.assertTrue(diamond_result['success'])
        self.assertIn('metrics', diamond_result)
    
    def test_retrain_all_models(self):
        """Test retraining all models."""
        retrain_data = {
            'model': 'all'
        }
        
        response = self.client.post(
            '/api/predictions/retrain',
            data=json.dumps(retrain_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        self.assertIn('gold_model', data['data'])
        self.assertIn('diamond_model', data['data'])
    
    def test_retrain_invalid_model_type(self):
        """Test retraining with invalid model type."""
        retrain_data = {
            'model': 'invalid'
        }
        
        response = self.client.post(
            '/api/predictions/retrain',
            data=json.dumps(retrain_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])


class TestPredictionsWithUntrainedModels(unittest.TestCase):
    """Test cases for predictions with untrained models."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test client."""
        cls.app = create_app('testing')
        cls.client = cls.app.test_client()
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
    
    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests."""
        cls.app_context.pop()
    
    def setUp(self):
        """Set up before each test."""
        # Clear collections and ensure no models are trained
        PriceHistory.drop_collection()
        DiamondPriceHistory.drop_collection()
        TrainingLog.drop_collection()
        
        # Reset ML service (models will be untrained)
        ml_service.gold_model = None
        ml_service.diamond_model = None
    
    def tearDown(self):
        """Clean up after each test."""
        PriceHistory.drop_collection()
        DiamondPriceHistory.drop_collection()
        TrainingLog.drop_collection()
    
    def test_predict_gold_price_untrained_model(self):
        """Test gold price prediction with untrained model."""
        future_date = (datetime.utcnow() + timedelta(days=30)).strftime('%Y-%m-%d')
        
        prediction_data = {
            'date': future_date,
            'weight_grams': 10
        }
        
        response = self.client.post(
            '/api/predictions/gold',
            data=json.dumps(prediction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 503)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('not trained', data['error']['message'].lower())
    
    def test_predict_diamond_price_untrained_model(self):
        """Test diamond price prediction with untrained model."""
        prediction_data = {
            'carat': 1.5,
            'cut': 'Ideal',
            'color': 'E',
            'clarity': 'VS1'
        }
        
        response = self.client.post(
            '/api/predictions/diamond',
            data=json.dumps(prediction_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 503)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('not trained', data['error']['message'].lower())


def run_tests():
    """Run all tests."""
    unittest.main(argv=[''], verbosity=2, exit=False)


if __name__ == '__main__':
    unittest.main(verbosity=2)
