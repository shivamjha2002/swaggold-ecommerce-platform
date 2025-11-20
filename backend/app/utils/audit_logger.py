"""Audit logging for security and compliance."""
import logging
from datetime import datetime
from typing import Dict, Optional, Any
from flask import request, has_request_context
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from mongoengine import Document, StringField, DictField, DateTimeField, IntField

logger = logging.getLogger(__name__)


class AuditLog(Document):
    """
    Audit log model for storing security and compliance events.
    
    This model stores all critical operations for audit trail and compliance.
    """
    # Event information
    event_type = StringField(required=True, max_length=100)
    event_category = StringField(required=True, max_length=50)  # payment, admin, auth, etc.
    event_action = StringField(required=True, max_length=100)  # create, update, delete, verify, etc.
    
    # User information
    user_id = StringField()
    user_email = StringField()
    user_role = StringField()
    
    # Request information
    ip_address = StringField()
    user_agent = StringField()
    endpoint = StringField()
    http_method = StringField(max_length=10)
    
    # Event details
    resource_type = StringField()  # order, payment, refund, etc.
    resource_id = StringField()
    details = DictField()  # Additional event-specific data
    
    # Status
    status = StringField(required=True, max_length=20)  # success, failure, error
    error_message = StringField()
    
    # Metadata
    timestamp = DateTimeField(required=True, default=datetime.utcnow)
    response_code = IntField()
    
    meta = {
        'collection': 'audit_logs',
        'indexes': [
            'event_type',
            'event_category',
            'user_id',
            'resource_id',
            'timestamp',
            {'fields': ['event_category', 'timestamp']},
            {'fields': ['user_id', 'timestamp']},
            {'fields': ['resource_type', 'resource_id']}
        ]
    }
    
    def to_dict(self) -> Dict:
        """Convert audit log to dictionary."""
        return {
            'id': str(self.id),
            'event_type': self.event_type,
            'event_category': self.event_category,
            'event_action': self.event_action,
            'user_id': self.user_id,
            'user_email': self.user_email,
            'user_role': self.user_role,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'endpoint': self.endpoint,
            'http_method': self.http_method,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'details': self.details,
            'status': self.status,
            'error_message': self.error_message,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'response_code': self.response_code
        }


class AuditLogger:
    """Audit logger for security and compliance events."""
    
    @staticmethod
    def _get_request_context() -> Dict:
        """
        Get request context information.
        
        Returns:
            Dict with IP address, user agent, endpoint, and method
        """
        if not has_request_context():
            return {
                'ip_address': None,
                'user_agent': None,
                'endpoint': None,
                'http_method': None
            }
        
        return {
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', '')[:500],  # Limit length
            'endpoint': request.endpoint,
            'http_method': request.method
        }
    
    @staticmethod
    def _get_user_context() -> Dict:
        """
        Get user context from JWT token.
        
        Returns:
            Dict with user_id, email, and role
        """
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            
            if user_id:
                # Try to get user details
                try:
                    from app.models.user import User
                    user = User.objects.get(id=user_id)
                    return {
                        'user_id': str(user.id),
                        'user_email': user.email,
                        'user_role': user.role
                    }
                except Exception:
                    return {
                        'user_id': str(user_id),
                        'user_email': None,
                        'user_role': None
                    }
        except Exception:
            pass
        
        return {
            'user_id': None,
            'user_email': None,
            'user_role': None
        }
    
    @staticmethod
    def log_event(
        event_type: str,
        event_category: str,
        event_action: str,
        status: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        response_code: Optional[int] = None
    ) -> AuditLog:
        """
        Log an audit event.
        
        Args:
            event_type: Type of event (e.g., 'payment_attempt', 'admin_refund')
            event_category: Category (payment, admin, auth, webhook, etc.)
            event_action: Action performed (create, update, delete, verify, etc.)
            status: Event status (success, failure, error)
            resource_type: Type of resource affected (order, payment, refund, etc.)
            resource_id: ID of the resource
            details: Additional event-specific data
            error_message: Error message if status is failure/error
            response_code: HTTP response code
            
        Returns:
            AuditLog: Created audit log entry
        """
        try:
            # Get context
            request_context = AuditLogger._get_request_context()
            user_context = AuditLogger._get_user_context()
            
            # Create audit log
            audit_log = AuditLog(
                event_type=event_type,
                event_category=event_category,
                event_action=event_action,
                status=status,
                resource_type=resource_type,
                resource_id=resource_id,
                details=details or {},
                error_message=error_message,
                response_code=response_code,
                **request_context,
                **user_context
            )
            
            audit_log.save()
            
            # Also log to application logger
            log_level = logging.INFO if status == 'success' else logging.WARNING
            logger.log(
                log_level,
                f'AUDIT: {event_category}.{event_action} | '
                f'Type: {event_type} | '
                f'Status: {status} | '
                f'User: {user_context["user_id"] or "anonymous"} | '
                f'Resource: {resource_type}:{resource_id} | '
                f'IP: {request_context["ip_address"]}'
            )
            
            return audit_log
            
        except Exception as e:
            # If audit logging fails, log the error but don't break the application
            logger.error(f'Failed to create audit log: {str(e)}', exc_info=True)
            return None
    
    @staticmethod
    def log_payment_attempt(
        order_id: str,
        razorpay_order_id: str,
        amount: float,
        status: str,
        error_message: Optional[str] = None
    ):
        """Log payment attempt."""
        return AuditLogger.log_event(
            event_type='payment_attempt',
            event_category='payment',
            event_action='create',
            status=status,
            resource_type='order',
            resource_id=order_id,
            details={
                'razorpay_order_id': razorpay_order_id,
                'amount': amount,
                'currency': 'INR'
            },
            error_message=error_message
        )
    
    @staticmethod
    def log_payment_verification(
        order_id: str,
        razorpay_payment_id: str,
        status: str,
        error_message: Optional[str] = None
    ):
        """Log payment verification."""
        return AuditLogger.log_event(
            event_type='payment_verification',
            event_category='payment',
            event_action='verify',
            status=status,
            resource_type='order',
            resource_id=order_id,
            details={
                'razorpay_payment_id': razorpay_payment_id
            },
            error_message=error_message
        )
    
    @staticmethod
    def log_webhook_event(
        event_type: str,
        razorpay_order_id: str,
        razorpay_payment_id: Optional[str],
        status: str,
        payload: Dict,
        error_message: Optional[str] = None
    ):
        """Log webhook event."""
        return AuditLogger.log_event(
            event_type=f'webhook_{event_type}',
            event_category='webhook',
            event_action='process',
            status=status,
            resource_type='payment',
            resource_id=razorpay_payment_id,
            details={
                'razorpay_order_id': razorpay_order_id,
                'event_type': event_type,
                'payload': payload  # Store full payload for compliance
            },
            error_message=error_message
        )
    
    @staticmethod
    def log_admin_action(
        action: str,
        resource_type: str,
        resource_id: str,
        status: str,
        details: Optional[Dict] = None,
        error_message: Optional[str] = None
    ):
        """Log admin action."""
        return AuditLogger.log_event(
            event_type=f'admin_{action}',
            event_category='admin',
            event_action=action,
            status=status,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            error_message=error_message
        )
    
    @staticmethod
    def log_refund(
        order_id: str,
        refund_id: str,
        amount: float,
        status: str,
        reason: Optional[str] = None,
        error_message: Optional[str] = None
    ):
        """Log refund operation."""
        return AuditLogger.log_event(
            event_type='refund_processed',
            event_category='admin',
            event_action='refund',
            status=status,
            resource_type='order',
            resource_id=order_id,
            details={
                'refund_id': refund_id,
                'amount': amount,
                'reason': reason
            },
            error_message=error_message
        )
    
    @staticmethod
    def log_order_status_change(
        order_id: str,
        old_status: str,
        new_status: str,
        status: str = 'success'
    ):
        """Log order status change."""
        return AuditLogger.log_event(
            event_type='order_status_change',
            event_category='admin',
            event_action='update',
            status=status,
            resource_type='order',
            resource_id=order_id,
            details={
                'old_status': old_status,
                'new_status': new_status
            }
        )


# Convenience functions
def log_payment_attempt(*args, **kwargs):
    """Convenience function for logging payment attempts."""
    return AuditLogger.log_payment_attempt(*args, **kwargs)


def log_payment_verification(*args, **kwargs):
    """Convenience function for logging payment verification."""
    return AuditLogger.log_payment_verification(*args, **kwargs)


def log_webhook_event(*args, **kwargs):
    """Convenience function for logging webhook events."""
    return AuditLogger.log_webhook_event(*args, **kwargs)


def log_admin_action(*args, **kwargs):
    """Convenience function for logging admin actions."""
    return AuditLogger.log_admin_action(*args, **kwargs)


def log_refund(*args, **kwargs):
    """Convenience function for logging refunds."""
    return AuditLogger.log_refund(*args, **kwargs)


def log_order_status_change(*args, **kwargs):
    """Convenience function for logging order status changes."""
    return AuditLogger.log_order_status_change(*args, **kwargs)
