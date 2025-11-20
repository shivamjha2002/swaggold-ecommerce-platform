"""Checkout service for order creation and validation."""
from typing import Dict, Optional
from datetime import datetime
import re
from mongoengine.errors import DoesNotExist
from app.models.cart import Cart
from app.models.order import Order, OrderItem
from app.models.address import ShippingAddress, BillingAddress
from app.models.customer import Customer
from app.models.product import Product
from app.utils.exceptions import ValidationError, ResourceNotFoundError
from app.utils.validators import (
    sanitize_data,
    sanitize_string,
    validate_mobile_number,
    validate_pin_code,
    validate_email,
    validate_string_length
)


class CheckoutService:
    """Checkout business logic service."""
    
    @staticmethod
    def validate_checkout_data(data: Dict) -> Dict:
        """
        Validate checkout data including address and contact information.
        
        Args:
            data: Checkout data dictionary containing shipping_address, billing_address, etc.
            
        Returns:
            Dict: Validated and sanitized data
            
        Raises:
            ValidationError: If validation fails
        """
        errors = {}
        
        # Sanitize all input data first
        data = sanitize_data(data)
        
        # Validate shipping address is present
        if 'shipping_address' not in data or not data['shipping_address']:
            raise ValidationError("Shipping address is required")
        
        shipping_address = data['shipping_address']
        
        # Validate required shipping address fields
        required_fields = ['full_name', 'mobile', 'address_line1', 'city', 'state', 'pin_code']
        for field in required_fields:
            if field not in shipping_address or not str(shipping_address[field]).strip():
                errors[f'shipping_address.{field}'] = f"{field.replace('_', ' ').title()} is required"
        
        # Validate and sanitize full_name
        if 'full_name' in shipping_address:
            try:
                shipping_address['full_name'] = sanitize_string(shipping_address['full_name'], max_length=200)
                is_valid, error = validate_string_length(shipping_address['full_name'], "Full name", min_length=1, max_length=200)
                if not is_valid:
                    errors['shipping_address.full_name'] = error
            except ValueError as e:
                errors['shipping_address.full_name'] = str(e)
        
        # Validate mobile number (10 digits)
        if 'mobile' in shipping_address:
            is_valid, result = validate_mobile_number(shipping_address['mobile'])
            if not is_valid:
                errors['shipping_address.mobile'] = result
            else:
                # Update with cleaned mobile
                shipping_address['mobile'] = result
        
        # Validate PIN code (6 digits for India)
        if 'pin_code' in shipping_address:
            is_valid, result = validate_pin_code(shipping_address['pin_code'])
            if not is_valid:
                errors['shipping_address.pin_code'] = result
            else:
                # Update with cleaned PIN code
                shipping_address['pin_code'] = result
        
        # Validate email if provided
        if 'email' in shipping_address and shipping_address['email']:
            is_valid, error = validate_email(shipping_address['email'])
            if not is_valid:
                errors['shipping_address.email'] = error
            else:
                # Normalize email to lowercase
                shipping_address['email'] = shipping_address['email'].strip().lower()
        
        # Validate and sanitize address fields
        if 'address_line1' in shipping_address:
            try:
                shipping_address['address_line1'] = sanitize_string(shipping_address['address_line1'], max_length=500)
                is_valid, error = validate_string_length(shipping_address['address_line1'], "Address line 1", min_length=1, max_length=500)
                if not is_valid:
                    errors['shipping_address.address_line1'] = error
            except ValueError as e:
                errors['shipping_address.address_line1'] = str(e)
        
        if 'address_line2' in shipping_address and shipping_address['address_line2']:
            try:
                shipping_address['address_line2'] = sanitize_string(shipping_address['address_line2'], max_length=500)
            except ValueError as e:
                errors['shipping_address.address_line2'] = str(e)
        
        if 'city' in shipping_address:
            try:
                shipping_address['city'] = sanitize_string(shipping_address['city'], max_length=100)
                is_valid, error = validate_string_length(shipping_address['city'], "City", min_length=1, max_length=100)
                if not is_valid:
                    errors['shipping_address.city'] = error
            except ValueError as e:
                errors['shipping_address.city'] = str(e)
        
        if 'state' in shipping_address:
            try:
                shipping_address['state'] = sanitize_string(shipping_address['state'], max_length=100)
                is_valid, error = validate_string_length(shipping_address['state'], "State", min_length=1, max_length=100)
                if not is_valid:
                    errors['shipping_address.state'] = error
            except ValueError as e:
                errors['shipping_address.state'] = str(e)
        
        if 'landmark' in shipping_address and shipping_address['landmark']:
            try:
                shipping_address['landmark'] = sanitize_string(shipping_address['landmark'], max_length=200)
            except ValueError as e:
                errors['shipping_address.landmark'] = str(e)
        
        # Handle billing address
        billing_is_same = data.get('billing_is_same_as_shipping', True)
        
        if billing_is_same:
            # Copy shipping address to billing address
            data['billing_address'] = {
                'full_name': shipping_address.get('full_name'),
                'mobile': shipping_address.get('mobile'),
                'email': shipping_address.get('email'),
                'address_line1': shipping_address.get('address_line1'),
                'address_line2': shipping_address.get('address_line2'),
                'city': shipping_address.get('city'),
                'state': shipping_address.get('state'),
                'pin_code': shipping_address.get('pin_code')
            }
        elif 'billing_address' in data and data['billing_address']:
            # Validate billing address if provided separately
            billing_address = data['billing_address']
            billing_required = ['full_name', 'mobile', 'address_line1', 'city', 'state', 'pin_code']
            
            for field in billing_required:
                if field not in billing_address or not str(billing_address[field]).strip():
                    errors[f'billing_address.{field}'] = f"{field.replace('_', ' ').title()} is required"
            
            # Validate and sanitize billing full_name
            if 'full_name' in billing_address:
                try:
                    billing_address['full_name'] = sanitize_string(billing_address['full_name'], max_length=200)
                except ValueError as e:
                    errors['billing_address.full_name'] = str(e)
            
            # Validate billing mobile
            if 'mobile' in billing_address:
                is_valid, result = validate_mobile_number(billing_address['mobile'])
                if not is_valid:
                    errors['billing_address.mobile'] = result
                else:
                    billing_address['mobile'] = result
            
            # Validate billing PIN code
            if 'pin_code' in billing_address:
                is_valid, result = validate_pin_code(billing_address['pin_code'])
                if not is_valid:
                    errors['billing_address.pin_code'] = result
                else:
                    billing_address['pin_code'] = result
            
            # Validate billing email if provided
            if 'email' in billing_address and billing_address['email']:
                is_valid, error = validate_email(billing_address['email'])
                if not is_valid:
                    errors['billing_address.email'] = error
                else:
                    billing_address['email'] = billing_address['email'].strip().lower()
            
            # Sanitize billing address fields
            if 'address_line1' in billing_address:
                try:
                    billing_address['address_line1'] = sanitize_string(billing_address['address_line1'], max_length=500)
                except ValueError as e:
                    errors['billing_address.address_line1'] = str(e)
            
            if 'address_line2' in billing_address and billing_address['address_line2']:
                try:
                    billing_address['address_line2'] = sanitize_string(billing_address['address_line2'], max_length=500)
                except ValueError as e:
                    errors['billing_address.address_line2'] = str(e)
            
            if 'city' in billing_address:
                try:
                    billing_address['city'] = sanitize_string(billing_address['city'], max_length=100)
                except ValueError as e:
                    errors['billing_address.city'] = str(e)
            
            if 'state' in billing_address:
                try:
                    billing_address['state'] = sanitize_string(billing_address['state'], max_length=100)
                except ValueError as e:
                    errors['billing_address.state'] = str(e)
        
        # Validate and sanitize custom fields if provided
        if 'custom_fields' in data and data['custom_fields']:
            if not isinstance(data['custom_fields'], dict):
                errors['custom_fields'] = "Custom fields must be a dictionary"
            else:
                # Sanitize all custom field values
                data['custom_fields'] = sanitize_data(data['custom_fields'])
                
                # Validate custom field values don't exceed reasonable lengths
                for key, value in data['custom_fields'].items():
                    if isinstance(value, str) and len(value) > 1000:
                        errors[f'custom_fields.{key}'] = f"Custom field '{key}' exceeds maximum length of 1000 characters"
        
        # Validate and sanitize notes if provided
        if 'notes' in data and data['notes']:
            try:
                data['notes'] = sanitize_string(data['notes'], max_length=2000)
            except ValueError as e:
                errors['notes'] = str(e)
        
        # If there are validation errors, raise exception
        if errors:
            raise ValidationError("Validation failed", details=errors)
        
        return data
    
    @staticmethod
    def create_order_from_cart(
        cart: Cart,
        checkout_data: Dict,
        gst_rate: float = 0.03,
        shipping_rate: float = 100.0,
        discount_amount: float = 0.0
    ) -> Order:
        """
        Convert cart to order with pending_payment status.
        
        Args:
            cart: Cart instance to convert
            checkout_data: Validated checkout data with addresses
            gst_rate: GST rate as decimal (default 3%)
            shipping_rate: Flat shipping rate (default 100 INR)
            discount_amount: Discount amount to subtract
            
        Returns:
            Order: Created order with pending_payment status
            
        Raises:
            ValidationError: If cart is empty or validation fails
            ResourceNotFoundError: If products not found
        """
        # Validate cart is not empty
        if not cart.items or len(cart.items) == 0:
            raise ValidationError("Cannot create order from empty cart")
        
        # Validate all products still exist and have sufficient stock
        # IMPORTANT: Recalculate prices from database to prevent price tampering
        order_items = []
        subtotal = 0.0
        
        for cart_item in cart.items:
            try:
                product = Product.objects.get(id=cart_item.product_id, is_active=True)
            except DoesNotExist:
                raise ResourceNotFoundError(
                    "Product",
                    cart_item.product_id,
                    details=f"Product '{cart_item.product_name}' is no longer available"
                )
            
            # Validate stock
            if product.stock_quantity < cart_item.quantity:
                raise ValidationError(
                    f"Insufficient stock for product '{product.name}'. "
                    f"Available: {product.stock_quantity}, Requested: {cart_item.quantity}"
                )
            
            # SECURITY: Always use current price from database, never trust cart prices
            # This prevents price tampering attacks
            current_unit_price = product.base_price
            calculated_total_price = round(current_unit_price * cart_item.quantity, 2)
            
            # Log if price mismatch detected (possible tampering attempt)
            if abs(cart_item.unit_price - current_unit_price) > 0.01:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(
                    f"Price mismatch detected for product {product.id}: "
                    f"cart_price={cart_item.unit_price}, db_price={current_unit_price}. "
                    f"Using database price."
                )
            
            # Create order item with validated prices from database
            order_item = OrderItem(
                product_id=str(product.id),
                product_name=product.name,
                product_category=product.category,
                quantity=cart_item.quantity,
                unit_price=current_unit_price,  # Use database price
                total_price=calculated_total_price,  # Recalculated total
                weight=product.weight,
                gold_purity=product.gold_purity
            )
            order_items.append(order_item)
            subtotal += calculated_total_price  # Use recalculated total
        
        # Server-side amount calculation
        gst_amount = round(subtotal * gst_rate, 2)
        shipping_amount = shipping_rate if subtotal > 0 else 0.0
        total_amount = round(subtotal + gst_amount + shipping_amount - discount_amount, 2)
        
        # Create shipping address
        shipping_data = checkout_data['shipping_address']
        shipping_address = ShippingAddress(
            full_name=shipping_data['full_name'],
            mobile=shipping_data['mobile'],
            email=shipping_data.get('email'),
            address_line1=shipping_data['address_line1'],
            address_line2=shipping_data.get('address_line2'),
            city=shipping_data['city'],
            state=shipping_data['state'],
            pin_code=shipping_data['pin_code'],
            landmark=shipping_data.get('landmark'),
            preferred_delivery_date=shipping_data.get('preferred_delivery_date')
        )
        
        # Create billing address
        billing_data = checkout_data.get('billing_address', checkout_data['shipping_address'])
        billing_address = BillingAddress(
            full_name=billing_data['full_name'],
            mobile=billing_data['mobile'],
            email=billing_data.get('email'),
            address_line1=billing_data['address_line1'],
            address_line2=billing_data.get('address_line2'),
            city=billing_data['city'],
            state=billing_data['state'],
            pin_code=billing_data['pin_code']
        )
        
        # Get or create customer
        customer = CheckoutService._get_or_create_customer(
            name=shipping_data['full_name'],
            phone=shipping_data['mobile'],
            email=shipping_data.get('email'),
            address=f"{shipping_data['address_line1']}, {shipping_data['city']}, {shipping_data['state']} - {shipping_data['pin_code']}"
        )
        
        # Create order
        order = Order(
            order_number=Order.generate_order_number(),
            customer_id=customer,
            customer_name=customer.name,
            customer_phone=customer.phone,
            customer_email=customer.email,
            customer_address=customer.address,
            shipping_address=shipping_address,
            billing_address=billing_address,
            items=order_items,
            subtotal=subtotal,
            gst_amount=gst_amount,
            shipping_amount=shipping_amount,
            discount_amount=discount_amount,
            total_amount=total_amount,
            status='pending_payment',
            payment_status='unpaid',
            payment_method='razorpay',
            custom_fields=checkout_data.get('custom_fields', {}),
            notes=checkout_data.get('notes', '')
        )
        
        order.save()
        return order
    
    @staticmethod
    def _get_or_create_customer(
        name: str,
        phone: str,
        email: Optional[str] = None,
        address: Optional[str] = None
    ) -> Customer:
        """
        Get existing customer by phone or create new one.
        
        Args:
            name: Customer name
            phone: Customer phone number
            email: Customer email (optional)
            address: Customer address (optional)
            
        Returns:
            Customer: Existing or newly created customer
        """
        # Try to find existing customer by phone
        customer = Customer.objects(phone=phone).first()
        
        if customer:
            # Update customer info if changed
            updated = False
            if customer.name != name:
                customer.name = name
                updated = True
            if email and customer.email != email:
                customer.email = email
                updated = True
            if address and customer.address != address:
                customer.address = address
                updated = True
            
            if updated:
                customer.save()
        else:
            # Create new customer
            customer = Customer(
                name=name,
                phone=phone,
                email=email,
                address=address,
                current_balance=0.0
            )
            customer.save()
        
        return customer
    
    @staticmethod
    def validate_and_calculate_amounts(
        cart: Cart,
        client_total: Optional[float] = None,
        gst_rate: float = 0.03,
        shipping_rate: float = 100.0,
        discount_amount: float = 0.0
    ) -> Dict:
        """
        Server-side amount calculation and validation.
        
        SECURITY: All amounts are calculated server-side from database prices.
        Client-provided amounts are NEVER used for order creation.
        
        Args:
            cart: Cart instance
            client_total: Total amount sent by client (for validation only, not used)
            gst_rate: GST rate as decimal
            shipping_rate: Flat shipping rate
            discount_amount: Discount amount
            
        Returns:
            Dict: Calculated amounts (server-side only)
            
        Raises:
            ValidationError: If client_total doesn't match server calculation
        """
        # SECURITY: Recalculate subtotal from database prices to prevent tampering
        subtotal = 0.0
        
        for cart_item in cart.items:
            try:
                # Fetch current price from database
                product = Product.objects.get(id=cart_item.product_id, is_active=True)
                current_price = product.base_price
                item_total = round(current_price * cart_item.quantity, 2)
                subtotal += item_total
            except DoesNotExist:
                # Product no longer exists, skip it
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Product {cart_item.product_id} not found during amount calculation")
                continue
        
        # Calculate all amounts server-side
        gst_amount = round(subtotal * gst_rate, 2)
        shipping_amount = shipping_rate if subtotal > 0 else 0.0
        total_amount = round(subtotal + gst_amount + shipping_amount - discount_amount, 2)
        
        # Validate against client-provided total if present (for user feedback only)
        # IMPORTANT: We never use client_total for order creation
        if client_total is not None:
            # Allow small floating point differences (1 paisa)
            if abs(total_amount - client_total) > 0.01:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(
                    f"Amount mismatch detected: server={total_amount:.2f}, "
                    f"client={client_total:.2f}, diff={abs(total_amount - client_total):.2f}"
                )
                raise ValidationError(
                    f"Amount mismatch. Server calculated: ₹{total_amount:.2f}, "
                    f"Client sent: ₹{client_total:.2f}. Please refresh and try again."
                )
        
        return {
            'subtotal': subtotal,
            'gst_rate': gst_rate,
            'gst_amount': gst_amount,
            'shipping_amount': shipping_amount,
            'discount_amount': discount_amount,
            'total_amount': total_amount
        }
