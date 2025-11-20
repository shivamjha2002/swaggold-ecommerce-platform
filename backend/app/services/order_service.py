"""Order service for business logic."""
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from mongoengine import Q
from app.models.order import Order, OrderItem
from app.models.customer import Customer
from app.models.product import Product


class OrderService:
    """Order business logic service."""
    
    @staticmethod
    def create_order(data: Dict) -> Order:
        """
        Create a new order.
        
        Args:
            data: Order data dictionary containing:
                - customer_id: Customer ID (required)
                - items: List of order items (required)
                - tax_amount: Tax amount (optional, default 0)
                - discount_amount: Discount amount (optional, default 0)
                - payment_status: Payment status (optional, default 'unpaid')
                - payment_method: Payment method (optional)
                - notes: Customer notes (optional)
                - admin_notes: Admin notes (optional)
        
        Returns:
            Order: Created order instance
        
        Raises:
            ValueError: If customer not found or items are invalid
        """
        # Validate customer exists
        customer = Customer.objects(id=data['customer_id']).first()
        if not customer:
            raise ValueError(f"Customer with ID {data['customer_id']} not found")
        
        # Validate items
        if not data.get('items') or len(data['items']) == 0:
            raise ValueError("Order must contain at least one item")
        
        # Generate unique order number
        order_number = Order.generate_order_number()
        
        # Create order items
        order_items = []
        for item_data in data['items']:
            # Validate product exists
            product = Product.objects(id=item_data['product_id']).first()
            if not product:
                raise ValueError(f"Product with ID {item_data['product_id']} not found")
            
            # Calculate item total
            quantity = item_data.get('quantity', 1)
            unit_price = item_data.get('unit_price', product.base_price)
            total_price = quantity * unit_price
            
            order_item = OrderItem(
                product_id=str(product.id),
                product_name=product.name,
                product_category=product.category,
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price,
                weight=product.weight,
                gold_purity=product.gold_purity
            )
            order_items.append(order_item)
        
        # Create order
        order = Order(
            order_number=order_number,
            customer_id=customer,
            customer_name=customer.name,
            customer_phone=customer.phone,
            customer_email=customer.email or '',
            customer_address=customer.address or '',
            items=order_items,
            tax_amount=data.get('tax_amount', 0.0),
            discount_amount=data.get('discount_amount', 0.0),
            payment_status=data.get('payment_status', 'unpaid'),
            payment_method=data.get('payment_method', ''),
            notes=data.get('notes', ''),
            admin_notes=data.get('admin_notes', '')
        )
        
        # Calculate totals
        order.calculate_totals()
        order.save()
        
        return order
    
    @staticmethod
    def get_order_by_id(order_id: str) -> Optional[Order]:
        """
        Get order by ID.
        
        Args:
            order_id: Order ID
        
        Returns:
            Order or None if not found
        """
        try:
            return Order.objects(id=order_id).first()
        except Exception:
            return None
    
    @staticmethod
    def get_order_by_number(order_number: str) -> Optional[Order]:
        """
        Get order by order number.
        
        Args:
            order_number: Order number
        
        Returns:
            Order or None if not found
        """
        try:
            return Order.objects(order_number=order_number).first()
        except Exception:
            return None
    
    @staticmethod
    def update_order_status(order_id: str, status: str) -> Optional[Order]:
        """
        Update order status with timestamp tracking.
        
        Args:
            order_id: Order ID
            status: New status ('pending', 'processing', 'completed', 'cancelled')
        
        Returns:
            Updated Order or None if not found
        
        Raises:
            ValueError: If status is invalid
        """
        valid_statuses = ['pending', 'processing', 'completed', 'cancelled']
        if status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        order = OrderService.get_order_by_id(order_id)
        if not order:
            return None
        
        order.update_status(status)
        return order
    
    @staticmethod
    def update_payment_status(order_id: str, payment_status: str) -> Optional[Order]:
        """
        Update order payment status.
        
        Args:
            order_id: Order ID
            payment_status: New payment status ('unpaid', 'partial', 'paid')
        
        Returns:
            Updated Order or None if not found
        
        Raises:
            ValueError: If payment status is invalid
        """
        valid_statuses = ['unpaid', 'partial', 'paid']
        if payment_status not in valid_statuses:
            raise ValueError(f"Invalid payment status. Must be one of: {', '.join(valid_statuses)}")
        
        order = OrderService.get_order_by_id(order_id)
        if not order:
            return None
        
        order.payment_status = payment_status
        order.save()
        return order
    
    @staticmethod
    def add_order_note(order_id: str, note: str, is_admin: bool = False) -> Optional[Order]:
        """
        Add a note to an order.
        
        Args:
            order_id: Order ID
            note: Note text to add
            is_admin: Whether this is an admin note (default: False)
        
        Returns:
            Updated Order or None if not found
        """
        order = OrderService.get_order_by_id(order_id)
        if not order:
            return None
        
        order.add_note(note, is_admin=is_admin)
        return order
    
    @staticmethod
    def get_orders_with_filters(
        page: int = 1,
        per_page: int = 20,
        status: Optional[str] = None,
        payment_status: Optional[str] = None,
        customer_id: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Order], int]:
        """
        Get orders with pagination and filtering.
        
        Args:
            page: Page number (1-indexed)
            per_page: Items per page
            status: Filter by order status
            payment_status: Filter by payment status
            customer_id: Filter by customer ID
            date_from: Filter by start date (ISO format string)
            date_to: Filter by end date (ISO format string)
            search: Search term for order number or customer name
        
        Returns:
            Tuple of (orders list, total count)
        """
        # Build query
        query = Q()
        
        if status:
            query &= Q(status=status)
        
        if payment_status:
            query &= Q(payment_status=payment_status)
        
        if customer_id:
            query &= Q(customer_id=customer_id)
        
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query &= Q(created_at__gte=date_from_obj)
            except (ValueError, AttributeError):
                pass  # Skip invalid date format
        
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query &= Q(created_at__lte=date_to_obj)
            except (ValueError, AttributeError):
                pass  # Skip invalid date format
        
        if search:
            # Search in order number or customer name
            search_query = Q(order_number__icontains=search) | Q(customer_name__icontains=search)
            query &= search_query
        
        # Get total count efficiently
        total = Order.objects(query).count()
        
        # Apply pagination with projection to limit fields for list view
        skip = (page - 1) * per_page
        orders = Order.objects(query).only(
            'order_number', 'customer_name', 'customer_phone', 'customer_email',
            'total_amount', 'status', 'payment_status', 'created_at', 'updated_at'
        ).skip(skip).limit(per_page).order_by('-created_at')
        
        return list(orders), total
    
    @staticmethod
    def get_customer_orders(customer_id: str, page: int = 1, per_page: int = 20) -> Tuple[List[Order], int]:
        """
        Get all orders for a specific customer.
        
        Args:
            customer_id: Customer ID
            page: Page number (1-indexed)
            per_page: Items per page
        
        Returns:
            Tuple of (orders list, total count)
        """
        return OrderService.get_orders_with_filters(
            page=page,
            per_page=per_page,
            customer_id=customer_id
        )
    
    @staticmethod
    def get_order_statistics(date_from: Optional[str] = None, date_to: Optional[str] = None) -> Dict:
        """
        Get order statistics for a date range using aggregation.
        
        Args:
            date_from: Start date (ISO format string)
            date_to: End date (ISO format string)
        
        Returns:
            Dict containing order statistics
        """
        # Build match criteria for date range
        match_criteria = {}
        
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                match_criteria['created_at'] = {'$gte': date_from_obj}
            except (ValueError, AttributeError):
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                if 'created_at' in match_criteria:
                    match_criteria['created_at']['$lte'] = date_to_obj
                else:
                    match_criteria['created_at'] = {'$lte': date_to_obj}
            except (ValueError, AttributeError):
                pass
        
        # Use aggregation pipeline for efficient statistics calculation
        pipeline = [
            {'$match': match_criteria} if match_criteria else {'$match': {}},
            {
                '$facet': {
                    # Overall statistics
                    'overall': [
                        {
                            '$group': {
                                '_id': None,
                                'total_orders': {'$sum': 1},
                                'total_revenue': {'$sum': '$total_amount'}
                            }
                        }
                    ],
                    # Status breakdown
                    'status_breakdown': [
                        {
                            '$group': {
                                '_id': '$status',
                                'count': {'$sum': 1}
                            }
                        }
                    ],
                    # Payment status breakdown
                    'payment_breakdown': [
                        {
                            '$group': {
                                '_id': '$payment_status',
                                'count': {'$sum': 1}
                            }
                        }
                    ]
                }
            }
        ]
        
        result = list(Order.objects.aggregate(pipeline))
        
        if not result or not result[0]['overall']:
            return {
                'total_orders': 0,
                'total_revenue': 0.0,
                'average_order_value': 0.0,
                'status_breakdown': {
                    'pending': 0,
                    'processing': 0,
                    'completed': 0,
                    'cancelled': 0
                },
                'payment_breakdown': {
                    'unpaid': 0,
                    'partial': 0,
                    'paid': 0
                }
            }
        
        # Extract results
        overall = result[0]['overall'][0]
        total_orders = overall['total_orders']
        total_revenue = overall['total_revenue']
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        # Format status breakdown
        status_counts = {
            'pending': 0,
            'processing': 0,
            'completed': 0,
            'cancelled': 0
        }
        for item in result[0]['status_breakdown']:
            status_counts[item['_id']] = item['count']
        
        # Format payment breakdown
        payment_counts = {
            'unpaid': 0,
            'partial': 0,
            'paid': 0
        }
        for item in result[0]['payment_breakdown']:
            payment_counts[item['_id']] = item['count']
        
        return {
            'total_orders': total_orders,
            'total_revenue': round(total_revenue, 2),
            'average_order_value': round(avg_order_value, 2),
            'status_breakdown': status_counts,
            'payment_breakdown': payment_counts
        }
