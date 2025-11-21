"""Payment service for Razorpay integration.

SECURITY NOTES:
- All Razorpay API calls use HTTPS automatically (enforced by razorpay library)
- API keys are loaded from environment variables only
- Secret key is NEVER exposed to client
- All payment signatures are verified using HMAC SHA256
- Webhook signatures are verified before processing events
"""
import os
import hmac
import hashlib
import logging
import time
from typing import Dict, Optional
import razorpay
from app.models.order import Order
from app.models.payment_transaction import PaymentTransaction
from app.utils.exceptions import ValidationError, PaymentError
from mongoengine.errors import DoesNotExist


logger = logging.getLogger(__name__)


class PaymentService:
    """
    Payment service for Razorpay operations.
    
    SECURITY:
    - Razorpay keys are loaded from environment variables only
    - Secret key is never exposed in API responses
    - All API calls use HTTPS (enforced by razorpay library)
    - Signature verification uses constant-time comparison
    """
    
    def __init__(self):
        """
        Initialize Razorpay client with credentials from environment.
        
        SECURITY: Keys must be set in environment variables:
        - RAZORPAY_KEY_ID: Public key (safe to expose to client)
        - RAZORPAY_KEY_SECRET: Secret key (NEVER expose to client)
        - RAZORPAY_WEBHOOK_SECRET: Webhook signature secret
        """
        self.key_id = os.environ.get('RAZORPAY_KEY_ID')
        self.key_secret = os.environ.get('RAZORPAY_KEY_SECRET')
        
        # Validate key format
        if self.key_id and not self.key_id.startswith('rzp_'):
            logger.error(
                f'Invalid RAZORPAY_KEY_ID format: {self.key_id[:10]}... '
                f'(should start with rzp_)'
            )
        
        if not self.key_id or not self.key_secret:
            logger.warning(
                'Razorpay credentials not configured. '
                'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.'
            )
            self.client = None
        else:
            try:
                # Initialize Razorpay client
                # The razorpay library automatically uses HTTPS for all API calls
                self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
                logger.info('Razorpay client initialized successfully')
            except Exception as e:
                logger.error(f'Failed to initialize Razorpay client: {str(e)}')
                self.client = None
    
    def create_razorpay_order(
        self,
        amount: float,
        currency: str = 'INR',
        receipt: Optional[str] = None,
        notes: Optional[Dict] = None
    ) -> Dict:
        """
        Create a Razorpay order using Orders API.
        
        Args:
            amount: Order amount in INR (will be converted to paise)
            currency: Currency code (default: INR)
            receipt: Receipt ID for reference (optional)
            notes: Additional notes dictionary (optional)
            
        Returns:
            Dict: Razorpay order response containing order_id, amount, currency, etc.
            
        Raises:
            PaymentError: If Razorpay API call fails
            ValidationError: If amount is invalid
        """
        if not self.client:
            raise PaymentError(
                'Razorpay client not initialized. Check credentials configuration.'
            )
        
        # Validate amount
        if amount <= 0:
            raise ValidationError(f'Invalid amount: {amount}. Amount must be greater than 0.')
        
        # Convert amount to paise (smallest currency unit)
        amount_in_paise = int(amount * 100)
        
        # Prepare order data
        order_data = {
            'amount': amount_in_paise,
            'currency': currency,
            'payment_capture': 1  # Auto-capture payment
        }
        
        if receipt:
            order_data['receipt'] = receipt
        
        if notes:
            order_data['notes'] = notes
        
        # Create order with retry logic
        max_retries = 3
        retry_delay = 1  # seconds
        
        for attempt in range(max_retries):
            try:
                logger.info(
                    f'Creating Razorpay order: amount={amount}, '
                    f'currency={currency}, receipt={receipt}, attempt={attempt + 1}'
                )
                
                response = self.client.order.create(data=order_data)
                
                logger.info(
                    f'Razorpay order created successfully: '
                    f'order_id={response.get("id")}, amount={response.get("amount")}'
                )
                
                return response
                
            except razorpay.errors.BadRequestError as e:
                logger.error(f'Razorpay bad request error: {str(e)}')
                raise PaymentError(f'Invalid payment request: {str(e)}')
            
            except razorpay.errors.ServerError as e:
                logger.warning(
                    f'Razorpay server error (attempt {attempt + 1}/{max_retries}): {str(e)}'
                )
                
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
                    continue
                else:
                    raise PaymentError(
                        'Razorpay service temporarily unavailable. Please try again later.'
                    )
            
            except Exception as e:
                logger.error(f'Unexpected error creating Razorpay order: {str(e)}')
                raise PaymentError(f'Failed to create payment order: {str(e)}')
        
        raise PaymentError('Failed to create Razorpay order after multiple attempts')
    
    def verify_signature(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str
    ) -> bool:
        """
        Verify Razorpay payment signature using HMAC SHA256.
        
        Args:
            razorpay_order_id: Razorpay order ID
            razorpay_payment_id: Razorpay payment ID
            razorpay_signature: Signature to verify
            
        Returns:
            bool: True if signature is valid, False otherwise
        """
        if not self.key_secret:
            logger.error('Cannot verify signature: Razorpay key secret not configured')
            return False
        
        try:
            # Create message to verify: order_id|payment_id
            message = f'{razorpay_order_id}|{razorpay_payment_id}'
            
            # Generate expected signature using HMAC SHA256
            expected_signature = hmac.new(
                key=self.key_secret.encode('utf-8'),
                msg=message.encode('utf-8'),
                digestmod=hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            is_valid = hmac.compare_digest(expected_signature, razorpay_signature)
            
            if is_valid:
                logger.info(
                    f'Payment signature verified successfully: '
                    f'order_id={razorpay_order_id}, payment_id={razorpay_payment_id}'
                )
            else:
                logger.warning(
                    f'Payment signature verification failed: '
                    f'order_id={razorpay_order_id}, payment_id={razorpay_payment_id}'
                )
            
            return is_valid
            
        except Exception as e:
            logger.error(f'Error verifying payment signature: {str(e)}')
            return False
    
    def capture_payment(self, payment_id: str, amount: float, currency: str = 'INR') -> Dict:
        """
        Manually capture a payment (for manual capture mode).
        
        Args:
            payment_id: Razorpay payment ID
            amount: Amount to capture in INR
            currency: Currency code (default: INR)
            
        Returns:
            Dict: Razorpay payment capture response
            
        Raises:
            PaymentError: If capture fails
        """
        if not self.client:
            raise PaymentError('Razorpay client not initialized')
        
        # Convert amount to paise
        amount_in_paise = int(amount * 100)
        
        try:
            logger.info(f'Capturing payment: payment_id={payment_id}, amount={amount}')
            
            response = self.client.payment.capture(
                payment_id,
                amount_in_paise,
                {'currency': currency}
            )
            
            logger.info(f'Payment captured successfully: payment_id={payment_id}')
            
            return response
            
        except razorpay.errors.BadRequestError as e:
            logger.error(f'Failed to capture payment: {str(e)}')
            raise PaymentError(f'Payment capture failed: {str(e)}')
        
        except Exception as e:
            logger.error(f'Unexpected error capturing payment: {str(e)}')
            raise PaymentError(f'Failed to capture payment: {str(e)}')
    
    def fetch_payment_details(self, payment_id: str) -> Dict:
        """
        Fetch payment details from Razorpay.
        
        Args:
            payment_id: Razorpay payment ID
            
        Returns:
            Dict: Payment details from Razorpay
            
        Raises:
            PaymentError: If fetch fails
        """
        if not self.client:
            raise PaymentError('Razorpay client not initialized')
        
        try:
            logger.info(f'Fetching payment details: payment_id={payment_id}')
            
            response = self.client.payment.fetch(payment_id)
            
            logger.info(
                f'Payment details fetched: payment_id={payment_id}, '
                f'status={response.get("status")}, method={response.get("method")}'
            )
            
            return response
            
        except razorpay.errors.BadRequestError as e:
            logger.error(f'Payment not found: {str(e)}')
            raise PaymentError(f'Payment not found: {str(e)}')
        
        except Exception as e:
            logger.error(f'Error fetching payment details: {str(e)}')
            raise PaymentError(f'Failed to fetch payment details: {str(e)}')
    
    def verify_webhook_signature(self, payload: str, signature: str) -> bool:
        """
        Verify Razorpay webhook signature.
        
        Args:
            payload: Raw webhook payload (as string)
            signature: X-Razorpay-Signature header value
            
        Returns:
            bool: True if signature is valid, False otherwise
        """
        webhook_secret = os.environ.get('RAZORPAY_WEBHOOK_SECRET')
        
        if not webhook_secret:
            logger.error('Cannot verify webhook: RAZORPAY_WEBHOOK_SECRET not configured')
            return False
        
        try:
            # Generate expected signature
            expected_signature = hmac.new(
                key=webhook_secret.encode('utf-8'),
                msg=payload.encode('utf-8'),
                digestmod=hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            is_valid = hmac.compare_digest(expected_signature, signature)
            
            if is_valid:
                logger.info('Webhook signature verified successfully')
            else:
                logger.warning('Webhook signature verification failed')
            
            return is_valid
            
        except Exception as e:
            logger.error(f'Error verifying webhook signature: {str(e)}')
            return False
    
    def process_refund(
        self,
        payment_id: str,
        amount: Optional[float] = None,
        notes: Optional[Dict] = None
    ) -> Dict:
        """
        Process a refund through Razorpay Refund API.
        
        Args:
            payment_id: Razorpay payment ID to refund
            amount: Amount to refund in INR (None for full refund)
            notes: Additional notes dictionary (optional)
            
        Returns:
            Dict: Razorpay refund response containing refund_id, amount, status, etc.
            
        Raises:
            PaymentError: If refund API call fails
            ValidationError: If amount is invalid
        """
        if not self.client:
            raise PaymentError('Razorpay client not initialized')
        
        try:
            # Prepare refund data
            refund_data = {}
            
            # If amount is specified, validate and convert to paise
            if amount is not None:
                if amount <= 0:
                    raise ValidationError(f'Invalid refund amount: {amount}. Amount must be greater than 0.')
                refund_data['amount'] = int(amount * 100)  # Convert to paise
            
            # Add notes if provided
            if notes:
                refund_data['notes'] = notes
            
            logger.info(
                f'Processing refund: payment_id={payment_id}, '
                f'amount={amount if amount else "full"}, notes={notes}'
            )
            
            # Call Razorpay refund API
            response = self.client.payment.refund(payment_id, refund_data)
            
            logger.info(
                f'Refund processed successfully: '
                f'refund_id={response.get("id")}, '
                f'amount={response.get("amount")}, '
                f'status={response.get("status")}'
            )
            
            return response
            
        except razorpay.errors.BadRequestError as e:
            logger.error(f'Razorpay refund bad request error: {str(e)}')
            raise PaymentError(f'Invalid refund request: {str(e)}')
        
        except razorpay.errors.ServerError as e:
            logger.error(f'Razorpay refund server error: {str(e)}')
            raise PaymentError('Razorpay service temporarily unavailable. Please try again later.')
        
        except Exception as e:
            logger.error(f'Unexpected error processing refund: {str(e)}')
            raise PaymentError(f'Failed to process refund: {str(e)}')


# Create a singleton instance
payment_service = PaymentService()
