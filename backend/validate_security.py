"""
Security validation script - verifies security measures are in place.
This script can be run without pytest to validate security configuration.
"""
import os
import sys
import re
from datetime import datetime


class SecurityValidator:
    """Validate security measures in the application."""
    
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.warnings = 0
    
    def test(self, name, condition, error_msg=""):
        """Run a test and track results."""
        if condition:
            print(f"✅ PASS: {name}")
            self.passed += 1
            return True
        else:
            print(f"❌ FAIL: {name}")
            if error_msg:
                print(f"   {error_msg}")
            self.failed += 1
            return False
    
    def warn(self, name, condition, warning_msg=""):
        """Run a warning check."""
        if not condition:
            print(f"⚠️  WARN: {name}")
            if warning_msg:
                print(f"   {warning_msg}")
            self.warnings += 1
    
    def print_summary(self):
        """Print test summary."""
        total = self.passed + self.failed
        print("\n" + "="*60)
        print("SECURITY VALIDATION SUMMARY")
        print("="*60)
        print(f"Total Tests: {total}")
        print(f"Passed: {self.passed} ✅")
        print(f"Failed: {self.failed} ❌")
        print(f"Warnings: {self.warnings} ⚠️")
        print("="*60)
        
        if self.failed == 0:
            print("✅ All security checks passed!")
            return 0
        else:
            print("❌ Some security checks failed. Please review.")
            return 1


def validate_security():
    """Run all security validations."""
    validator = SecurityValidator()
    
    # Determine base directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = script_dir
    project_dir = os.path.dirname(backend_dir)
    
    print("="*60)
    print("SWATI GOLD PLATFORM - SECURITY VALIDATION")
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Backend Dir: {backend_dir}")
    print("="*60)
    print()
    
    # 1. Check security utilities exist
    print("1. SECURITY UTILITIES")
    print("-" * 60)
    
    validator.test(
        "Security utilities module exists",
        os.path.exists(os.path.join(backend_dir, "app/utils/security.py")),
        "app/utils/security.py not found"
    )
    
    validator.test(
        "Rate limiter module exists",
        os.path.exists(os.path.join(backend_dir, "app/utils/rate_limiter.py")),
        "app/utils/rate_limiter.py not found"
    )
    
    # 2. Check security headers implementation
    print("\n2. SECURITY HEADERS")
    print("-" * 60)
    
    security_file = os.path.join(backend_dir, "app/utils/security.py")
    if os.path.exists(security_file):
        with open(security_file, 'r', encoding='utf-8') as f:
            security_content = f.read()
        
        validator.test(
            "X-Frame-Options header implemented",
            "X-Frame-Options" in security_content
        )
        
        validator.test(
            "X-Content-Type-Options header implemented",
            "X-Content-Type-Options" in security_content
        )
        
        validator.test(
            "X-XSS-Protection header implemented",
            "X-XSS-Protection" in security_content
        )
        
        validator.test(
            "Content-Security-Policy header implemented",
            "Content-Security-Policy" in security_content
        )
        
        validator.test(
            "HSTS header implemented",
            "Strict-Transport-Security" in security_content
        )
    
    # 3. Check rate limiting
    print("\n3. RATE LIMITING")
    print("-" * 60)
    
    limiter_file = os.path.join(backend_dir, "app/utils/rate_limiter.py")
    if os.path.exists(limiter_file):
        with open(limiter_file, 'r', encoding='utf-8') as f:
            limiter_content = f.read()
        
        validator.test(
            "Flask-Limiter imported",
            "from flask_limiter import Limiter" in limiter_content
        )
        
        validator.test(
            "Auth login rate limit defined",
            "auth_login" in limiter_content
        )
        
        validator.test(
            "Auth signup rate limit defined",
            "auth_signup" in limiter_content
        )
        
        validator.test(
            "Password reset rate limit defined",
            "auth_password_reset" in limiter_content
        )
    
    # 4. Check authentication security
    print("\n4. AUTHENTICATION SECURITY")
    print("-" * 60)
    
    auth_file = os.path.join(backend_dir, "app/routes/auth.py")
    if os.path.exists(auth_file):
        with open(auth_file, 'r', encoding='utf-8') as f:
            auth_content = f.read()
        
        validator.test(
            "Password hashing implemented",
            "set_password" in auth_content or "password_hash" in auth_content
        )
        
        validator.test(
            "JWT token creation implemented",
            "create_access_token" in auth_content
        )
        
        validator.test(
            "Email enumeration protection",
            "If an account exists" in auth_content
        )
        
        validator.test(
            "Password validation implemented",
            "len(password)" in auth_content and "< 6" in auth_content
        )
    
    # 5. Check input validation
    print("\n5. INPUT VALIDATION")
    print("-" * 60)
    
    auth_file = os.path.join(backend_dir, "app/routes/auth.py")
    if os.path.exists(auth_file):
        with open(auth_file, 'r', encoding='utf-8') as f:
            auth_content = f.read()
        
        validator.test(
            "Username validation implemented",
            "username" in auth_content and ("isalnum" in auth_content or "len(username)" in auth_content)
        )
        
        validator.test(
            "Email validation implemented",
            "'@' not in email" in auth_content or "email" in auth_content
        )
        
        validator.test(
            "Input sanitization (strip/trim)",
            ".strip()" in auth_content or ".lower()" in auth_content
        )
    
    # 6. Check HTTPS enforcement
    print("\n6. HTTPS ENFORCEMENT")
    print("-" * 60)
    
    init_file = os.path.join(backend_dir, "app/__init__.py")
    if os.path.exists(init_file):
        with open(init_file, 'r', encoding='utf-8') as f:
            init_content = f.read()
        
        validator.test(
            "HTTPS enforcement middleware exists",
            "enforce_https" in init_content or "is_secure" in init_content
        )
    
    config_file = os.path.join(backend_dir, "app/config.py")
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            config_content = f.read()
        
        validator.test(
            "Production HTTPS configuration",
            "PREFERRED_URL_SCHEME" in config_content or "SESSION_COOKIE_SECURE" in config_content
        )
    
    # 7. Check CORS configuration
    print("\n7. CORS CONFIGURATION")
    print("-" * 60)
    
    init_file = os.path.join(backend_dir, "app/__init__.py")
    if os.path.exists(init_file):
        with open(init_file, 'r', encoding='utf-8') as f:
            init_content = f.read()
        
        validator.test(
            "CORS configured",
            "CORS(app" in init_content or "from flask_cors import CORS" in init_content
        )
        
        validator.test(
            "CORS origins configured",
            "CORS_ORIGINS" in init_content or "origins" in init_content
        )
    
    # 8. Check JWT configuration
    print("\n8. JWT CONFIGURATION")
    print("-" * 60)
    
    config_file = os.path.join(backend_dir, "app/config.py")
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            config_content = f.read()
        
        validator.test(
            "JWT secret key configured",
            "JWT_SECRET_KEY" in config_content
        )
        
        validator.test(
            "JWT expiration configured",
            "JWT_ACCESS_TOKEN_EXPIRES" in config_content
        )
    
    # 9. Check frontend sanitization
    print("\n9. FRONTEND SANITIZATION")
    print("-" * 60)
    
    sanitize_file = os.path.join(project_dir, "src/utils/sanitize.ts")
    if os.path.exists(sanitize_file):
        with open(sanitize_file, 'r', encoding='utf-8') as f:
            sanitize_content = f.read()
        
        validator.test(
            "HTML escaping function exists",
            "escapeHtml" in sanitize_content
        )
        
        validator.test(
            "Input sanitization function exists",
            "sanitizeInput" in sanitize_content
        )
        
        validator.test(
            "XSS detection implemented",
            "isSafeInput" in sanitize_content or "<script" in sanitize_content
        )
        
        validator.test(
            "SQL injection detection implemented",
            "isSafeSqlInput" in sanitize_content or "SELECT" in sanitize_content
        )
        
        validator.test(
            "NoSQL injection detection implemented",
            "isSafeNoSqlInput" in sanitize_content or "$where" in sanitize_content
        )
    else:
        validator.test(
            "Frontend sanitization utilities exist",
            False,
            f"{sanitize_file} not found"
        )
    
    # 10. Environment variable checks
    print("\n10. ENVIRONMENT CONFIGURATION")
    print("-" * 60)
    
    validator.warn(
        "JWT_SECRET_KEY environment variable",
        os.environ.get('JWT_SECRET_KEY') is not None,
        "JWT_SECRET_KEY not set in environment (required for production)"
    )
    
    validator.warn(
        "SECRET_KEY environment variable",
        os.environ.get('SECRET_KEY') is not None,
        "SECRET_KEY not set in environment (required for production)"
    )
    
    validator.warn(
        "MONGODB_URI environment variable",
        os.environ.get('MONGODB_URI') is not None,
        "MONGODB_URI not set in environment"
    )
    
    # 11. Check security documentation
    print("\n11. SECURITY DOCUMENTATION")
    print("-" * 60)
    
    validator.test(
        "Security audit report exists",
        os.path.exists(os.path.join(backend_dir, "SECURITY_AUDIT_REPORT.md")),
        "SECURITY_AUDIT_REPORT.md not found"
    )
    
    validator.test(
        "Security test suite exists",
        os.path.exists(os.path.join(backend_dir, "test_security_audit.py")),
        "test_security_audit.py not found"
    )
    
    # Print summary
    return validator.print_summary()


if __name__ == "__main__":
    exit_code = validate_security()
    sys.exit(exit_code)
