"""Cart service for business logic."""
from typing import Dict, Optional
from datetime import datetime
from mongoengine.errors import DoesNotExist
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.user import User
from app.utils.exceptions import ValidationError, ResourceNotFoundError


class CartService:
    """Cart business logic service."""
    
    @staticmethod
    def get_or_create_cart(user_id: Optional[str] = None, session_id: Optional[str] = None) -> Cart:
        """
        Retrieve or initialize cart for user/session.
        
        Args:
            user_id: User ID for authenticated users
            session_id: Session ID for guest users
            
        Returns:
            Cart: Existing or newly created cart
            
        Raises:
            ValidationError: If neither user_id nor session_id provided
        """
        if not user_id and not session_id:
            raise ValidationError("Either user_id or session_id must be provided")
        
        # Try to find existing cart
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                cart = Cart.objects(user_id=user).first()
            except DoesNotExist:
                raise ResourceNotFoundError(f"User with id {user_id} not found")
        else:
            cart = Cart.objects(session_id=session_id).first()
            user = None
        
        # Create new cart if not found
        if not cart:
            cart = Cart(
                user_id=user if user else None,
                session_id=session_id if not user else None,
                items=[],
                subtotal=0.0
            )
            cart.save()
        
        return cart
    
    @staticmethod
    def add_item(
        cart: Cart,
        product_id: str,
        quantity: int,
        variant_id: Optional[str] = None
    ) -> Cart:
        """
        Add product to cart with quantity validation.
        
        Args:
            cart: Cart instance
            product_id: Product ID to add
            quantity: Quantity to add
            variant_id: Optional variant identifier
            
        Returns:
            Cart: Updated cart
            
        Raises:
            ResourceNotFoundError: If product not found
            ValidationError: If quantity invalid or insufficient stock
        """
        if quantity < 1:
            raise ValidationError("Quantity must be at least 1")
        
        # Fetch product
        try:
            product = Product.objects.get(id=product_id, is_active=True, status='published')
        except DoesNotExist:
            raise ResourceNotFoundError(f"Product with id {product_id} not found")
        
        # Validate stock
        if product.stock_quantity < quantity:
            raise ValidationError(
                f"Insufficient stock. Available: {product.stock_quantity}, Requested: {quantity}"
            )
        
        # Check if item already exists in cart
        existing_item = None
        for item in cart.items:
            if item.product_id == product_id and item.variant_id == variant_id:
                existing_item = item
                break
        
        if existing_item:
            # Update existing item
            new_quantity = existing_item.quantity + quantity
            
            # Validate total quantity against stock
            if product.stock_quantity < new_quantity:
                raise ValidationError(
                    f"Insufficient stock. Available: {product.stock_quantity}, "
                    f"Cart has: {existing_item.quantity}, Requested: {quantity}"
                )
            
            existing_item.quantity = new_quantity
            existing_item.total_price = existing_item.unit_price * new_quantity
        else:
            # Add new item
            unit_price = product.base_price
            cart_item = CartItem(
                product_id=str(product.id),
                product_name=product.name,
                variant_id=variant_id,
                quantity=quantity,
                unit_price=unit_price,
                total_price=unit_price * quantity,
                image_url=product.image_url,
                weight=product.weight,
                gold_purity=product.gold_purity
            )
            cart.items.append(cart_item)
        
        # Recalculate subtotal
        cart.calculate_subtotal()
        cart.save()
        
        return cart

    @staticmethod
    def update_item_quantity(
        cart: Cart,
        product_id: str,
        quantity: int,
        variant_id: Optional[str] = None
    ) -> Cart:
        """
        Update item quantity with stock validation.
        
        Args:
            cart: Cart instance
            product_id: Product ID to update
            quantity: New quantity (0 to remove)
            variant_id: Optional variant identifier
            
        Returns:
            Cart: Updated cart
            
        Raises:
            ResourceNotFoundError: If product or cart item not found
            ValidationError: If quantity invalid or insufficient stock
        """
        if quantity < 0:
            raise ValidationError("Quantity cannot be negative")
        
        # Find cart item
        cart_item = None
        for item in cart.items:
            if item.product_id == product_id and item.variant_id == variant_id:
                cart_item = item
                break
        
        if not cart_item:
            raise ResourceNotFoundError(
                f"Product {product_id} not found in cart"
            )
        
        # If quantity is 0, remove item
        if quantity == 0:
            return CartService.remove_item(cart, product_id, variant_id)
        
        # Fetch product for stock validation
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except DoesNotExist:
            raise ResourceNotFoundError(f"Product with id {product_id} not found")
        
        # Validate stock
        if product.stock_quantity < quantity:
            raise ValidationError(
                f"Insufficient stock. Available: {product.stock_quantity}, Requested: {quantity}"
            )
        
        # Update quantity and total
        cart_item.quantity = quantity
        cart_item.total_price = cart_item.unit_price * quantity
        
        # Recalculate subtotal
        cart.calculate_subtotal()
        cart.save()
        
        return cart
    
    @staticmethod
    def remove_item(
        cart: Cart,
        product_id: str,
        variant_id: Optional[str] = None
    ) -> Cart:
        """
        Remove item from cart.
        
        Args:
            cart: Cart instance
            product_id: Product ID to remove
            variant_id: Optional variant identifier
            
        Returns:
            Cart: Updated cart
            
        Raises:
            ResourceNotFoundError: If cart item not found
        """
        # Find and remove cart item
        item_to_remove = None
        for item in cart.items:
            if item.product_id == product_id and item.variant_id == variant_id:
                item_to_remove = item
                break
        
        if not item_to_remove:
            raise ResourceNotFoundError(
                f"Product {product_id} not found in cart"
            )
        
        cart.items.remove(item_to_remove)
        
        # Recalculate subtotal
        cart.calculate_subtotal()
        cart.save()
        
        return cart
    
    @staticmethod
    def calculate_cart_totals(
        cart: Cart,
        gst_rate: float = 0.03,
        shipping_rate: float = 100.0,
        discount_amount: float = 0.0
    ) -> Dict:
        """
        Calculate subtotal, GST, shipping, and total.
        
        Args:
            cart: Cart instance
            gst_rate: GST rate as decimal (default 3% = 0.03)
            shipping_rate: Flat shipping rate (default 100 INR)
            discount_amount: Discount amount to subtract
            
        Returns:
            Dict: Dictionary with all calculated amounts
        """
        subtotal = cart.subtotal
        gst_amount = round(subtotal * gst_rate, 2)
        shipping_amount = shipping_rate if subtotal > 0 else 0.0
        discount = discount_amount
        total = round(subtotal + gst_amount + shipping_amount - discount, 2)
        
        return {
            'subtotal': subtotal,
            'gst_rate': gst_rate,
            'gst_amount': gst_amount,
            'shipping_amount': shipping_amount,
            'discount_amount': discount,
            'total': total,
            'item_count': len(cart.items)
        }
    
    @staticmethod
    def sync_guest_cart_on_login(session_id: str, user_id: str) -> Cart:
        """
        Merge guest cart with user cart on login.
        
        Args:
            session_id: Guest session ID
            user_id: User ID after login
            
        Returns:
            Cart: Merged user cart
            
        Raises:
            ResourceNotFoundError: If user not found
        """
        # Get guest cart
        guest_cart = Cart.objects(session_id=session_id).first()
        
        if not guest_cart or not guest_cart.items:
            # No guest cart or empty, just return/create user cart
            return CartService.get_or_create_cart(user_id=user_id)
        
        # Get or create user cart
        try:
            user = User.objects.get(id=user_id)
        except DoesNotExist:
            raise ResourceNotFoundError(f"User with id {user_id} not found")
        
        user_cart = Cart.objects(user_id=user).first()
        
        if not user_cart:
            # No existing user cart, convert guest cart to user cart
            guest_cart.user_id = user
            guest_cart.session_id = None
            guest_cart.save()
            return guest_cart
        
        # Merge guest cart items into user cart
        for guest_item in guest_cart.items:
            # Check if item already exists in user cart
            existing_item = None
            for user_item in user_cart.items:
                if (user_item.product_id == guest_item.product_id and 
                    user_item.variant_id == guest_item.variant_id):
                    existing_item = user_item
                    break
            
            if existing_item:
                # Merge quantities
                try:
                    product = Product.objects.get(id=guest_item.product_id, is_active=True)
                    new_quantity = existing_item.quantity + guest_item.quantity
                    
                    # Validate against stock
                    if product.stock_quantity >= new_quantity:
                        existing_item.quantity = new_quantity
                        existing_item.total_price = existing_item.unit_price * new_quantity
                    else:
                        # Use maximum available stock
                        existing_item.quantity = min(product.stock_quantity, new_quantity)
                        existing_item.total_price = existing_item.unit_price * existing_item.quantity
                except DoesNotExist:
                    # Product no longer exists, skip
                    continue
            else:
                # Add guest item to user cart
                user_cart.items.append(guest_item)
        
        # Recalculate and save user cart
        user_cart.calculate_subtotal()
        user_cart.save()
        
        # Delete guest cart
        guest_cart.delete()
        
        return user_cart
    
    @staticmethod
    def clear_cart(cart: Cart) -> None:
        """
        Clear all items from cart (post-checkout cleanup).
        
        Args:
            cart: Cart instance to clear
        """
        cart.items = []
        cart.subtotal = 0.0
        cart.save()
