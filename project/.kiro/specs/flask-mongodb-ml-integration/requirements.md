# Requirements Document

## Introduction

This document outlines the requirements for transforming the Swati Jewellers e-commerce platform into a comprehensive jewelry management system with Flask backend, MongoDB database integration, enhanced frontend features, and Data Science capabilities for gold and diamond price prediction. The system will serve jewelry store owners, customers, and administrators with features for product management, customer transactions (Khata), and intelligent price forecasting.

## Glossary

- **System**: The Swati Jewellers E-commerce Platform
- **Flask Backend**: Python-based REST API server using Flask framework
- **MongoDB**: NoSQL document database for storing application data
- **Frontend**: React/TypeScript single-page application
- **ML Model**: Machine Learning model for price prediction
- **Khata**: Traditional account ledger system for tracking customer credit/debit transactions
- **916 HM Gold**: 22-karat gold certified by Hallmark
- **Price Predictor**: ML-powered service that forecasts gold and diamond prices
- **Admin Dashboard**: Administrative interface for managing products and viewing analytics
- **API Endpoint**: RESTful HTTP endpoint for client-server communication

## Requirements

### Requirement 1: Flask Backend Architecture

**User Story:** As a developer, I want to migrate the backend from Node.js to Flask, so that I can leverage Python's data science ecosystem for ML features.

#### Acceptance Criteria

1. THE System SHALL implement a Flask REST API server with CORS support for cross-origin requests from the Frontend
2. THE System SHALL organize Flask application code into blueprints for products, customers, sales, khata, and predictions modules
3. THE System SHALL implement error handling middleware that returns JSON responses with appropriate HTTP status codes for all API errors
4. THE System SHALL validate all incoming API requests using Flask-RESTful request parsers or marshmallow schemas
5. THE System SHALL implement JWT-based authentication for Admin Dashboard access with token expiration of 24 hours

### Requirement 2: MongoDB Database Integration

**User Story:** As a system administrator, I want to use MongoDB as the database, so that I can store flexible document structures for jewelry products with varying attributes.

#### Acceptance Criteria

1. THE System SHALL connect to MongoDB using PyMongo or Motor driver with connection pooling enabled
2. THE System SHALL create collections for products, customers, sales, khata_transactions, and price_history with appropriate indexes
3. THE System SHALL implement data models using mongoengine or custom classes that validate document schemas before insertion
4. WHEN a database operation fails, THEN THE System SHALL log the error details and return a user-friendly error message to the client
5. THE System SHALL implement database migration scripts for initializing collections and seeding sample data

### Requirement 3: Product Management API

**User Story:** As an admin, I want to manage jewelry products through API endpoints, so that I can add, update, and remove items from the catalog.

#### Acceptance Criteria

1. THE System SHALL provide POST /api/products endpoint that accepts product data including name, category, price, weight, gold_purity, image_url, and description
2. THE System SHALL provide GET /api/products endpoint that returns paginated product list with filtering by category, price_range, and weight_range
3. THE System SHALL provide GET /api/products/:id endpoint that returns detailed product information including current gold price calculation
4. THE System SHALL provide PUT /api/products/:id endpoint that updates product information with validation
5. THE System SHALL provide DELETE /api/products/:id endpoint that soft-deletes products by setting is_active flag to false

### Requirement 4: Customer and Khata Management

**User Story:** As a store owner, I want to track customer accounts and credit transactions, so that I can manage the traditional Khata system digitally.

#### Acceptance Criteria

1. THE System SHALL provide POST /api/customers endpoint that creates customer records with name, phone, email, and address fields
2. THE System SHALL provide GET /api/customers/:id/khata endpoint that returns transaction history with running balance calculation
3. THE System SHALL provide POST /api/khata/transactions endpoint that records credit or debit transactions with amount, transaction_type, and description
4. WHEN a khata transaction is created, THEN THE System SHALL update the customer's current balance atomically
5. THE System SHALL provide GET /api/khata/summary endpoint that returns total outstanding balance across all customers

### Requirement 5: Gold and Diamond Price Prediction ML Model

**User Story:** As an MCA Data Science student and store owner, I want ML-powered price prediction for gold and diamonds, so that I can forecast future prices and make informed business decisions.

#### Acceptance Criteria

1. THE System SHALL implement a machine learning model using scikit-learn or TensorFlow that predicts gold prices based on historical data
2. THE System SHALL implement a machine learning model that predicts diamond prices based on carat, cut, color, and clarity features
3. THE System SHALL provide POST /api/predictions/gold endpoint that accepts date parameter and returns predicted gold price with confidence interval
4. THE System SHALL provide POST /api/predictions/diamond endpoint that accepts diamond features and returns predicted price
5. THE System SHALL retrain prediction models automatically when new price data is added to the price_history collection

### Requirement 6: Historical Price Data Management

**User Story:** As a data analyst, I want to store and retrieve historical price data, so that I can train accurate ML models and analyze price trends.

#### Acceptance Criteria

1. THE System SHALL provide POST /api/prices/gold endpoint that stores daily gold price records with date, price_per_gram, and source fields
2. THE System SHALL provide POST /api/prices/diamond endpoint that stores diamond price records with features and market price
3. THE System SHALL provide GET /api/prices/gold/history endpoint that returns historical gold prices with date range filtering
4. THE System SHALL provide GET /api/prices/trends endpoint that calculates and returns price trends including moving averages and percentage changes
5. WHEN price data is added, THEN THE System SHALL trigger model retraining if more than 30 new records have been added since last training

### Requirement 7: Enhanced Frontend UI Components

**User Story:** As a customer, I want an improved and intuitive user interface, so that I can easily browse products and view price predictions.

#### Acceptance Criteria

1. THE Frontend SHALL implement a responsive product grid with filtering by category, price range, and weight using React hooks
2. THE Frontend SHALL display real-time gold price updates on the homepage with percentage change indicators
3. THE Frontend SHALL implement a product detail modal that shows high-resolution images, specifications, and current price calculation
4. THE Frontend SHALL implement a price prediction dashboard with interactive charts showing historical and predicted prices
5. THE Frontend SHALL implement loading states and error boundaries for all API calls with user-friendly error messages

### Requirement 8: Price Prediction Dashboard

**User Story:** As a store owner, I want a dedicated dashboard for viewing price predictions and trends, so that I can plan inventory and pricing strategies.

#### Acceptance Criteria

1. THE Frontend SHALL create a /predictions route that displays gold and diamond price prediction interfaces
2. THE Frontend SHALL implement date picker for selecting prediction dates with validation for future dates only
3. THE Frontend SHALL display prediction results with confidence intervals using Chart.js or Recharts visualization library
4. THE Frontend SHALL display historical price trends with interactive line charts showing 30-day, 90-day, and 1-year views
5. THE Frontend SHALL implement a diamond price calculator form with inputs for carat, cut, color, and clarity

### Requirement 9: Admin Dashboard Enhancements

**User Story:** As an admin, I want enhanced dashboard features, so that I can monitor sales, manage inventory, and view analytics.

#### Acceptance Criteria

1. THE Frontend SHALL implement authentication flow with login page and protected routes for Admin Dashboard
2. THE Frontend SHALL display sales analytics including total revenue, number of transactions, and top-selling products
3. THE Frontend SHALL implement product management interface with add, edit, and delete functionality
4. THE Frontend SHALL display customer khata summary with outstanding balances and recent transactions
5. THE Frontend SHALL implement data export functionality for sales reports and customer data in CSV format

### Requirement 10: API Integration and State Management

**User Story:** As a frontend developer, I want proper API integration and state management, so that the application maintains consistent data across components.

#### Acceptance Criteria

1. THE Frontend SHALL implement axios or fetch-based API client with base URL configuration and request/response interceptors
2. THE Frontend SHALL implement React Context or Redux for global state management of user authentication and cart data
3. WHEN an API request fails, THEN THE Frontend SHALL display toast notifications with error messages and retry options
4. THE Frontend SHALL implement optimistic UI updates for khata transactions with rollback on failure
5. THE Frontend SHALL cache product list data with 5-minute expiration to reduce unnecessary API calls

### Requirement 11: ML Model Training Pipeline

**User Story:** As a data scientist, I want automated model training pipelines, so that prediction models stay accurate with new data.

#### Acceptance Criteria

1. THE System SHALL implement a training script that loads historical price data from MongoDB and preprocesses it for model training
2. THE System SHALL split data into training (80%) and testing (20%) sets with stratified sampling for diamond data
3. THE System SHALL evaluate model performance using metrics including RMSE, MAE, and R-squared score
4. THE System SHALL save trained models to disk in pickle or joblib format with versioning
5. THE System SHALL log training metrics and model performance to a training_logs collection in MongoDB

### Requirement 12: Deployment Configuration

**User Story:** As a DevOps engineer, I want proper deployment configuration, so that the application can be deployed to production environments.

#### Acceptance Criteria

1. THE System SHALL provide requirements.txt file listing all Python dependencies with pinned versions
2. THE System SHALL provide environment variable configuration for MongoDB connection string, JWT secret, and API keys
3. THE System SHALL implement health check endpoint at GET /api/health that returns server status and database connectivity
4. THE System SHALL provide Docker configuration files for containerizing Flask backend and MongoDB database
5. THE System SHALL implement CORS configuration that restricts origins to allowed domains in production environment
