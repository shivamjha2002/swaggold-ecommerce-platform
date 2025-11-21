"""Model training pipeline for gold and diamond price prediction."""
import joblib
import os
from datetime import datetime
import pandas as pd
from app.ml.gold_predictor import GoldPricePredictor
from app.ml.diamond_predictor import DiamondPricePredictor
from app.models.price_history import PriceHistory, DiamondPriceHistory, TrainingLog


def train_gold_model(models_dir='models', min_data_points=30):
    """
    Train gold price prediction model.
    
    Args:
        models_dir: Directory to save trained model
        min_data_points: Minimum number of data points required
    
    Returns:
        dict: Training results with metrics
    
    Raises:
        ValueError: If insufficient data for training
    """
    print("Starting gold price model training...")
    
    # Fetch historical data from MongoDB
    price_data = PriceHistory.objects(
        metal_type='gold',
        purity='916'
    ).order_by('date')
    
    if len(price_data) < min_data_points:
        raise ValueError(
            f"Insufficient data for training. Found {len(price_data)} records, "
            f"need at least {min_data_points}"
        )
    
    print(f"Found {len(price_data)} historical price records")
    
    # Convert to DataFrame
    df = pd.DataFrame([{
        'date': p.date,
        'price_per_gram': p.price_per_gram
    } for p in price_data])
    
    print(f"Data range: {df['date'].min()} to {df['date'].max()}")
    
    # Initialize and train model
    predictor = GoldPricePredictor()
    metrics = predictor.train(df)
    
    print(f"Training completed. R² Score: {metrics['r2_score']:.4f}")
    print(f"RMSE: {metrics['rmse']:.2f}, MAE: {metrics['mae']:.2f}")
    
    # Create models directory if it doesn't exist
    os.makedirs(models_dir, exist_ok=True)
    
    # Save model with versioning
    model_path = os.path.join(models_dir, 'gold_model.pkl')
    joblib.dump(predictor, model_path)
    print(f"Model saved to {model_path}")
    
    # Create versioned backup
    version = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(models_dir, f'gold_model_{version}.pkl')
    joblib.dump(predictor, backup_path)
    print(f"Backup saved to {backup_path}")
    
    # Log training to database
    training_log = TrainingLog(
        model_name='gold_predictor',
        metrics=metrics,
        data_points=len(df),
        trained_at=datetime.utcnow(),
        model_version=version,
        notes=f"Trained on {len(df)} data points from {df['date'].min()} to {df['date'].max()}"
    )
    training_log.save()
    print(f"Training log saved to database")
    
    return {
        'success': True,
        'model_name': 'gold_predictor',
        'metrics': metrics,
        'data_points': len(df),
        'model_path': model_path,
        'version': version,
        'trained_at': datetime.utcnow().isoformat()
    }


def train_diamond_model(models_dir='models', min_data_points=50):
    """
    Train diamond price prediction model.
    
    Args:
        models_dir: Directory to save trained model
        min_data_points: Minimum number of data points required
    
    Returns:
        dict: Training results with metrics
    
    Raises:
        ValueError: If insufficient data for training
    """
    print("Starting diamond price model training...")
    
    # Fetch historical data from MongoDB
    diamond_data = DiamondPriceHistory.objects().order_by('date')
    
    if len(diamond_data) < min_data_points:
        raise ValueError(
            f"Insufficient data for training. Found {len(diamond_data)} records, "
            f"need at least {min_data_points}"
        )
    
    print(f"Found {len(diamond_data)} historical diamond price records")
    
    # Convert to DataFrame
    df = pd.DataFrame([{
        'carat': d.carat,
        'cut': d.cut,
        'color': d.color,
        'clarity': d.clarity,
        'price': d.price
    } for d in diamond_data])
    
    print(f"Carat range: {df['carat'].min():.2f} to {df['carat'].max():.2f}")
    print(f"Price range: ₹{df['price'].min():.2f} to ₹{df['price'].max():.2f}")
    
    # Initialize and train model
    predictor = DiamondPricePredictor()
    metrics = predictor.train(df)
    
    print(f"Training completed. R² Score: {metrics['r2_score']:.4f}")
    print(f"RMSE: {metrics['rmse']:.2f}, MAE: {metrics['mae']:.2f}")
    print(f"MAPE: {metrics['mape']:.2f}%")
    
    # Create models directory if it doesn't exist
    os.makedirs(models_dir, exist_ok=True)
    
    # Save model with versioning
    model_path = os.path.join(models_dir, 'diamond_model.pkl')
    joblib.dump(predictor, model_path)
    print(f"Model saved to {model_path}")
    
    # Create versioned backup
    version = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(models_dir, f'diamond_model_{version}.pkl')
    joblib.dump(predictor, backup_path)
    print(f"Backup saved to {backup_path}")
    
    # Log training to database
    training_log = TrainingLog(
        model_name='diamond_predictor',
        metrics=metrics,
        data_points=len(df),
        trained_at=datetime.utcnow(),
        model_version=version,
        notes=f"Trained on {len(df)} diamond records"
    )
    training_log.save()
    print(f"Training log saved to database")
    
    return {
        'success': True,
        'model_name': 'diamond_predictor',
        'metrics': metrics,
        'data_points': len(df),
        'model_path': model_path,
        'version': version,
        'trained_at': datetime.utcnow().isoformat()
    }


def train_all_models(models_dir='models'):
    """
    Train all ML models.
    
    Args:
        models_dir: Directory to save trained models
    
    Returns:
        dict: Training results for all models
    """
    results = {
        'gold_model': None,
        'diamond_model': None,
        'errors': []
    }
    
    # Train gold model
    try:
        results['gold_model'] = train_gold_model(models_dir)
    except Exception as e:
        error_msg = f"Error training gold model: {str(e)}"
        print(error_msg)
        results['errors'].append(error_msg)
    
    # Train diamond model
    try:
        results['diamond_model'] = train_diamond_model(models_dir)
    except Exception as e:
        error_msg = f"Error training diamond model: {str(e)}"
        print(error_msg)
        results['errors'].append(error_msg)
    
    return results


def get_training_history(model_name=None, limit=10):
    """
    Get training history from database.
    
    Args:
        model_name: Optional model name to filter by
        limit: Maximum number of records to return
    
    Returns:
        list: Training log records
    """
    query = TrainingLog.objects()
    
    if model_name:
        query = query.filter(model_name=model_name)
    
    logs = query.order_by('-trained_at').limit(limit)
    
    return [log.to_dict() for log in logs]


def should_retrain(model_name, new_records_threshold=30):
    """
    Check if model should be retrained based on new data.
    
    Args:
        model_name: Name of the model to check
        new_records_threshold: Number of new records to trigger retraining
    
    Returns:
        dict: Retraining recommendation with details
    """
    # Get last training log
    last_log = TrainingLog.objects(model_name=model_name).order_by('-trained_at').first()
    
    if not last_log:
        return {
            'should_retrain': True,
            'reason': 'No training history found',
            'new_records': 0
        }
    
    # Count new records since last training
    if model_name == 'gold_predictor':
        new_records = PriceHistory.objects(
            metal_type='gold',
            purity='916',
            date__gt=last_log.trained_at
        ).count()
    elif model_name == 'diamond_predictor':
        new_records = DiamondPriceHistory.objects(
            date__gt=last_log.trained_at
        ).count()
    else:
        return {
            'should_retrain': False,
            'reason': 'Unknown model name',
            'new_records': 0
        }
    
    should_retrain = new_records >= new_records_threshold
    
    return {
        'should_retrain': should_retrain,
        'reason': f'{new_records} new records since last training' if should_retrain else 'Insufficient new data',
        'new_records': new_records,
        'threshold': new_records_threshold,
        'last_trained': last_log.trained_at.isoformat()
    }


if __name__ == '__main__':
    """Run training when script is executed directly."""
    import sys
    from app import create_app
    
    # Create Flask app context for database access
    app = create_app()
    
    with app.app_context():
        if len(sys.argv) > 1:
            model_type = sys.argv[1].lower()
            
            if model_type == 'gold':
                result = train_gold_model()
                print("\nGold model training completed successfully!")
            elif model_type == 'diamond':
                result = train_diamond_model()
                print("\nDiamond model training completed successfully!")
            elif model_type == 'all':
                results = train_all_models()
                print("\nAll models training completed!")
                if results['errors']:
                    print(f"\nErrors encountered: {len(results['errors'])}")
                    for error in results['errors']:
                        print(f"  - {error}")
            else:
                print(f"Unknown model type: {model_type}")
                print("Usage: python -m app.ml.train [gold|diamond|all]")
        else:
            # Train all models by default
            results = train_all_models()
            print("\nAll models training completed!")
            if results['errors']:
                print(f"\nErrors encountered: {len(results['errors'])}")
                for error in results['errors']:
                    print(f"  - {error}")
