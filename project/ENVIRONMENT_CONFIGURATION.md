# Environment Configuration Guide

This document describes all environment variables used in the Swati Jewellers application.

## Table of Contents

- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Production Setup](#production-setup)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Backend Configuration

### Required Variables

These variables must be set for the application to run:

#### `FLASK_ENV`
- **Description**: Application environment
- **Values**: `development`, `testing`, `production`
- **Default**: `development`
- **Example**: `FLASK_ENV=production`

#### `SECRET_KEY`
- **Description**: Flask secret key for session management and CSRF protection
- **Required**: Yes
- **Security**: Must be random and kept secret
- **Generate**: `python -c "import secrets; print(secrets.token_hex(32))"`
- **Example**: `SECRET_KEY=a1b2c3d4e5f6...`

#### `JWT_SECRET_KEY`
- **Description**: Secret key for JWT token signing
- **Required**: Yes
- **Security**: Must be random and kept secret
- **Generate**: `python -c "import secrets; print(secrets.token_hex(32))"`
- **Example**: `JWT_SECRET_KEY=x1y2z3a4b5c6...`

#### `MONGODB_URI`
- **Description**: MongoDB connection string
- **Required**: Yes
- **Format**: `mongodb://[username:password@]host[:port]/database[?options]`
- **Examples**:
  ```bash
  # Local development
  MONGODB_URI=mongodb://localhost:27017/swati_jewellers_dev
  
  # Docker development
  MONGODB_URI=mongodb://admin:admin123@mongodb:27017/swati_jewellers_dev?authSource=admin
  
  # Production
  MONGODB_URI=mongodb://admin:STRONG_PASSWORD@mongodb:27017/swati_jewellers?authSource=admin
  ```

#### `CORS_ORIGINS`
- **Description**: Comma-separated list of allowed CORS origins
- **Required**: Yes
- **Security**: Never use `*` in production
- **Examples**:
  ```bash
  # Development
  CORS_ORIGINS=http://localhost:5173,http://localhost:3000
  
  # Production
  CORS_ORIGINS=https://swatijewellers.com,https://www.swatijewellers.com
  ```

### Optional Variables

#### `PORT`
- **Description**: Server port number
- **Default**: `5000`
- **Example**: `PORT=8000`

#### `MODEL_PATH`
- **Description**: Path to ML model files
- **Default**: `models/`
- **Example**: `MODEL_PATH=/app/models/`

#### `GUNICORN_WORKERS`
- **Description**: Number of Gunicorn worker processes
- **Default**: CPU cores * 2 + 1
- **Recommended**: 4-8 for most applications
- **Example**: `GUNICORN_WORKERS=4`

#### `GUNICORN_LOG_LEVEL`
- **Description**: Gunicorn logging level
- **Values**: `debug`, `info`, `warning`, `error`, `critical`
- **Default**: `info`
- **Example**: `GUNICORN_LOG_LEVEL=warning`

### Future/Optional Features

These variables are for features that may be implemented in the future:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@swatijewellers.com

# Payment Gateway
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# File Upload
MAX_UPLOAD_SIZE=5242880  # 5MB
UPLOAD_FOLDER=uploads/
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,webp

# Redis Cache
REDIS_URL=redis://localhost:6379/0
CACHE_TTL=300

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
```

## Frontend Configuration

### Required Variables

#### `VITE_API_URL`
- **Description**: Backend API base URL
- **Required**: Yes
- **Examples**:
  ```bash
  # Development
  VITE_API_URL=http://localhost:5000/api
  
  # Production
  VITE_API_URL=https://api.swatijewellers.com/api
  ```

### Optional Variables

#### Application Configuration

```bash
VITE_APP_NAME=Swati Jewellers
VITE_APP_VERSION=1.0.0
```

#### Feature Flags

```bash
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CART=true
VITE_ENABLE_WISHLIST=false
```

#### Analytics

```bash
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

#### Payment Gateway

```bash
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
```

#### Maps

```bash
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

#### Social Media

```bash
VITE_FACEBOOK_URL=https://facebook.com/swatijewellers
VITE_INSTAGRAM_URL=https://instagram.com/swatijewellers
VITE_TWITTER_URL=https://twitter.com/swatijewellers
VITE_YOUTUBE_URL=https://youtube.com/swatijewellers
VITE_WHATSAPP_NUMBER=+919876543210
```

#### Contact Information

```bash
VITE_CONTACT_EMAIL=info@swatijewellers.com
VITE_CONTACT_PHONE=+91-9876543210
VITE_STORE_ADDRESS=123 Main Street, City, State, PIN
```

#### WebSocket (Real-time Updates)

```bash
# Development
VITE_WS_URL=ws://localhost:5000/ws

# Production
VITE_WS_URL=wss://api.swatijewellers.com/ws
```

#### Development Tools

```bash
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_MOCK_DATA=false
```

## Production Setup

### Step 1: Copy Example Files

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp .env.example .env
```

### Step 2: Generate Secret Keys

```bash
# Generate SECRET_KEY
python -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))"

# Generate JWT_SECRET_KEY
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"
```

### Step 3: Configure MongoDB

**Option A: Local MongoDB**
```bash
MONGODB_URI=mongodb://localhost:27017/swati_jewellers
```

**Option B: MongoDB Atlas (Cloud)**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/swati_jewellers?retryWrites=true&w=majority
```

**Option C: Docker MongoDB**
```bash
# 1. Set strong password in docker-compose.yml
MONGO_ROOT_PASSWORD=your-strong-password-here

# 2. Update .env
MONGODB_URI=mongodb://admin:your-strong-password-here@mongodb:27017/swati_jewellers?authSource=admin
```

### Step 4: Configure CORS

```bash
# Replace with your actual domain(s)
CORS_ORIGINS=https://swatijewellers.com,https://www.swatijewellers.com
```

### Step 5: Update Frontend API URL

```bash
# In frontend .env
VITE_API_URL=https://api.swatijewellers.com/api
```

### Step 6: Set Production Environment

```bash
# Backend
FLASK_ENV=production

# Gunicorn
GUNICORN_WORKERS=4
GUNICORN_LOG_LEVEL=info
```

## Security Best Practices

### 1. Secret Keys

✅ **DO:**
- Generate random secret keys using `secrets` module
- Use different keys for development and production
- Store keys securely (environment variables, secrets manager)
- Rotate keys periodically

❌ **DON'T:**
- Use default or example keys in production
- Commit secret keys to version control
- Share secret keys in plain text
- Use the same key for multiple purposes

### 2. MongoDB Security

✅ **DO:**
- Use strong passwords (16+ characters, mixed case, numbers, symbols)
- Enable authentication in production
- Use connection string with authentication
- Restrict network access to MongoDB
- Regular backups

❌ **DON'T:**
- Use default passwords (admin/admin, root/root)
- Expose MongoDB port publicly
- Use same credentials for dev and prod
- Skip authentication

### 3. CORS Configuration

✅ **DO:**
- Whitelist specific domains
- Use HTTPS in production
- Include all necessary subdomains

❌ **DON'T:**
- Use `*` (allow all origins) in production
- Allow HTTP origins in production
- Include development URLs in production

### 4. Environment Files

✅ **DO:**
- Add `.env` to `.gitignore`
- Provide `.env.example` with dummy values
- Document all required variables
- Use environment-specific files

❌ **DON'T:**
- Commit `.env` files to git
- Include real credentials in examples
- Use production credentials in development

## Environment-Specific Configurations

### Development

```bash
# Backend (.env)
FLASK_ENV=development
SECRET_KEY=dev-secret-key-for-local-development-only
JWT_SECRET_KEY=dev-jwt-secret-key-for-local-development-only
MONGODB_URI=mongodb://localhost:27017/swati_jewellers_dev
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=5000

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
VITE_ENABLE_DEVTOOLS=true
```

### Testing

```bash
# Backend (.env.test)
FLASK_ENV=testing
SECRET_KEY=test-secret-key
JWT_SECRET_KEY=test-jwt-secret-key
MONGODB_URI=mongodb://localhost:27017/swati_jewellers_test
CORS_ORIGINS=*
PORT=5001

# Frontend (.env.test)
VITE_API_URL=http://localhost:5001/api
VITE_ENABLE_MOCK_DATA=true
```

### Production

```bash
# Backend (.env)
FLASK_ENV=production
SECRET_KEY=<generated-secure-key>
JWT_SECRET_KEY=<generated-secure-key>
MONGODB_URI=mongodb://admin:<strong-password>@mongodb:27017/swati_jewellers?authSource=admin
CORS_ORIGINS=https://swatijewellers.com,https://www.swatijewellers.com
PORT=5000
GUNICORN_WORKERS=4
GUNICORN_LOG_LEVEL=warning

# Frontend (.env)
VITE_API_URL=https://api.swatijewellers.com/api
VITE_ENABLE_DEVTOOLS=false
```

## Docker Configuration

### docker-compose.yml Environment

```yaml
services:
  backend:
    environment:
      - FLASK_ENV=${FLASK_ENV:-production}
      - SECRET_KEY=${SECRET_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - MONGODB_URI=${MONGODB_URI}
      - CORS_ORIGINS=${CORS_ORIGINS}
    env_file:
      - backend/.env

  mongodb:
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
      - MONGO_INITDB_DATABASE=swati_jewellers
```

### Using .env with Docker Compose

```bash
# Create .env file in project root
cat > .env << EOF
FLASK_ENV=production
SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
MONGO_ROOT_PASSWORD=$(python -c "import secrets; print(secrets.token_urlsafe(16))")
MONGODB_URI=mongodb://admin:\${MONGO_ROOT_PASSWORD}@mongodb:27017/swati_jewellers?authSource=admin
CORS_ORIGINS=https://swatijewellers.com
EOF

# Start services
docker-compose up -d
```

## Troubleshooting

### Backend Won't Start

**Error: "SECRET_KEY not set"**
```bash
# Solution: Set SECRET_KEY in backend/.env
echo "SECRET_KEY=$(python -c 'import secrets; print(secrets.token_hex(32))')" >> backend/.env
```

**Error: "Failed to connect to MongoDB"**
```bash
# Check MongoDB is running
# Windows:
net start MongoDB

# Linux:
sudo systemctl status mongod

# Docker:
docker-compose ps mongodb

# Verify connection string
echo $MONGODB_URI
```

**Error: "CORS error"**
```bash
# Check CORS_ORIGINS includes your frontend URL
# Development:
CORS_ORIGINS=http://localhost:5173

# Ensure no trailing slashes
```

### Frontend Can't Connect to Backend

**Error: "Network Error" or "Failed to fetch"**
```bash
# Check VITE_API_URL is correct
echo $VITE_API_URL

# Verify backend is running
curl http://localhost:5000/api/health

# Check CORS configuration in backend
```

**Error: "Unauthorized" or 401 errors**
```bash
# Check JWT_SECRET_KEY matches between environments
# Verify token is being sent in Authorization header
```

### Environment Variables Not Loading

**Vite (Frontend)**
```bash
# Environment variables must start with VITE_
# Restart dev server after changing .env
npm run dev

# Check variables are loaded
console.log(import.meta.env.VITE_API_URL)
```

**Flask (Backend)**
```bash
# Ensure .env file is in backend/ directory
# Check file is named exactly ".env"
# Restart server after changes
python backend/run.py
```

## Validation Checklist

Before deploying to production, verify:

### Backend
- [ ] `SECRET_KEY` is set and random
- [ ] `JWT_SECRET_KEY` is set and random
- [ ] `MONGODB_URI` uses strong password
- [ ] `CORS_ORIGINS` lists only production domains
- [ ] `FLASK_ENV=production`
- [ ] No development URLs in configuration
- [ ] `.env` file is not in git

### Frontend
- [ ] `VITE_API_URL` points to production API
- [ ] No localhost URLs in configuration
- [ ] Development tools disabled
- [ ] `.env` file is not in git

### Security
- [ ] All secret keys are unique and random
- [ ] MongoDB authentication enabled
- [ ] CORS properly configured
- [ ] HTTPS enabled in production
- [ ] Sensitive data not in logs

### Testing
- [ ] Backend health check passes
- [ ] Frontend can connect to backend
- [ ] Authentication works
- [ ] API endpoints respond correctly
- [ ] Database connection stable

## Additional Resources

- [Flask Configuration](https://flask.palletsprojects.com/en/2.3.x/config/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [MongoDB Connection String](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [Security Best Practices](https://owasp.org/www-project-top-ten/)
