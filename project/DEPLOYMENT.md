# Deployment Guide

This guide covers deploying the Swati Jewellers application using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available
- 10GB disk space

## Quick Start

### Development Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd swati-jewellers
   ```

2. **Start development services**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Access the application**
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/api/health
   - MongoDB: localhost:27017

4. **View logs**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f backend
   ```

5. **Stop services**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Production Environment

1. **Create environment file**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env file with production values**
   ```bash
   # Update these values:
   MONGO_ROOT_PASSWORD=<strong-password>
   JWT_SECRET_KEY=<random-secret-key>
   CORS_ORIGINS=https://yourdomain.com
   ```

3. **Build and start services**
   ```bash
   docker-compose up -d
   ```

4. **Initialize database (first time only)**
   ```bash
   docker-compose exec backend python scripts/init_db.py
   docker-compose exec backend python scripts/seed_data.py
   ```

5. **Train ML models (first time only)**
   ```bash
   docker-compose exec backend python scripts/train_models.py
   ```

6. **Access the application**
   - Backend API: http://localhost:5000
   - Frontend: http://localhost:80 (if using production profile)
   - Health Check: http://localhost:5000/api/health

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGO_ROOT_USERNAME` | MongoDB root username | admin | Yes |
| `MONGO_ROOT_PASSWORD` | MongoDB root password | admin123 | Yes |
| `MONGO_DATABASE` | Database name | swati_jewellers | Yes |
| `FLASK_ENV` | Flask environment | production | Yes |
| `JWT_SECRET_KEY` | JWT secret key | - | Yes |
| `CORS_ORIGINS` | Allowed CORS origins | localhost | Yes |

### Gunicorn Configuration

Edit `backend/gunicorn.conf.py` to customize:
- Number of workers
- Timeout settings
- Logging configuration

Environment variables for Gunicorn:
- `GUNICORN_WORKERS`: Number of worker processes (default: CPU cores * 2 + 1)
- `GUNICORN_LOG_LEVEL`: Log level (default: info)

## Database Management

### Backup MongoDB

```bash
# Create backup
docker-compose exec mongodb mongodump --username admin --password <password> --authenticationDatabase admin --out /data/backup

# Copy backup to host
docker cp swati-jewellers-mongodb:/data/backup ./mongodb-backup
```

### Restore MongoDB

```bash
# Copy backup to container
docker cp ./mongodb-backup swati-jewellers-mongodb:/data/backup

# Restore backup
docker-compose exec mongodb mongorestore --username admin --password <password> --authenticationDatabase admin /data/backup
```

### Access MongoDB Shell

```bash
docker-compose exec mongodb mongosh -u admin -p <password> --authenticationDatabase admin
```

## ML Model Management

### Train Models

```bash
# Train both gold and diamond models
docker-compose exec backend python scripts/train_models.py

# Train specific model
docker-compose exec backend python -c "from scripts.train_models import train_gold_model; train_gold_model()"
```

### View Model Status

```bash
# Check if models exist
docker-compose exec backend ls -lh models/

# View training logs
docker-compose exec backend python -c "from app.models import TrainingLog; [print(log.to_json()) for log in TrainingLog.objects()]"
```

## Monitoring

### Health Checks

```bash
# Check overall health
curl http://localhost:5000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-14T10:30:00",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "message": "Database connection successful"
    },
    "ml_models": {
      "status": "healthy",
      "message": "All ML models available"
    }
  }
}
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f mongodb

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Container Stats

```bash
# View resource usage
docker stats swati-jewellers-backend swati-jewellers-mongodb
```

## Scaling

### Scale Backend Workers

```bash
# Scale to 3 backend instances
docker-compose up -d --scale backend=3

# Note: You'll need a load balancer (nginx/traefik) for multiple instances
```

### Optimize for Production

1. **Increase Gunicorn workers**
   ```bash
   export GUNICORN_WORKERS=8
   docker-compose up -d backend
   ```

2. **Add Redis for caching** (optional)
   Add to docker-compose.yml:
   ```yaml
   redis:
     image: redis:7-alpine
     ports:
       - "6379:6379"
   ```

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. MongoDB not ready - wait 30 seconds and retry
# 2. Port 5000 in use - change port in docker-compose.yml
# 3. Missing environment variables - check .env file
```

### Database connection failed

```bash
# Verify MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Test connection
docker-compose exec backend python -c "from mongoengine import connect; connect(host='mongodb://admin:admin123@mongodb:27017/swati_jewellers?authSource=admin'); print('Connected!')"
```

### ML models not found

```bash
# Train models
docker-compose exec backend python scripts/train_models.py

# Verify models exist
docker-compose exec backend ls -lh models/
```

### Out of memory

```bash
# Check memory usage
docker stats

# Reduce Gunicorn workers
export GUNICORN_WORKERS=2
docker-compose up -d backend
```

## Security Best Practices

1. **Change default passwords**
   - Update `MONGO_ROOT_PASSWORD` in .env
   - Use strong, random passwords

2. **Secure JWT secret**
   - Generate random secret: `openssl rand -hex 32`
   - Never commit secrets to version control

3. **Configure CORS properly**
   - Only allow trusted origins
   - Don't use `*` in production

4. **Use HTTPS in production**
   - Configure SSL certificates
   - Use reverse proxy (nginx/traefik)

5. **Regular updates**
   - Keep Docker images updated
   - Update Python dependencies regularly

## Production Deployment Checklist

- [ ] Update all passwords in .env
- [ ] Generate secure JWT_SECRET_KEY
- [ ] Configure CORS_ORIGINS with production domain
- [ ] Set FLASK_ENV=production
- [ ] Initialize database with init_db.py
- [ ] Seed initial data with seed_data.py
- [ ] Train ML models
- [ ] Test health check endpoint
- [ ] Configure SSL/HTTPS
- [ ] Set up automated backups
- [ ] Configure monitoring/alerting
- [ ] Test all API endpoints
- [ ] Load test the application
- [ ] Document admin credentials securely

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify health: `curl http://localhost:5000/api/health`
3. Review this guide
4. Contact system administrator
