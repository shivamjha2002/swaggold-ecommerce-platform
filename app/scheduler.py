"""Background scheduler for periodic tasks."""
import logging
from flask_apscheduler import APScheduler
from flask import current_app

logger = logging.getLogger(__name__)

# Initialize scheduler
scheduler = APScheduler()


def init_scheduler(app):
    """
    Initialize and configure the scheduler.
    
    Args:
        app: Flask application instance
    """
    # Configure scheduler
    app.config['SCHEDULER_API_ENABLED'] = False  # Disable API endpoints for security
    app.config['SCHEDULER_TIMEZONE'] = 'UTC'
    
    # Initialize scheduler with app
    scheduler.init_app(app)
    
    # Add jobs
    add_price_update_job(app)
    add_price_snapshot_job(app)
    
    # Start scheduler
    if not scheduler.running:
        scheduler.start()
        logger.info('Scheduler started successfully')


def add_price_update_job(app):
    """
    Add price update job to scheduler.
    
    Args:
        app: Flask application instance
    """
    # Get fetch interval from config (in seconds)
    fetch_interval = app.config.get('PRICE_FETCH_INTERVAL', 60)
    
    # Get symbols from config
    symbols_str = app.config.get('GEMINI_SYMBOLS', 'BTCUSD,ETHUSD')
    symbols = [s.strip() for s in symbols_str.split(',')]
    
    if not symbols:
        logger.warning('No symbols configured for price updates')
        return
    
    # Add job to scheduler
    @scheduler.task(
        'interval',
        id='update_price_feeds',
        seconds=fetch_interval,
        max_instances=1,  # Prevent overlapping executions
        coalesce=True  # Combine missed executions into one
    )
    def update_price_feeds():
        """Periodic task to update price feeds from Gemini API."""
        with app.app_context():
            from app.services.price_feed_service import PriceFeedService
            
            logger.info(f'Starting scheduled price update for symbols: {symbols}')
            
            try:
                results = PriceFeedService.force_refresh_prices(symbols)
                
                success_count = len(results['success'])
                failed_count = len(results['failed'])
                
                if success_count > 0:
                    logger.info(f'Price update completed: {success_count} success, {failed_count} failed')
                else:
                    logger.error(f'All price updates failed: {results.get("failed", [])}')
                
                # Log individual failures
                if results['failed']:
                    for symbol in results['failed']:
                        logger.warning(f'Failed to update price for {symbol}')
                
            except Exception as e:
                logger.error(f'Error during scheduled price update: {str(e)}', exc_info=True)
    
    logger.info(f'Price update job scheduled with interval: {fetch_interval} seconds for symbols: {symbols}')


def add_price_snapshot_job(app):
    """
    Add price snapshot job to scheduler.
    Stores price snapshots every hour for historical trend analysis.
    
    Args:
        app: Flask application instance
    """
    # Store snapshots every hour (3600 seconds)
    snapshot_interval = 3600
    
    # Add job to scheduler
    @scheduler.task(
        'interval',
        id='store_price_snapshots',
        seconds=snapshot_interval,
        max_instances=1,  # Prevent overlapping executions
        coalesce=True  # Combine missed executions into one
    )
    def store_price_snapshots():
        """Periodic task to store price snapshots for historical tracking."""
        with app.app_context():
            from app.services.price_feed_service import PriceFeedService
            
            logger.info('Starting scheduled price snapshot storage')
            
            try:
                results = PriceFeedService.store_all_price_snapshots()
                
                success_count = len(results['success'])
                failed_count = len(results['failed'])
                
                if success_count > 0:
                    logger.info(f'Price snapshot storage completed: {success_count} success, {failed_count} failed')
                else:
                    logger.error(f'All price snapshots failed: {results.get("failed", [])}')
                
                # Log individual failures
                if results['failed']:
                    for symbol in results['failed']:
                        logger.warning(f'Failed to store snapshot for {symbol}')
                
            except Exception as e:
                logger.error(f'Error during scheduled price snapshot storage: {str(e)}', exc_info=True)
    
    logger.info(f'Price snapshot job scheduled with interval: {snapshot_interval} seconds (1 hour)')


def shutdown_scheduler():
    """Shutdown the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info('Scheduler shut down successfully')
