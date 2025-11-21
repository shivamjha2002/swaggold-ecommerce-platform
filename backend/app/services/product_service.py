"""Product service for business logic."""
from typing import Dict, List, Optional, Tuple
from mongoengine import Q
from app.models.product import Product


class ProductService:
    """Product business logic service."""
    
    @staticmethod
    def create_product(data: Dict) -> Product:
        """
        Create a new product.
        
        Args:
            data: Product data dictionary
            
        Returns:
            Product: Created product instance
        """
        product = Product(
            name=data['name'],
            category=data['category'],
            base_price=data['base_price'],
            weight=data['weight'],
            gold_purity=data.get('gold_purity', '916'),
            description=data.get('description', ''),
            image_url=data.get('image_url', ''),
            stock_quantity=data.get('stock_quantity', 0),
            status=data.get('status', 'draft')  # Default to draft
        )
        product.save()
        return product
    
    @staticmethod
    def get_product_by_id(product_id: str) -> Optional[Product]:
        """
        Get product by ID.
        
        Args:
            product_id: Product ID
            
        Returns:
            Product or None if not found
        """
        try:
            return Product.objects(id=product_id, is_active=True).first()
        except Exception:
            return None
    
    @staticmethod
    def update_product(product_id: str, data: Dict) -> Optional[Product]:
        """
        Update product.
        
        Args:
            product_id: Product ID
            data: Updated product data
            
        Returns:
            Updated Product or None if not found
        """
        product = ProductService.get_product_by_id(product_id)
        if not product:
            return None
        
        # Update fields if provided
        if 'name' in data:
            product.name = data['name']
        if 'category' in data:
            product.category = data['category']
        if 'base_price' in data:
            product.base_price = data['base_price']
        if 'weight' in data:
            product.weight = data['weight']
        if 'gold_purity' in data:
            product.gold_purity = data['gold_purity']
        if 'description' in data:
            product.description = data['description']
        if 'image_url' in data:
            product.image_url = data['image_url']
        if 'stock_quantity' in data:
            product.stock_quantity = data['stock_quantity']
        if 'status' in data:
            product.status = data['status']
            # Update published_at if changing to published
            if data['status'] == 'published' and product.status != 'published':
                from datetime import datetime
                product.published_at = datetime.utcnow()
            elif data['status'] == 'draft':
                product.published_at = None
        
        product.save()
        return product
    
    @staticmethod
    def delete_product(product_id: str) -> bool:
        """
        Soft delete product by setting is_active to False.
        
        Args:
            product_id: Product ID
            
        Returns:
            bool: True if deleted, False if not found
        """
        product = ProductService.get_product_by_id(product_id)
        if not product:
            return False
        
        product.is_active = False
        product.save()
        return True
    
    @staticmethod
    def get_products_with_filters(
        page: int = 1,
        per_page: int = 20,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_weight: Optional[float] = None,
        max_weight: Optional[float] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Product], int]:
        """
        Get published products with pagination and filtering (public endpoint).
        
        Args:
            page: Page number (1-indexed)
            per_page: Items per page
            category: Filter by category
            min_price: Minimum base price
            max_price: Maximum base price
            min_weight: Minimum weight
            max_weight: Maximum weight
            search: Search term for name
            
        Returns:
            Tuple of (products list, total count)
        """
        # Build query - only published products for public
        query = Q(is_active=True, status='published')
        
        if category:
            query &= Q(category=category)
        
        if min_price is not None:
            query &= Q(base_price__gte=min_price)
        
        if max_price is not None:
            query &= Q(base_price__lte=max_price)
        
        if min_weight is not None:
            query &= Q(weight__gte=min_weight)
        
        if max_weight is not None:
            query &= Q(weight__lte=max_weight)
        
        if search:
            query &= Q(name__icontains=search)
        
        # Get total count efficiently
        total = Product.objects(query).count()
        
        # Apply pagination with projection to limit fields
        skip = (page - 1) * per_page
        products = Product.objects(query).only(
            'name', 'category', 'base_price', 'weight', 'gold_purity',
            'description', 'image_url', 'stock_quantity', 'status',
            'published_at', 'created_at', 'updated_at'
        ).skip(skip).limit(per_page).order_by('-created_at')
        
        return list(products), total
    
    @staticmethod
    def get_admin_products_with_filters(
        page: int = 1,
        per_page: int = 20,
        category: Optional[str] = None,
        status: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_weight: Optional[float] = None,
        max_weight: Optional[float] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Product], int]:
        """
        Get all products with pagination and filtering (admin endpoint).
        
        Args:
            page: Page number (1-indexed)
            per_page: Items per page
            category: Filter by category
            status: Filter by status (draft/published)
            min_price: Minimum base price
            max_price: Maximum base price
            min_weight: Minimum weight
            max_weight: Maximum weight
            search: Search term for name
            
        Returns:
            Tuple of (products list, total count)
        """
        # Build query - all active products for admin
        query = Q(is_active=True)
        
        if status:
            query &= Q(status=status)
        
        if category:
            query &= Q(category=category)
        
        if min_price is not None:
            query &= Q(base_price__gte=min_price)
        
        if max_price is not None:
            query &= Q(base_price__lte=max_price)
        
        if min_weight is not None:
            query &= Q(weight__gte=min_weight)
        
        if max_weight is not None:
            query &= Q(weight__lte=max_weight)
        
        if search:
            query &= Q(name__icontains=search)
        
        # Get total count efficiently
        total = Product.objects(query).count()
        
        # Apply pagination with projection to limit fields
        skip = (page - 1) * per_page
        products = Product.objects(query).only(
            'name', 'category', 'base_price', 'weight', 'gold_purity',
            'description', 'image_url', 'stock_quantity', 'status',
            'published_at', 'is_active', 'created_at', 'updated_at'
        ).skip(skip).limit(per_page).order_by('-created_at')
        
        return list(products), total
    
    @staticmethod
    def publish_product(product_id: str) -> Optional[Product]:
        """
        Publish a draft product.
        
        Args:
            product_id: Product ID
            
        Returns:
            Published Product or None if not found
        """
        try:
            product = Product.objects(id=product_id, is_active=True).first()
            if product:
                product.publish()
                return product
            return None
        except Exception:
            return None
    
    @staticmethod
    def unpublish_product(product_id: str) -> Optional[Product]:
        """
        Unpublish a product back to draft.
        
        Args:
            product_id: Product ID
            
        Returns:
            Unpublished Product or None if not found
        """
        try:
            product = Product.objects(id=product_id, is_active=True).first()
            if product:
                product.unpublish()
                return product
            return None
        except Exception:
            return None
    
    @staticmethod
    def calculate_current_price(product: Product, gold_rate: Optional[float] = None) -> float:
        """
        Calculate current price for a product based on gold rates.
        
        Args:
            product: Product instance
            gold_rate: Optional gold rate per gram (fetches from DB if not provided)
            
        Returns:
            float: Calculated current price
        """
        return product.calculate_current_price(gold_rate)
