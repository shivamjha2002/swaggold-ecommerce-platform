"""Custom exception classes for the application."""


class APIException(Exception):
    """Base exception class for API errors."""
    
    def __init__(self, message, status_code=500, details=None):
        """
        Initialize API exception.
        
        Args:
            message: Error message
            status_code: HTTP status code
            details: Additional error details
        """
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details
    
    def to_dict(self):
        """Convert exception to dictionary for JSON response."""
        error_dict = {
            'code': self.status_code,
            'message': self.message
        }
        if self.details:
            error_dict['details'] = self.details
        return error_dict


class ResourceNotFoundError(APIException):
    """Exception raised when a requested resource is not found."""
    
    def __init__(self, resource_type, resource_id=None, details=None):
        """
        Initialize resource not found error.
        
        Args:
            resource_type: Type of resource (e.g., 'Product', 'Customer')
            resource_id: ID of the resource
            details: Additional error details
        """
        if resource_id:
            message = f"{resource_type} with ID '{resource_id}' not found"
        else:
            message = f"{resource_type} not found"
        super().__init__(message, status_code=404, details=details)
        self.resource_type = resource_type
        self.resource_id = resource_id


class ValidationError(APIException):
    """Exception raised when request validation fails."""
    
    def __init__(self, message, field=None, details=None):
        """
        Initialize validation error.
        
        Args:
            message: Error message
            field: Field that failed validation
            details: Additional error details
        """
        super().__init__(message, status_code=400, details=details)
        self.field = field
    
    def to_dict(self):
        """Convert exception to dictionary for JSON response."""
        error_dict = super().to_dict()
        if self.field:
            error_dict['field'] = self.field
        return error_dict


class AuthenticationError(APIException):
    """Exception raised when authentication fails."""
    
    def __init__(self, message="Authentication failed", details=None):
        """
        Initialize authentication error.
        
        Args:
            message: Error message
            details: Additional error details
        """
        super().__init__(message, status_code=401, details=details)


class AuthorizationError(APIException):
    """Exception raised when user lacks required permissions."""
    
    def __init__(self, message="Insufficient permissions", details=None):
        """
        Initialize authorization error.
        
        Args:
            message: Error message
            details: Additional error details
        """
        super().__init__(message, status_code=403, details=details)


class ConflictError(APIException):
    """Exception raised when a resource conflict occurs."""
    
    def __init__(self, message, resource_type=None, details=None):
        """
        Initialize conflict error.
        
        Args:
            message: Error message
            resource_type: Type of resource in conflict
            details: Additional error details
        """
        super().__init__(message, status_code=409, details=details)
        self.resource_type = resource_type


class DatabaseError(APIException):
    """Exception raised when a database operation fails."""
    
    def __init__(self, message="Database operation failed", details=None):
        """
        Initialize database error.
        
        Args:
            message: Error message
            details: Additional error details
        """
        super().__init__(message, status_code=500, details=details)


class ExternalServiceError(APIException):
    """Exception raised when an external service call fails."""
    
    def __init__(self, service_name, message=None, details=None):
        """
        Initialize external service error.
        
        Args:
            service_name: Name of the external service
            message: Error message
            details: Additional error details
        """
        if not message:
            message = f"External service '{service_name}' is unavailable"
        super().__init__(message, status_code=503, details=details)
        self.service_name = service_name


class RateLimitError(APIException):
    """Exception raised when rate limit is exceeded."""
    
    def __init__(self, message="Rate limit exceeded", retry_after=None, details=None):
        """
        Initialize rate limit error.
        
        Args:
            message: Error message
            retry_after: Seconds until retry is allowed
            details: Additional error details
        """
        super().__init__(message, status_code=429, details=details)
        self.retry_after = retry_after
    
    def to_dict(self):
        """Convert exception to dictionary for JSON response."""
        error_dict = super().to_dict()
        if self.retry_after:
            error_dict['retry_after'] = self.retry_after
        return error_dict
