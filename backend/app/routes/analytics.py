"""Analytics API routes for admin dashboard."""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from app.models.sale import Sale
from app.models.product import Product
from app.models.customer import Customer
from app.services.khata_service import KhataService
from app.services.analytics_service import AnalyticsService

bp = Blueprint('analytics', __name__)
khata_service = KhataService()
analytics_service = AnalyticsService()


@bp.route('/dashboard', methods=['GET'])
def get_dashboard_analytics():
    """
    Get comprehensive dashboard analytics.
    
    Query parameters:
        days: Number of days to look back for analytics (default: 30)
    
    Returns:
        200: Dashboard analytics data
        500: Server error
    """
    try:
        # Get date range
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get sales analytics
        sales_summary = Sale.get_sales_summary(start_date, end_date)
        
        # Get total revenue and transactions using aggregation (optimized)
        pipeline = [
            {
                '$group': {
                    '_id': None,
                    'total_revenue': {'$sum': '$final_amount'},
                    'total_transactions': {'$sum': 1}
                }
            }
        ]
        aggregation_result = list(Sale.objects.aggregate(pipeline))
        total_revenue = aggregation_result[0]['total_revenue'] if aggregation_result else 0
        total_transactions = aggregation_result[0]['total_transactions'] if aggregation_result else 0
        
        # Get top-selling products
        top_products = get_top_selling_products(limit=5)
        
        # Get khata summary
        khata_summary = khata_service.get_overall_summary()
        
        # Get customer count
        total_customers = Customer.objects().count()
        
        # Get recent sales with projection to limit fields
        recent_sales = Sale.objects().only(
            'customer', 'products', 'final_amount', 'created_at', 'payment_status'
        ).order_by('-created_at').limit(10)
        recent_sales_data = []
        for sale in recent_sales:
            recent_sales_data.append({
                'id': str(sale.id),
                'customer_name': sale.customer.name if sale.customer else 'Unknown',
                'product_names': ', '.join([p.get('product_name', 'Unknown') for p in sale.products[:2]]),
                'amount': sale.final_amount,
                'date': sale.created_at.isoformat() if sale.created_at else None,
                'payment_status': sale.payment_status
            })
        
        return jsonify({
            'success': True,
            'data': {
                'summary': {
                    'total_revenue': total_revenue,
                    'total_transactions': total_transactions,
                    'total_customers': total_customers,
                    'outstanding_balance': khata_summary.get('total_outstanding', 0)
                },
                'sales_analytics': {
                    'period_days': days,
                    'period_revenue': sales_summary.get('total_revenue', 0),
                    'period_transactions': sales_summary.get('total_sales', 0),
                    'average_sale_value': sales_summary.get('average_sale_value', 0),
                    'paid_sales': sales_summary.get('paid_sales', 0),
                    'pending_sales': sales_summary.get('pending_sales', 0)
                },
                'top_selling_products': top_products,
                'khata_summary': {
                    'total_outstanding': khata_summary.get('total_outstanding', 0),
                    'customers_with_balance': khata_summary.get('customers_with_balance', 0),
                    'top_debtors': khata_summary.get('top_debtors', [])[:5]
                },
                'recent_sales': recent_sales_data
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'An unexpected error occurred',
                'details': str(e)
            }
        }), 500


def get_top_selling_products(limit=10):
    """
    Get top-selling products based on sales data using aggregation.
    
    Args:
        limit: Maximum number of products to return
    
    Returns:
        list: Top-selling products with sales count and revenue
    """
    try:
        # Use MongoDB aggregation pipeline for efficient processing
        pipeline = [
            # Unwind the products array to process each product separately
            {'$unwind': '$products'},
            # Group by product_id and calculate totals
            {
                '$group': {
                    '_id': '$products.product_id',
                    'product_name': {'$first': '$products.product_name'},
                    'quantity_sold': {'$sum': '$products.quantity'},
                    'total_revenue': {
                        '$sum': {
                            '$multiply': [
                                '$products.quantity',
                                '$products.price_at_sale'
                            ]
                        }
                    }
                }
            },
            # Sort by quantity sold in descending order
            {'$sort': {'quantity_sold': -1}},
            # Limit to top N products
            {'$limit': limit},
            # Project to format output
            {
                '$project': {
                    '_id': 0,
                    'product_id': '$_id',
                    'product_name': 1,
                    'quantity_sold': 1,
                    'total_revenue': 1
                }
            }
        ]
        
        result = list(Sale.objects.aggregate(pipeline))
        return result
        
    except Exception as e:
        print(f"Error getting top-selling products: {e}")
        return []


@bp.route('/sales-trend', methods=['GET'])
def get_sales_trend():
    """
    Get sales trend data for charts using aggregation.
    
    Query parameters:
        months: Number of months to look back (default: 6)
    
    Returns:
        200: Sales trend data by month
        500: Server error
    """
    try:
        months = request.args.get('months', 6, type=int)
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=months * 30)
        
        # Use MongoDB aggregation pipeline for efficient grouping
        pipeline = [
            # Match sales in date range
            {
                '$match': {
                    'created_at': {
                        '$gte': start_date,
                        '$lte': end_date
                    }
                }
            },
            # Group by year-month
            {
                '$group': {
                    '_id': {
                        'year': {'$year': '$created_at'},
                        'month': {'$month': '$created_at'}
                    },
                    'sales': {'$sum': 1},
                    'revenue': {'$sum': '$final_amount'}
                }
            },
            # Sort by year and month
            {'$sort': {'_id.year': 1, '_id.month': 1}},
            # Project to format output
            {
                '$project': {
                    '_id': 0,
                    'year': '$_id.year',
                    'month_num': '$_id.month',
                    'sales': 1,
                    'revenue': 1
                }
            }
        ]
        
        result = list(Sale.objects.aggregate(pipeline))
        
        # Format month names
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        trend_data = []
        for item in result:
            trend_data.append({
                'month': month_names[item['month_num'] - 1],
                'sales': item['sales'],
                'revenue': item['revenue']
            })
        
        return jsonify({
            'success': True,
            'data': trend_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'An unexpected error occurred',
                'details': str(e)
            }
        }), 500


@bp.route('/enhanced-metrics', methods=['GET'])
def get_enhanced_metrics():
    """
    Get enhanced dashboard metrics including new analytics.
    
    Query parameters:
        days: Number of days to look back (default: 30)
    
    Returns:
        200: Enhanced metrics data
        500: Server error
    """
    try:
        days = request.args.get('days', 30, type=int)
        
        # Get enhanced metrics
        metrics = analytics_service.get_enhanced_dashboard_metrics(days)
        
        return jsonify({
            'success': True,
            'data': metrics
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'An unexpected error occurred',
                'details': str(e)
            }
        }), 500


@bp.route('/sales', methods=['GET'])
def get_sales_export():
    """
    Get sales data for export with optional date range filtering.
    
    Query parameters:
        start_date: Start date for filtering (ISO format: YYYY-MM-DD)
        end_date: End date for filtering (ISO format: YYYY-MM-DD)
    
    Returns:
        200: Sales data for export
        400: Invalid date format
        500: Server error
    """
    try:
        # Get date range parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        
        # Build query
        query = {}
        
        if start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str)
                query['created_at__gte'] = start_date
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid start_date format. Use YYYY-MM-DD'
                    }
                }), 400
        
        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str)
                # Set to end of day
                end_date = end_date.replace(hour=23, minute=59, second=59)
                query['created_at__lte'] = end_date
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid end_date format. Use YYYY-MM-DD'
                    }
                }), 400
        
        # Get sales data with projection to limit fields
        sales = Sale.objects(**query).only(
            'customer', 'products', 'total_amount', 'discount', 'final_amount',
            'payment_status', 'payment_method', 'created_at', 'notes'
        ).order_by('-created_at')
        
        # Format sales data for export
        sales_data = []
        for sale in sales:
            # Get product names
            product_names = ', '.join([
                p.get('product_name', 'Unknown') 
                for p in sale.products[:3]  # Limit to first 3 products
            ])
            if len(sale.products) > 3:
                product_names += f' (+{len(sale.products) - 3} more)'
            
            sales_data.append({
                'id': str(sale.id),
                'customer_name': sale.customer.name if sale.customer else 'Unknown',
                'product_names': product_names,
                'amount': sale.total_amount,
                'discount': sale.discount,
                'final_amount': sale.final_amount,
                'payment_status': sale.payment_status,
                'payment_method': sale.payment_method or 'N/A',
                'date': sale.created_at.isoformat() if sale.created_at else None,
                'notes': sale.notes or ''
            })
        
        return jsonify({
            'success': True,
            'data': sales_data,
            'count': len(sales_data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'An unexpected error occurred',
                'details': str(e)
            }
        }), 500


@bp.route('/orders', methods=['GET'])
def get_orders_export():
    """
    Get orders data for export with optional date range filtering.
    
    Query parameters:
        start_date: Start date for filtering (ISO format: YYYY-MM-DD)
        end_date: End date for filtering (ISO format: YYYY-MM-DD)
        status: Filter by order status (pending, processing, completed, cancelled)
    
    Returns:
        200: Orders data for export
        400: Invalid date format
        500: Server error
    """
    try:
        from app.models.order import Order
        
        # Get query parameters
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        status = request.args.get('status')
        
        # Build query
        query = {}
        
        if start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str)
                query['created_at__gte'] = start_date
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid start_date format. Use YYYY-MM-DD'
                    }
                }), 400
        
        if end_date_str:
            try:
                end_date = datetime.fromisoformat(end_date_str)
                # Set to end of day
                end_date = end_date.replace(hour=23, minute=59, second=59)
                query['created_at__lte'] = end_date
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 400,
                        'message': 'Invalid end_date format. Use YYYY-MM-DD'
                    }
                }), 400
        
        if status and status in ['pending', 'processing', 'completed', 'cancelled']:
            query['status'] = status
        
        # Get orders data with projection to limit fields
        orders = Order.objects(**query).only(
            'order_number', 'customer_name', 'customer_phone', 'customer_email',
            'items', 'subtotal', 'tax_amount', 'discount_amount', 'total_amount',
            'status', 'payment_status', 'payment_method', 'created_at', 'notes'
        ).order_by('-created_at')
        
        # Format orders data for export
        orders_data = []
        for order in orders:
            # Get item details
            item_count = len(order.items)
            item_names = ', '.join([
                item.product_name
                for item in order.items[:3]  # Limit to first 3 items
            ])
            if item_count > 3:
                item_names += f' (+{item_count - 3} more)'
            
            orders_data.append({
                'order_number': order.order_number,
                'customer_name': order.customer_name,
                'customer_phone': order.customer_phone,
                'customer_email': order.customer_email or 'N/A',
                'items': item_names,
                'item_count': item_count,
                'subtotal': order.subtotal,
                'tax_amount': order.tax_amount,
                'discount_amount': order.discount_amount,
                'total_amount': order.total_amount,
                'status': order.status,
                'payment_status': order.payment_status,
                'payment_method': order.payment_method or 'N/A',
                'date': order.created_at.isoformat() if order.created_at else None,
                'notes': order.notes or ''
            })
        
        return jsonify({
            'success': True,
            'data': orders_data,
            'count': len(orders_data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 500,
                'message': 'An unexpected error occurred',
                'details': str(e)
            }
        }), 500
