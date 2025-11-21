"""Notification service for sending email/SMS notifications."""
import os
import logging
from typing import Optional, Dict
from datetime import datetime

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending notifications to customers."""
    
    def __init__(self):
        """Initialize notification service with configuration."""
        # Email configuration (placeholder for future implementation)
        self.email_enabled = os.environ.get('EMAIL_NOTIFICATIONS_ENABLED', 'false').lower() == 'true'
        self.smtp_host = os.environ.get('SMTP_HOST')
        self.smtp_port = os.environ.get('SMTP_PORT')
        self.smtp_user = os.environ.get('SMTP_USER')
        self.smtp_password = os.environ.get('SMTP_PASSWORD')
        self.from_email = os.environ.get('FROM_EMAIL', 'noreply@example.com')
        
        # SMS configuration (placeholder for future implementation)
        self.sms_enabled = os.environ.get('SMS_NOTIFICATIONS_ENABLED', 'false').lower() == 'true'
        self.sms_api_key = os.environ.get('SMS_API_KEY')
        self.sms_api_url = os.environ.get('SMS_API_URL')
        
        if not self.email_enabled and not self.sms_enabled:
            logger.warning(
                'Notifications are disabled. Set EMAIL_NOTIFICATIONS_ENABLED or '
                'SMS_NOTIFICATIONS_ENABLED to enable notifications.'
            )
    
    def send_refund_notification(
        self,
        customer_email: Optional[str],
        customer_phone: Optional[str],
        customer_name: str,
        order_number: str,
        refund_amount: float,
        refund_type: str,
        expected_timeline: str = '5-7 business days'
    ) -> Dict[str, bool]:
        """
        Send refund notification to customer via email and/or SMS.
        
        Args:
            customer_email: Customer email address (optional)
            customer_phone: Customer phone number (optional)
            customer_name: Customer name
            order_number: Order number
            refund_amount: Refund amount in INR
            refund_type: Type of refund ('full' or 'partial')
            expected_timeline: Expected refund timeline
            
        Returns:
            Dict: Status of email and SMS notifications
        """
        result = {
            'email_sent': False,
            'sms_sent': False
        }
        
        # Send email notification
        if customer_email and self.email_enabled:
            try:
                result['email_sent'] = self._send_refund_email(
                    to_email=customer_email,
                    customer_name=customer_name,
                    order_number=order_number,
                    refund_amount=refund_amount,
                    refund_type=refund_type,
                    expected_timeline=expected_timeline
                )
            except Exception as e:
                logger.error(f'Failed to send refund email: {str(e)}')
        
        # Send SMS notification
        if customer_phone and self.sms_enabled:
            try:
                result['sms_sent'] = self._send_refund_sms(
                    to_phone=customer_phone,
                    customer_name=customer_name,
                    order_number=order_number,
                    refund_amount=refund_amount,
                    expected_timeline=expected_timeline
                )
            except Exception as e:
                logger.error(f'Failed to send refund SMS: {str(e)}')
        
        # Log notification attempt
        if not result['email_sent'] and not result['sms_sent']:
            logger.info(
                f'Refund notification not sent (notifications disabled): '
                f'order={order_number}, amount=₹{refund_amount}'
            )
        else:
            logger.info(
                f'Refund notification sent: order={order_number}, '
                f'email_sent={result["email_sent"]}, sms_sent={result["sms_sent"]}'
            )
        
        return result
    
    def _send_refund_email(
        self,
        to_email: str,
        customer_name: str,
        order_number: str,
        refund_amount: float,
        refund_type: str,
        expected_timeline: str
    ) -> bool:
        """
        Send refund notification email.
        
        This is a placeholder implementation. In production, integrate with
        an email service like SendGrid, AWS SES, or SMTP.
        
        Args:
            to_email: Recipient email address
            customer_name: Customer name
            order_number: Order number
            refund_amount: Refund amount in INR
            refund_type: Type of refund ('full' or 'partial')
            expected_timeline: Expected refund timeline
            
        Returns:
            bool: True if email sent successfully
        """
        # TODO: Implement actual email sending logic
        # For now, just log the notification
        
        subject = f'Refund Processed for Order {order_number}'
        
        body = f"""
Dear {customer_name},

Your refund request for order {order_number} has been processed successfully.

Refund Details:
- Order Number: {order_number}
- Refund Type: {refund_type.capitalize()}
- Refund Amount: ₹{refund_amount:.2f}
- Expected Timeline: {expected_timeline}

The refund amount will be credited to your original payment method within {expected_timeline}.

If you have any questions, please contact our support team.

Thank you for your patience.

Best regards,
Customer Support Team
"""
        
        logger.info(
            f'Email notification prepared: to={to_email}, subject={subject}, '
            f'order={order_number}, amount=₹{refund_amount}'
        )
        
        # In production, send actual email here
        # Example with smtplib:
        # import smtplib
        # from email.mime.text import MIMEText
        # msg = MIMEText(body)
        # msg['Subject'] = subject
        # msg['From'] = self.from_email
        # msg['To'] = to_email
        # with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
        #     server.starttls()
        #     server.login(self.smtp_user, self.smtp_password)
        #     server.send_message(msg)
        
        # Return False since we're not actually sending emails yet
        return False
    
    def _send_refund_sms(
        self,
        to_phone: str,
        customer_name: str,
        order_number: str,
        refund_amount: float,
        expected_timeline: str
    ) -> bool:
        """
        Send refund notification SMS.
        
        This is a placeholder implementation. In production, integrate with
        an SMS service like Twilio, AWS SNS, or a local SMS gateway.
        
        Args:
            to_phone: Recipient phone number
            customer_name: Customer name
            order_number: Order number
            refund_amount: Refund amount in INR
            expected_timeline: Expected refund timeline
            
        Returns:
            bool: True if SMS sent successfully
        """
        # TODO: Implement actual SMS sending logic
        # For now, just log the notification
        
        message = (
            f'Dear {customer_name}, your refund of ₹{refund_amount:.2f} for order '
            f'{order_number} has been processed. Amount will be credited within '
            f'{expected_timeline}.'
        )
        
        logger.info(
            f'SMS notification prepared: to={to_phone}, order={order_number}, '
            f'amount=₹{refund_amount}'
        )
        
        # In production, send actual SMS here
        # Example with Twilio:
        # from twilio.rest import Client
        # client = Client(account_sid, auth_token)
        # message = client.messages.create(
        #     body=message,
        #     from_=twilio_phone_number,
        #     to=to_phone
        # )
        
        # Return False since we're not actually sending SMS yet
        return False
    
    def send_order_status_notification(
        self,
        customer_email: Optional[str],
        customer_phone: Optional[str],
        customer_name: str,
        order_number: str,
        new_status: str,
        tracking_info: Optional[str] = None
    ) -> Dict[str, bool]:
        """
        Send order status change notification to customer.
        
        Args:
            customer_email: Customer email address (optional)
            customer_phone: Customer phone number (optional)
            customer_name: Customer name
            order_number: Order number
            new_status: New order status
            tracking_info: Tracking information for shipped orders (optional)
            
        Returns:
            Dict: Status of email and SMS notifications
        """
        result = {
            'email_sent': False,
            'sms_sent': False
        }
        
        # Prepare status message
        status_messages = {
            'processing': 'is being processed',
            'shipped': 'has been shipped',
            'delivered': 'has been delivered',
            'cancelled': 'has been cancelled'
        }
        
        status_message = status_messages.get(new_status, f'status updated to {new_status}')
        
        logger.info(
            f'Order status notification prepared: order={order_number}, '
            f'status={new_status}, email={customer_email}, phone={customer_phone}'
        )
        
        # TODO: Implement actual notification sending
        # For now, just log the notification
        
        return result
    
    def send_password_reset_email(
        self,
        to_email: str,
        username: str,
        reset_token: str,
        frontend_url: Optional[str] = None
    ) -> bool:
        """
        Send password reset email with reset link.
        
        Args:
            to_email: Recipient email address
            username: Username
            reset_token: Password reset token
            frontend_url: Frontend base URL (optional, defaults to env variable)
            
        Returns:
            bool: True if email sent successfully
        """
        # Get frontend URL from environment or use default
        if not frontend_url:
            frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
        
        # Construct reset link
        reset_link = f'{frontend_url}/reset-password?token={reset_token}'
        
        subject = 'Password Reset Request - Swati Gold Platform'
        
        body = f"""
Dear {username},

We received a request to reset your password for your Swati Gold Platform account.

To reset your password, please click the link below:

{reset_link}

This link will expire in 1 hour for security reasons.

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

For security reasons, never share this link with anyone.

Best regards,
Swati Gold Platform Team
"""
        
        logger.info(
            f'Password reset email prepared: to={to_email}, username={username}'
        )
        
        # TODO: In production, send actual email here
        # For now, just log the reset link for development/testing
        logger.info(f'Password reset link: {reset_link}')
        
        # In production, implement actual email sending:
        # Example with smtplib:
        # import smtplib
        # from email.mime.text import MIMEText
        # msg = MIMEText(body)
        # msg['Subject'] = subject
        # msg['From'] = self.from_email
        # msg['To'] = to_email
        # with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
        #     server.starttls()
        #     server.login(self.smtp_user, self.smtp_password)
        #     server.send_message(msg)
        
        # Return True to indicate the email was "sent" (logged)
        # In production, return actual send status
        return True


# Create a singleton instance
notification_service = NotificationService()
