"""Analytics service for dashboard metrics and reporting."""
from datetime import datetime, timedelta
from app.models.sale import Sale
from app.models.product import Product
from app.models.order import Order
from app.models.customer import Customer


class AnalyticsService:
    """Service for calculating analytics and metrics."""
    
    @staticmethod
    def get_conversion_rate(start_date=None, end_date=None):
        """
        Calculate conversion rate (orders / total customers).
        
        Args:
            start_date: Start date for filtering orders
            end_date: End date for filtering orders
        
        Returns:
            dict: Conversion rate data
        """
        # Get total customers
        total_customers = Customer.objects().count()
        
        if total_customers == 0:
            return {
                'conversion_rate': 0.0,
                'total_customers': 0,
                'customers_with_orders': 0
            }
        
        # Build query for orders
        query = {}
        if start_date:
            query['created_at__gte'] = start_date
        if end_date:
            query['created_at__lte'] = end_date
        
        # Get unique customers who placed orders
        orders = Order.objects(**query).only('customer_id')
        unique_customer_ids = set(str(order.customer_id.id) for order in orders if order.customer_id)
        customers_with_orders = len(unique_customer_ids)
        
        # Calculate conversion rate
        conversion_rate = (customers_with_orders / total_customers) * 100
        
        return {
            'conversion_rate': round(conversion_rate, 2),
            'total_customers': total_customers,
            'customers_with_orders': customers_with_orders
        }
    
    @staticmethod
    def get_product_status_counts():
        """
        Get counts of products by status (draft vs published).
        
        Returns:
            dict: Product counts by status
        """
        # Use aggregation for efficient counting
        pipeline = [
            {
                '$match': {
                    'is_active': True
                }
            },
            {
                '$group': {
                    '_id': '$status',
                    'count': {'$sum': 1}
                }
            }
        ]
        
        result = list(Product.objects.aggregate(pipeline))
        
        # Format results
        counts = {
            'draft': 0,
            'published': 0,
            'total': 0
        }
        
        for item in result:
            status = item['_id']
            count = item['count']
            if status in counts:
                counts[status] = count
                counts['total'] += count
        
        return counts
    
    @staticmethod
    def get_order_status_breakdown(start_date=None, end_date=None):
        """
        Get breakdown of orders by status.
        
        Args:
            start_date: Start date for filtering
            end_date: End date for filtering
        
        Returns:
            dict: Order counts by status
        """
        # Build match query
        match_query = {}
        if start_date:
            match_query['created_at__gte'] = start_date
        if end_date:
            match_query['created_at__lte'] = end_date
        
        # Use aggregation for efficient counting
        pipeline = [
            {
                '$group': {
                    '_id': '$status',
                    'count': {'$sum': 1},
                    'total_amount': {'$sum': '$total_amount'}
                }
            }
        ]
        
        if match_query:
            pipeline.insert(0, {'$match': match_query})
        
        result = list(Order.objects.aggregate(pipeline))
        
        # Format results
        breakdown = {
            'pending': {'count': 0, 'total_amount': 0},
            'processing': {'count': 0, 'total_amount': 0},
            'completed': {'count': 0, 'total_amount': 0},
            'cancelled': {'count': 0, 'total_amount': 0},
            'total_orders': 0,
            'total_revenue': 0
        }
        
        for item in result:
            status = item['_id']
            if status in breakdown:
                breakdown[status] = {
                    'count': item['count'],
                    'total_amount': item['total_amount']
                }
                breakdown['total_orders'] += item['count']
                # Only count completed orders in revenue
                if status == 'completed':
                    breakdown['total_revenue'] += item['total_amount']
        
        return breakdown
    
    @staticmethod
    def get_average_order_value(start_date=None, end_date=None):
        """
        Calculate average order value.
        
        Args:
            start_date: Start date for filtering
            end_date: End date for filtering
        
        Returns:
            dict: Average order value data
        """
        # Build match query
        match_query = {}
        if start_date:
            match_query['created_at__gte'] = start_date
        if end_date:
            match_query['created_at__lte'] = end_date
        
        # Use aggregation for efficient calculation
        pipeline = [
            {
                '$group': {
                    '_id': None,
                    'total_amount': {'$sum': '$total_amount'},
                    'order_count': {'$sum': 1}
                }
            }
        ]
        
        if match_query:
            pipeline.insert(0, {'$match': match_query})
        
        result = list(Order.objects.aggregate(pipeline))
        
        if not result or result[0]['order_count'] == 0:
            return {
                'average_order_value': 0.0,
                'total_orders': 0,
                'total_revenue': 0.0
            }
        
        data = result[0]
        avg_value = data['total_amount'] / data['order_count']
        
        return {
            'average_order_value': round(avg_value, 2),
            'total_orders': data['order_count'],
            'total_revenue': round(data['total_amount'], 2)
        }
    
    @staticmethod
    def get_low_stock_products(threshold=5):
        """
        Get products with low stock.
        
        Args:
            threshold: Stock quantity threshold for low stock alert
        
        Returns:
            list: Products with low stock
        """
        products = Product.objects(
            is_active=True,
            status='published',
            stock_quantity__lte=threshold,
            stock_quantity__gt=0
        ).only('name', 'category', 'stock_quantity', 'base_price')
        
        return [
            {
                'id': str(product.id),
                'name': product.name,
                'category': product.category,
                'stock_quantity': product.stock_quantity,
                'base_price': product.base_price
            }
            for product in products
        ]
    
    @staticmethod
    def get_out_of_stock_products():
        """
        Get products that are out of stock.
        
        Returns:
            list: Products with zero stock
        """
        products = Product.objects(
            is_active=True,
            status='published',
            stock_quantity=0
        ).only('name', 'category', 'base_price')
        
        return [
            {
                'id': str(product.id),
                'name': product.name,
                'category': product.category,
                'base_price': product.base_price
            }
            for product in products
        ]
    
    @staticmethod
    def get_enhanced_dashboard_metrics(days=30):
        """
        Get comprehensive dashboard metrics including new analytics.
        
        Args:
            days: Number of days to look back for period-specific metrics
        
        Returns:
            dict: Enhanced dashboard metrics
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get all metrics
        conversion_data = AnalyticsService.get_conversion_rate(start_date, end_date)
        product_counts = AnalyticsService.get_product_status_counts()
        order_breakdown = AnalyticsService.get_order_status_breakdown(start_date, end_date)
        avg_order_value = AnalyticsService.get_average_order_value(start_date, end_date)
        low_stock = AnalyticsService.get_low_stock_products()
        out_of_stock = AnalyticsService.get_out_of_stock_products()
        
        return {
            'conversion_metrics': conversion_data,
            'product_status_counts': product_counts,
            'order_status_breakdown': order_breakdown,
            'average_order_value': avg_order_value,
            'inventory_alerts': {
                'low_stock_products': low_stock,
                'out_of_stock_products': out_of_stock,
                'low_stock_count': len(low_stock),
                'out_of_stock_count': len(out_of_stock)
            }
        }
